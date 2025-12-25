using System;

namespace UniversityExamScheduler.Application.Dtos.Exam.Request;

public class UpdateExamDto
{
    public string Name { get; set; } = string.Empty;
    public Guid LecturerId { get; set; }
    public Guid GroupId { get; set; }
}
