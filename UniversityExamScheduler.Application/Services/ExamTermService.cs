using System;
using System.Collections.Generic;
using System.Linq;
using AutoMapper;
using Microsoft.Extensions.Logging;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Services;

public interface IExamTermService
{
    Task<ExamTerm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTerm>> ListAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTerm>> ListWithDetailsAsync(Guid? lecturerId, Guid? studentId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<ExamTerm> Items, int TotalCount)> SearchWithDetailsAsync(
        Guid? lecturerId,
        Guid? studentId,
        Guid? courseId,
        Guid? sessionId,
        Guid? roomId,
        ExamTermStatus? status,
        ExamTermType? type,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<ExamTerm> AddAsync(CreateExamTermDto termDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateExamTermDto termDto, CancellationToken cancellationToken = default, Guid? changedBy = null);
    Task UpdateStatusAsync(
        Guid id,
        ExamTermStatus status,
        string? rejectionReason,
        CancellationToken cancellationToken = default,
        Guid? changedBy = null);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default, Guid? changedBy = null);
}

public class ExamTermService : IExamTermService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;
    private readonly ILogger<ExamTermService> _logger;

    public ExamTermService(IUnitOfWork uow, IMapper mapper, ILogger<ExamTermService> logger)
    {
        _uow = uow;
        _mapper = mapper;
        _logger = logger;
    }

    public Task<ExamTerm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.GetByIdAsync(id);

    public Task<IEnumerable<ExamTerm>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.ListAsync(cancellationToken);

    public Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.ListByCourseAsync(courseId, cancellationToken);

    public Task<IEnumerable<ExamTerm>> ListWithDetailsAsync(Guid? lecturerId, Guid? studentId, CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.ListWithDetailsAsync(lecturerId, studentId, cancellationToken);

    public Task<(IEnumerable<ExamTerm> Items, int TotalCount)> SearchWithDetailsAsync(
        Guid? lecturerId,
        Guid? studentId,
        Guid? courseId,
        Guid? sessionId,
        Guid? roomId,
        ExamTermStatus? status,
        ExamTermType? type,
        DateOnly? dateFrom,
        DateOnly? dateTo,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.SearchWithDetailsAsync(
            lecturerId,
            studentId,
            courseId,
            sessionId,
            roomId,
            status,
            type,
            dateFrom,
            dateTo,
            search,
            page,
            pageSize,
            cancellationToken);

    public async Task<ExamTerm> AddAsync(CreateExamTermDto termDto, CancellationToken cancellationToken = default)
    {
        await ValidateSessionDatesAsync(termDto.SessionId, termDto.Date, cancellationToken);
        ValidateTimeRange(termDto.StartTime, termDto.EndTime);

        var term = _mapper.Map<ExamTerm>(termDto);
        if (term.Id == Guid.Empty) term.Id = Guid.NewGuid();

        var conflict = await DetectConflictsAsync(
            term.CourseId,
            term.RoomId,
            term.Date,
            term.StartTime,
            term.EndTime,
            excludeId: null,
            cancellationToken);

        if (conflict.HasAny)
        {
            _logger.LogWarning("Exam term conflict detected for course {CourseId}: {Conflict}", term.CourseId, conflict.ToLabel());
            throw new BusinessRuleException(BuildConflictMessage(conflict));
        }

        var createdBy = ResolveChangedBy(term.CreatedBy, null);

        await _uow.ExamTerms.AddAsync(term, cancellationToken);
        await AddHistoryAsync(
            term,
            ExamTermStatus.Draft,
            previousDate: null,
            BuildHistoryComment("Term created."),
            createdBy,
            cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Exam term created {TermId} for course {CourseId} on {Date} {Start}-{End} status {Status} by {CreatedBy}",
            term.Id,
            term.CourseId,
            term.Date,
            term.StartTime,
            term.EndTime,
            term.Status,
            createdBy);

        return term;
    }

    public async Task UpdateAsync(
        Guid id,
        UpdateExamTermDto termDto,
        CancellationToken cancellationToken = default,
        Guid? changedBy = null)
    {
        await ValidateSessionDatesAsync(termDto.SessionId, termDto.Date, cancellationToken);
        ValidateTimeRange(termDto.StartTime, termDto.EndTime);

        var term = await _uow.ExamTerms.GetByIdAsync(id);
        if (term is null)
            throw new EntityNotFoundException($"Exam term with ID '{id}' not found.");

        var previousStatus = term.Status;
        var previousDate = ToDateTime(term.Date, term.StartTime);

        _mapper.Map(termDto, term);

        var conflict = await DetectConflictsAsync(
            term.CourseId,
            term.RoomId,
            term.Date,
            term.StartTime,
            term.EndTime,
            excludeId: term.Id,
            cancellationToken);

        if (conflict.HasAny)
        {
            _logger.LogWarning("Exam term conflict detected for term {TermId}: {Conflict}", term.Id, conflict.ToLabel());
            throw new BusinessRuleException(BuildConflictMessage(conflict));
        }

        var resolvedChangedBy = ResolveChangedBy(term.CreatedBy, changedBy);

        await _uow.ExamTerms.UpdateAsync(term, cancellationToken);
        await AddHistoryAsync(
            term,
            previousStatus,
            previousDate,
            BuildHistoryComment("Term updated."),
            resolvedChangedBy,
            cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Exam term updated {TermId}. Status {PreviousStatus} -> {NewStatus} by {ChangedBy}",
            term.Id,
            previousStatus,
            term.Status,
            resolvedChangedBy);

    }

    public async Task UpdateStatusAsync(
        Guid id,
        ExamTermStatus status,
        string? rejectionReason,
        CancellationToken cancellationToken = default,
        Guid? changedBy = null)
    {
        var term = await _uow.ExamTerms.GetByIdAsync(id);
        if (term is null)
            throw new EntityNotFoundException($"Exam term with ID '{id}' not found.");

        var previousStatus = term.Status;
        var previousDate = ToDateTime(term.Date, term.StartTime);

        term.Status = status;
        term.RejectionReason = rejectionReason;

        if (status != ExamTermStatus.Rejected)
        {
            var conflict = await DetectConflictsAsync(
                term.CourseId,
                term.RoomId,
                term.Date,
                term.StartTime,
                term.EndTime,
                excludeId: term.Id,
                cancellationToken);

            if (conflict.HasAny)
            {
                _logger.LogWarning("Exam term conflict detected for term {TermId}: {Conflict}", term.Id, conflict.ToLabel());
                throw new BusinessRuleException(BuildConflictMessage(conflict));
            }
        }

        var resolvedChangedBy = ResolveChangedBy(term.CreatedBy, changedBy);

        await _uow.ExamTerms.UpdateAsync(term, cancellationToken);
        await AddHistoryAsync(
            term,
            previousStatus,
            previousDate,
            BuildStatusComment(term.Status, rejectionReason),
            resolvedChangedBy,
            cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Exam term status updated {TermId}. {PreviousStatus} -> {NewStatus} by {ChangedBy}",
            term.Id,
            previousStatus,
            term.Status,
            resolvedChangedBy);

    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default, Guid? changedBy = null)
    {
        var term = await _uow.ExamTerms.GetByIdAsync(id);
        if (term is null)
            throw new EntityNotFoundException($"Exam term with ID '{id}' not found.");

        var resolvedChangedBy = ResolveChangedBy(term.CreatedBy, changedBy);

        await _uow.ExamTerms.RemoveAsync(term, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Exam term deleted {TermId} by {ChangedBy}",
            term.Id,
            resolvedChangedBy);
    }

    private async Task ValidateSessionDatesAsync(Guid sessionId, DateOnly date, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var session = await _uow.ExamSessions.GetByIdAsync(sessionId);
        if (session is null)
            throw new EntityNotFoundException($"Exam session with ID '{sessionId}' not found.");

        if (date < DateOnly.FromDateTime(DateTime.UtcNow.Date))
            throw new ArgumentException("Exam term date cannot be in the past.");

        if (date < session.StartDate || date > session.EndDate)
            throw new ArgumentException("Exam term date must be within the exam session range.");
    }

    private static void ValidateTimeRange(TimeOnly start, TimeOnly end)
    {
        if (start >= end)
            throw new ArgumentException("Start time must be before end time.");
    }

    private async Task<ConflictSummary> DetectConflictsAsync(
        Guid courseId,
        Guid? roomId,
        DateOnly date,
        TimeOnly start,
        TimeOnly end,
        Guid? excludeId,
        CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var exam = await _uow.Exams.GetByIdAsync(courseId);
        if (exam is null)
        {
            throw new EntityNotFoundException($"Exam with ID '{courseId}' not found.");
        }

        var overlaps = await _uow.ExamTerms.ListOverlappingAsync(date, start, end, excludeId, cancellationToken);

        var roomConflict = roomId.HasValue && overlaps.Any(t => t.RoomId == roomId.Value);
        var lecturerConflict = overlaps.Any(t => t.Exam != null && t.Exam.LecturerId == exam.LecturerId);

        var sameDay = await _uow.ExamTerms.ListOverlappingAsync(
            date,
            TimeOnly.MinValue,
            TimeOnly.MaxValue,
            excludeId,
            cancellationToken);
        var groupConflict = sameDay.Any(t => t.Exam != null && t.Exam.GroupId == exam.GroupId);

        return new ConflictSummary(roomConflict, lecturerConflict, groupConflict);
    }

    private async Task AddHistoryAsync(
        ExamTerm term,
        ExamTermStatus previousStatus,
        DateTime? previousDate,
        string? comment,
        Guid changedBy,
        CancellationToken cancellationToken)
    {
        if (changedBy == Guid.Empty)
        {
            return;
        }

        var history = new ExamTermHistory
        {
            Id = Guid.NewGuid(),
            ExamTermId = term.Id,
            ChangedBy = changedBy,
            ChangedAt = DateTime.UtcNow,
            PreviousStatus = previousStatus,
            NewStatus = term.Status,
            PreviousDate = previousDate,
            NewDate = ToDateTime(term.Date, term.StartTime),
            Comment = comment
        };

        await _uow.ExamTermHistories.AddAsync(history, cancellationToken);
    }

    private static Guid ResolveChangedBy(Guid createdBy, Guid? changedBy)
    {
        if (changedBy.HasValue && changedBy.Value != Guid.Empty)
        {
            return changedBy.Value;
        }

        return createdBy;
    }

    private static DateTime ToDateTime(DateOnly date, TimeOnly time) =>
        DateTime.SpecifyKind(date.ToDateTime(time), DateTimeKind.Utc);

    private static string BuildHistoryComment(string baseComment)
    {
        return baseComment;
    }

    private static string BuildStatusComment(ExamTermStatus status, string? rejectionReason)
    {
        var comment = $"Status set to {status}.";

        if (status == ExamTermStatus.Rejected && !string.IsNullOrWhiteSpace(rejectionReason))
        {
            comment = $"{comment} Reason: {rejectionReason}.";
        }

        return BuildHistoryComment(comment);
    }

    private static string BuildConflictMessage(ConflictSummary conflict)
    {
        var details = conflict.ToLabel();
        return string.IsNullOrWhiteSpace(details)
            ? "Exam term conflicts with existing schedule."
            : $"Exam term conflicts with existing schedule ({details}).";
    }

    private sealed record ConflictSummary(bool Room, bool Lecturer, bool Group)
    {
        public bool HasAny => Room || Lecturer || Group;

        public string ToLabel()
        {
            var parts = new List<string>();
            if (Room) parts.Add("room");
            if (Lecturer) parts.Add("lecturer");
            if (Group) parts.Add("group");
            return string.Join(", ", parts);
        }
    }
}
