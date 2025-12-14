
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
}
