namespace UniversityExamScheduler.Domain.Enums;

public enum ExamTermStatus
{
    Draft = 0,
    ProposedByLecturer = 1,
    ProposedByStudent = 2,
    Conflict = 3,
    Approved = 4,
    Finalized = 5,
    Rejected = 6
}
