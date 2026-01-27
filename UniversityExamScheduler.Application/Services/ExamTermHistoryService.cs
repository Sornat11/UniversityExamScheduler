using System;
using AutoMapper;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Services;

public interface IExamTermHistoryService
{
    Task<ExamTermHistory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTermHistory>> ListAsync(CancellationToken cancellationToken = default);
    Task<IEnumerable<ExamTermHistory>> ListByExamTermAsync(Guid examTermId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<ExamTermHistory> Items, int TotalCount)> SearchAsync(
        Guid? examTermId,
        Guid? changedBy,
        ExamTermStatus? previousStatus,
        ExamTermStatus? newStatus,
        DateTime? changedFrom,
        DateTime? changedTo,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
    Task<ExamTermHistory> AddAsync(CreateExamTermHistoryDto historyDto, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateExamTermHistoryDto historyDto, CancellationToken cancellationToken = default);
    Task RemoveAsync(Guid id, CancellationToken cancellationToken = default);
}

public class ExamTermHistoryService : IExamTermHistoryService
{
    private readonly IUnitOfWork _uow;
    private readonly IMapper _mapper;

    public ExamTermHistoryService(IUnitOfWork uow, IMapper mapper)
    {
        _uow = uow;
        _mapper = mapper;
    }

    public Task<ExamTermHistory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
        _uow.ExamTermHistories.GetByIdAsync(id);

    public Task<IEnumerable<ExamTermHistory>> ListAsync(CancellationToken cancellationToken = default) =>
        _uow.ExamTermHistories.ListAsync(cancellationToken);

    public Task<IEnumerable<ExamTermHistory>> ListByExamTermAsync(Guid examTermId, CancellationToken cancellationToken = default) =>
        _uow.ExamTermHistories.ListByExamTermAsync(examTermId, cancellationToken);

    public Task<(IEnumerable<ExamTermHistory> Items, int TotalCount)> SearchAsync(
        Guid? examTermId,
        Guid? changedBy,
        ExamTermStatus? previousStatus,
        ExamTermStatus? newStatus,
        DateTime? changedFrom,
        DateTime? changedTo,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default) =>
        _uow.ExamTermHistories.SearchAsync(
            examTermId,
            changedBy,
            previousStatus,
            newStatus,
            changedFrom,
            changedTo,
            search,
            page,
            pageSize,
            cancellationToken);

    public async Task<ExamTermHistory> AddAsync(CreateExamTermHistoryDto historyDto, CancellationToken cancellationToken = default)
    {
        await EnsureExamTermExists(historyDto.ExamTermId);

        var history = _mapper.Map<ExamTermHistory>(historyDto);
        if (history.Id == Guid.Empty) history.Id = Guid.NewGuid();
        if (history.ChangedAt == default) history.ChangedAt = DateTime.UtcNow;

        await _uow.ExamTermHistories.AddAsync(history, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
        return history;
    }

    public async Task UpdateAsync(Guid id, UpdateExamTermHistoryDto historyDto, CancellationToken cancellationToken = default)
    {
        await EnsureExamTermExists(historyDto.ExamTermId);

        var history = await _uow.ExamTermHistories.GetByIdAsync(id);
        if (history is null)
            throw new EntityNotFoundException($"Exam term history with ID '{id}' not found.");

        _mapper.Map(historyDto, history);
        await _uow.ExamTermHistories.UpdateAsync(history, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    public async Task RemoveAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var history = await _uow.ExamTermHistories.GetByIdAsync(id);
        if (history is null)
            throw new EntityNotFoundException($"Exam term history with ID '{id}' not found.");

        await _uow.ExamTermHistories.RemoveAsync(history, cancellationToken);
        await _uow.SaveChangesAsync(cancellationToken);
    }

    private async Task EnsureExamTermExists(Guid examTermId)
    {
        var term = await _uow.ExamTerms.GetByIdAsync(examTermId);
        if (term is null)
            throw new EntityNotFoundException($"Exam term with ID '{examTermId}' not found.");
    }
}
