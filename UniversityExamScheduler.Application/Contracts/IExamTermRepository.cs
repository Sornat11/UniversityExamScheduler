using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamTermRepository : IBaseRepository<ExamTerm>
{
    Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default);
    Task<bool> ExistsOutsideSessionAsync(Guid sessionId, DateOnly start, DateOnly end, CancellationToken cancellationToken = default);
}
