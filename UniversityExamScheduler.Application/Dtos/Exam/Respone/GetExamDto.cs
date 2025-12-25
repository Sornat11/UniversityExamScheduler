using System;

namespace UniversityExamScheduler.Application.Dtos.Exam.Respone;

public class GetExamDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid LecturerId { get; set; }
    public Guid GroupId { get; set; }
}
