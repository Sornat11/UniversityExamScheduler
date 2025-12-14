using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamTermHistoryRepository : IBaseRepository<ExamTermHistory>
{
    Task<IEnumerable<ExamTermHistory>> ListByExamTermAsync(Guid examTermId, CancellationToken cancellationToken = default);
}