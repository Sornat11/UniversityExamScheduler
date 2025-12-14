using System;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;


public class ExamRepository : BaseRepository<Exam>, IExamRepository
{
    public ExamRepository(ApplicationDbContext context) : base(context) {}
}
