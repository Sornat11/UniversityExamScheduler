using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IExamRepository  : IBaseRepository<Exam>
{
    Task<IEnumerable<Exam>> ListForStudentAsync(Guid studentId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<Exam> Items, int TotalCount)> SearchAsync(
        string? search,
        Guid? lecturerId,
        Guid? groupId,
        Guid? studentId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
