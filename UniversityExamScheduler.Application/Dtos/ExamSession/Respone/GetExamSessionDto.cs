using System;

namespace UniversityExamScheduler.Application.Dtos.ExamSession.Respone;

public class GetExamSessionDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; }
}
