using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class ExamSessionRepository : BaseRepository<ExamSession>, IExamSessionRepository
{
    public ExamSessionRepository(ApplicationDbContext context) : base(context) {}

    public Task<bool> OverlapsAsync(DateOnly start, DateOnly end, Guid? excludeId = null, CancellationToken cancellationToken = default)
    {
        var query = _set.AsNoTracking().AsQueryable();
        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return query.AnyAsync(
            s => start <= s.EndDate && end >= s.StartDate,
            cancellationToken);
    }

    public async Task<(IEnumerable<ExamSession> Items, int TotalCount)> SearchAsync(
        string? search,
        bool? isActive,
        DateOnly? startFrom,
        DateOnly? startTo,
        DateOnly? endFrom,
        DateOnly? endTo,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = _set.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(s => s.Name.ToLower().Contains(q));
        }

        if (isActive.HasValue)
        {
            query = query.Where(s => s.IsActive == isActive.Value);
        }

        if (startFrom.HasValue)
        {
            query = query.Where(s => s.StartDate >= startFrom.Value);
        }

        if (startTo.HasValue)
        {
            query = query.Where(s => s.StartDate <= startTo.Value);
        }

        if (endFrom.HasValue)
        {
            query = query.Where(s => s.EndDate >= endFrom.Value);
        }

        if (endTo.HasValue)
        {
            query = query.Where(s => s.EndDate <= endTo.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(s => s.StartDate)
            .ThenBy(s => s.Name)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
