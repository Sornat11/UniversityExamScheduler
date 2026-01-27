using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;


public class ExamRepository : BaseRepository<Exam>, IExamRepository
{
    public ExamRepository(ApplicationDbContext context) : base(context) {}

    public async Task<IEnumerable<Exam>> ListForStudentAsync(Guid studentId, CancellationToken cancellationToken = default) =>
        await _set.AsNoTracking()
            .Where(e => _context.GroupMembers.Any(m => m.StudentId == studentId && m.GroupId == e.GroupId))
            .ToListAsync(cancellationToken);

    public async Task<(IEnumerable<Exam> Items, int TotalCount)> SearchAsync(
        string? search,
        Guid? lecturerId,
        Guid? groupId,
        Guid? studentId,
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
            query = query.Where(e => e.Name.ToLower().Contains(q));
        }

        if (lecturerId.HasValue)
        {
            query = query.Where(e => e.LecturerId == lecturerId.Value);
        }

        if (groupId.HasValue)
        {
            query = query.Where(e => e.GroupId == groupId.Value);
        }

        if (studentId.HasValue)
        {
            query = query.Where(e => _context.GroupMembers.Any(m => m.StudentId == studentId.Value && m.GroupId == e.GroupId));
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(e => e.Name)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
