using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Infrastructure.Persistence;

namespace UniversityExamScheduler.Infrastructure.Repositories;

public class StudentGroupRepository : BaseRepository<StudentGroup>, IStudentGroupRepository
{
    public StudentGroupRepository(ApplicationDbContext context) : base(context) { }

    public Task<StudentGroup?> GetByNameAsync(string name, CancellationToken cancellationToken = default) =>
        _set.FirstOrDefaultAsync(g => g.Name == name, cancellationToken);
}
