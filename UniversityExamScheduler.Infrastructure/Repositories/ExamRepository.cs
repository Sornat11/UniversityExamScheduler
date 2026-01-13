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
}
