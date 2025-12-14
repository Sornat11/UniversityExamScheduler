using System;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;



public class ExamSessionRepository : BaseRepository<ExamSession>, IExamSessionRepository
{
    public ExamSessionRepository(ApplicationDbContext context) : base(context) {}
}
