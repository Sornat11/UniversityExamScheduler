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
}
