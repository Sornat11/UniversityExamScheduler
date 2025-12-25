using System;

namespace UniversityExamScheduler.Application.Dtos.ExamSession.Request;

public class UpdateExamSessionDto
{
    public string Name { get; set; } = string.Empty;
    public DateOnly StartDate { get; set; }
    public DateOnly EndDate { get; set; }
    public bool IsActive { get; set; }
}
