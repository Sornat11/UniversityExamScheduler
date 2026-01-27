using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;



public class ExamTermHistoryRepository : BaseRepository<ExamTermHistory>, IExamTermHistoryRepository
{
    public ExamTermHistoryRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<ExamTermHistory>> ListByExamTermAsync(Guid examTermId, CancellationToken cancellationToken = default) =>
        await _set.Where(h => h.ExamTermId == examTermId).ToListAsync(cancellationToken);

    public async Task<(IEnumerable<ExamTermHistory> Items, int TotalCount)> SearchAsync(
        Guid? examTermId,
        Guid? changedBy,
        ExamTermStatus? previousStatus,
        ExamTermStatus? newStatus,
        DateTime? changedFrom,
        DateTime? changedTo,
        string? search,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = _set.AsNoTracking().AsQueryable();

        if (examTermId.HasValue)
        {
            query = query.Where(h => h.ExamTermId == examTermId.Value);
        }

        if (changedBy.HasValue)
        {
            query = query.Where(h => h.ChangedBy == changedBy.Value);
        }

        if (previousStatus.HasValue)
        {
            query = query.Where(h => h.PreviousStatus == previousStatus.Value);
        }

        if (newStatus.HasValue)
        {
            query = query.Where(h => h.NewStatus == newStatus.Value);
        }

        if (changedFrom.HasValue)
        {
            query = query.Where(h => h.ChangedAt >= changedFrom.Value);
        }

        if (changedTo.HasValue)
        {
            query = query.Where(h => h.ChangedAt <= changedTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(h => h.Comment != null && h.Comment.ToLower().Contains(q));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderByDescending(h => h.ChangedAt)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
