using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Services;

public interface IExamSessionService
{
    Task<ExamSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamSession>> ListAsync(CancellationToken cancellationToken = default);
    Task<(IEnumerable<ExamSession> Items, int TotalCount)> SearchAsync(
        string? search,
        bool? isActive,
        DateOnly? startFrom,
        DateOnly? startTo,
        DateOnly? endFrom,
        DateOnly? endTo,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<ExamSession> AddAsync(CreateExamSessionDto sessionDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateExamSessionDto sessionDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class ExamSessionService : IExamSessionService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ExamSessionService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<ExamSession?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.ExamSessions.GetByIdAsync(id);

    public Task<IEnumerable<ExamSession>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.ExamSessions.ListAsync(cancellationToken);

    public Task<(IEnumerable<ExamSession> Items, int TotalCount)> SearchAsync(
        string? search,
        bool? isActive,
        DateOnly? startFrom,
        DateOnly? startTo,
        DateOnly? endFrom,
        DateOnly? endTo,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        _uow.ExamSessions.SearchAsync(search, isActive, startFrom, startTo, endFrom, endTo, page, pageSize, cancellationToken);

    public async Task<ExamSession> AddAsync(CreateExamSessionDto sessionDto, CancellationToken cancellationToken = default)
    {
        if (sessionDto.StartDate > sessionDto.EndDate)
            throw new BusinessRuleException("Session start date must be on or before end date.");

        var overlaps = await _uow.ExamSessions.OverlapsAsync(sessionDto.StartDate, sessionDto.EndDate, null, cancellationToken);
        if (overlaps)
            throw new BusinessRuleException("Exam session dates cannot overlap with an existing session.");

        var session = _mapper.Map<ExamSession>(sessionDto);
        if (session.Id == Guid.Empty) session.Id = Guid.NewGuid();

        await _uow.ExamSessions.AddAsync(session, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task UpdateAsync(Guid id, UpdateExamSessionDto sessionDto, CancellationToken cancellationToken = default)
    {
        if (sessionDto.StartDate > sessionDto.EndDate)
            throw new BusinessRuleException("Session start date must be on or before end date.");

        var session = await _uow.ExamSessions.GetByIdAsync(id);
        if (session is null)
            throw new EntityNotFoundException($"Exam session with ID '{id}' not found.");

        var overlaps = await _uow.ExamSessions.OverlapsAsync(sessionDto.StartDate, sessionDto.EndDate, id, cancellationToken);
        if (overlaps)
            throw new BusinessRuleException("Exam session dates cannot overlap with an existing session.");

        var hasOutsideTerms = await _uow.ExamTerms.ExistsOutsideSessionAsync(id, sessionDto.StartDate, sessionDto.EndDate, cancellationToken);
        if (hasOutsideTerms)
            throw new BusinessRuleException("Cannot set dates that exclude existing exam terms for this session.");

        _mapper.Map(sessionDto, session);
        await _uow.ExamSessions.UpdateAsync(session, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var session = await _uow.ExamSessions.GetByIdAsync(id);
        if (session is null)
            throw new EntityNotFoundException($"Exam session with ID '{id}' not found.");

        await _uow.ExamSessions.RemoveAsync(session, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }
}
