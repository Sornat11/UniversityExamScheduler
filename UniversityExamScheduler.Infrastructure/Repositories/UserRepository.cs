using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class UserRepository : BaseRepository<User>, IUserRepository
{
    public UserRepository(ApplicationDbContext context) : base(context) { }

    public Task<User?> GetByIdWithGroupsAsync(Guid id, CancellationToken cancellationToken = default) =>
        _set
            .Include(u => u.GroupMemberships)
            .ThenInclude(m => m.Group)
            .FirstOrDefaultAsync(u => u.Id == id, cancellationToken);

    public Task<User?> GetByEmailAsync(string email, CancellationToken cancellationToken = default) =>
        _set
            .Include(u => u.GroupMemberships)
            .ThenInclude(m => m.Group)
            .FirstOrDefaultAsync(u => u.Email == email, cancellationToken);

    public Task<int> CountByRoleAsync(Role role, CancellationToken cancellationToken = default) =>
        _set.CountAsync(u => u.Role == role, cancellationToken);

    public async Task<(IEnumerable<User> Items, int TotalCount)> SearchAsync(string? query, int page, int pageSize, CancellationToken cancellationToken = default)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var users = _set
            .AsNoTracking()
            .Include(u => u.GroupMemberships)
            .ThenInclude(m => m.Group)
            .AsQueryable();
        if (!string.IsNullOrWhiteSpace(query))
        {
            var q = query.Trim().ToLower();
            users = users.Where(u =>
                u.Email.ToLower().Contains(q) ||
                u.FirstName.ToLower().Contains(q) ||
                u.LastName.ToLower().Contains(q));
        }

        var total = await users.CountAsync(cancellationToken);
        var items = await users
            .OrderBy(u => u.LastName)
            .ThenBy(u => u.FirstName)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
