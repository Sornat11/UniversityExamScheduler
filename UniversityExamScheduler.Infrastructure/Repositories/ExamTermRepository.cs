using System;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class ExamTermRepository : BaseRepository<ExamTerm>, IExamTermRepository
{
    public ExamTermRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<ExamTerm>> ListByCourseAsync(Guid courseId, CancellationToken cancellationToken = default) =>
        await _set.Where(t => t.CourseId == courseId).ToListAsync(cancellationToken);

    public Task<bool> ExistsOutsideSessionAsync(Guid sessionId, DateOnly start, DateOnly end, CancellationToken cancellationToken = default)
    {
        return _set.AnyAsync(
            t => t.SessionId == sessionId && (t.Date < start || t.Date > end),
            cancellationToken);
    }
}
