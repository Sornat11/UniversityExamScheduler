using System;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Contracts;

public interface IUserRepository : IBaseRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<int> CountByRoleAsync(Role role, CancellationToken cancellationToken = default);
    Task<(IEnumerable<User> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize, CancellationToken cancellationToken = default);
}
