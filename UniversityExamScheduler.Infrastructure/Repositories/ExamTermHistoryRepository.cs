using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;



public class ExamTermHistoryRepository : BaseRepository<ExamTermHistory>, IExamTermHistoryRepository
{
    public ExamTermHistoryRepository(ApplicationDbContext context) : base(context) { }

    public async Task<IEnumerable<ExamTermHistory>> ListByExamTermAsync(Guid examTermId, CancellationToken cancellationToken = default) =>
        await _set.Where(h => h.ExamTermId == examTermId).ToListAsync(cancellationToken);
}
