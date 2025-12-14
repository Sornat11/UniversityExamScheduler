using System;
using UniversityExamScheduler.Domain.Entities;

namespace UniversityExamScheduler.Application.Contracts;

public interface IStudentGroupRepository : IBaseRepository<StudentGroup>
{
    Task<StudentGroup?> GetByNameAsync(string name, CancellationToken cancellationToken = default);
}
