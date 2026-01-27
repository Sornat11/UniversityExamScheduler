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

public class StudentGroupRepository : BaseRepository<StudentGroup>, IStudentGroupRepository
{
    public StudentGroupRepository(ApplicationDbContext context) : base(context) { }

    public Task<StudentGroup?> GetByNameAsync(string name, CancellationToken cancellationToken = default) =>
        _set.FirstOrDefaultAsync(g => g.Name == name, cancellationToken);

    public Task<bool> IsMemberAsync(Guid studentId, Guid groupId, CancellationToken cancellationToken = default) =>
        _context.GroupMembers.AnyAsync(m => m.StudentId == studentId && m.GroupId == groupId, cancellationToken);

    public async Task<(IEnumerable<StudentGroup> Items, int TotalCount)> SearchAsync(
        string? name,
        string? search,
        string? fieldOfStudy,
        StudyType? studyType,
        int? semester,
        Guid? starostaId,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize < 1 ? 20 : Math.Min(pageSize, 100);

        var query = _set.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(name))
        {
            var exactName = name.Trim().ToLower();
            query = query.Where(g => g.Name.ToLower() == exactName);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var q = search.Trim().ToLower();
            query = query.Where(g =>
                g.Name.ToLower().Contains(q) ||
                g.FieldOfStudy.ToLower().Contains(q));
        }

        if (!string.IsNullOrWhiteSpace(fieldOfStudy))
        {
            var field = fieldOfStudy.Trim().ToLower();
            query = query.Where(g => g.FieldOfStudy.ToLower() == field);
        }

        if (studyType.HasValue)
        {
            query = query.Where(g => g.StudyType == studyType.Value);
        }

        if (semester.HasValue)
        {
            query = query.Where(g => g.Semester == semester.Value);
        }

        if (starostaId.HasValue)
        {
            query = query.Where(g => g.StarostaId == starostaId.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var items = await query
            .OrderBy(g => g.FieldOfStudy)
            .ThenBy(g => g.Semester)
            .ThenBy(g => g.Name)
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToListAsync(cancellationToken);

        return (items, total);
    }
}
