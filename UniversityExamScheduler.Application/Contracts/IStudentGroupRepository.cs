using System;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Contracts;

public interface IStudentGroupRepository : IBaseRepository<StudentGroup>
{
    Task<StudentGroup?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
    Task<bool> IsMemberAsync(Guid studentId, Guid groupId, CancellationToken cancellationToken = default);
    Task<(IEnumerable<StudentGroup> Items, int TotalCount)> SearchAsync(
        string? name,
        string? search,
        string? fieldOfStudy,
        StudyType? studyType,
        int? semester,
        Guid? starostaId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default);
}
