using System;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamTermHistoryRepository : IBaseRepository<ExamTermHistory>
{
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
}
