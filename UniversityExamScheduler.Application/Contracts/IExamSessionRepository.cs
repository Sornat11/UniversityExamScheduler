using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamSessionRepository : IBaseRepository<ExamSession>
{
    Task<bool> OverlapsAsync(DateOnly start, DateOnly end, Guid? excludeId = null, CancellationToken cancellationToken = default);
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
}
