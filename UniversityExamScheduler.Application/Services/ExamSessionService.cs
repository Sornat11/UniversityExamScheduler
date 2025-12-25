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

    public async Task<ExamSession> AddAsync(CreateExamSessionDto sessionDto, CancellationToken cancellationToken = default)
    {
        if (sessionDto.StartDate > sessionDto.EndDate)
            throw new ArgumentException("Session start date cannot be after end date.");

        var session = _mapper.Map<ExamSession>(sessionDto);
        if (session.Id == Guid.Empty) session.Id = Guid.NewGuid();

        await _uow.ExamSessions.AddAsync(session, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return session;
    }

    public async Task UpdateAsync(Guid id, UpdateExamSessionDto sessionDto, CancellationToken cancellationToken = default)
    {
        if (sessionDto.StartDate > sessionDto.EndDate)
            throw new ArgumentException("Session start date cannot be after end date.");

        var session = await _uow.ExamSessions.GetByIdAsync(id);
        if (session is null)
            throw new EntityNotFoundException($"Exam session with ID '{id}' not found.");

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
