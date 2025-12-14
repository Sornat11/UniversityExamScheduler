using UniversityExamScheduler.Application.Contracts;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.Infrastructure.Repositories;

namespace UniversityExamScheduler.Infrastructure.Repositories;


public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;


    public UnitOfWork(
        ApplicationDbContext context,
        IUserRepository users,
        IStudentGroupRepository studentGroups,
        IExamRepository exams,
        IExamSessionRepository examSessions,
        IRoomRepository rooms,
        IExamTermRepository examTerms,
        IExamTermHistoryRepository examTermHistories)
    {
        _context = context;
        Users = users;
        StudentGroups = studentGroups;
        Exams = exams;
        ExamSessions = examSessions;
        Rooms = rooms;
        ExamTerms = examTerms;
        ExamTermHistories = examTermHistories;
    }

    public IUserRepository Users { get; }
    public IStudentGroupRepository StudentGroups { get; }
    public IExamRepository Exams { get; }
    public IExamSessionRepository ExamSessions { get; }
    public IRoomRepository Rooms { get; }
    public IExamTermRepository ExamTerms { get; }
    public IExamTermHistoryRepository ExamTermHistories { get; }

    public Task<int> SaveChangesAsync(CancellationToken ct = default)
        => _context.SaveChangesAsync(ct);
}

