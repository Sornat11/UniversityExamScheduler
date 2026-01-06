using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamSessionRepository : IBaseRepository<ExamSession>
{
    Task<bool> OverlapsAsync(DateOnly start, DateOnly end, Guid? excludeId = null, CancellationToken cancellationToken = default);
}
