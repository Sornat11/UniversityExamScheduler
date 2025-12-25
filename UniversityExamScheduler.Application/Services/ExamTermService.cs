using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Services;

public interface IExamTermService
{
    Task<ExamTerm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTerm>> ListAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task<ExamTerm> AddAsync(CreateExamTermDto termDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateExamTermDto termDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class ExamTermService : IExamTermService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ExamTermService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<ExamTerm?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.GetByIdAsync(id);

    public Task<IEnumerable<ExamTerm>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.ListAsync(cancellationToken);

    public Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        _uow.ExamTerms.ListByCourseAsync(courseId, cancellationToken);

    public async Task<ExamTerm> AddAsync(CreateExamTermDto termDto, CancellationToken cancellationToken = default)
    {
        await ValidateSessionDatesAsync(termDto.SessionId, termDto.Date, cancellationToken);
        ValidateTimeRange(termDto.StartTime, termDto.EndTime);

        var term = _mapper.Map<ExamTerm>(termDto);
        if (term.Id == Guid.Empty) term.Id = Guid.NewGuid();

        await _uow.ExamTerms.AddAsync(term, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return term;
    }

    public async Task UpdateAsync(Guid id, UpdateExamTermDto termDto, CancellationToken cancellationToken = default)
    {
        await ValidateSessionDatesAsync(termDto.SessionId, termDto.Date, cancellationToken);
        ValidateTimeRange(termDto.StartTime, termDto.EndTime);

        var term = await _uow.ExamTerms.GetByIdAsync(id);
        if (term is null)
            throw new EntityNotFoundException($"Exam term with ID '{id}' not found.");

        _mapper.Map(termDto, term);
        await _uow.ExamTerms.UpdateAsync(term, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var term = await _uow.ExamTerms.GetByIdAsync(id);
        if (term is null)
            throw new EntityNotFoundException($"Exam term with ID '{id}' not found.");

        await _uow.ExamTerms.RemoveAsync(term, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    private async Task ValidateSessionDatesAsync(Guid sessionId, DateOnly date, CancellationToken cancellationToken)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var session = await _uow.ExamSessions.GetByIdAsync(sessionId);
        if (session is null)
            throw new EntityNotFoundException($"Exam session with ID '{sessionId}' not found.");

        if (date < session.StartDate || date > session.EndDate)
            throw new ArgumentException("Exam term date must be within the exam session range.");
    }

    private static void ValidateTimeRange(TimeOnly start, TimeOnly end)
    {
        if (start >= end)
            throw new ArgumentException("Start time must be before end time.");
    }
}
