namespace UniversityExamScheduler.Application.Dtos.Exam.Request;

public class CreateExamDto
{
    public string Name { get; set; } = string.Empty;
    public Guid LecturerId { get; set; }
    public Guid GroupId { get; set; }
}
