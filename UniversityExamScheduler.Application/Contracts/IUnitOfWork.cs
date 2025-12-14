using System;

namespace UniversityExamScheduler.Application.Contracts;

public interface IUnitOfWork
{
    IUserRepository Users { get; }
    IStudentGroupRepository StudentGroups { get; }
    IExamRepository Exams { get; }
    IExamSessionRepository ExamSessions { get; }
    IRoomRepository Rooms { get; }
    IExamTermRepository ExamTerms { get; }
    IExamTermHistoryRepository ExamTermHistories { get; }

    Task<int> SaveChangesAsync(CancellationToken ct = default);

}

