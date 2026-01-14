using System;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.User.Respone;

public class GetUserStudentGroupDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string FieldOfStudy { get; set; } = string.Empty;
    public StudyType StudyType { get; set; }
    public int Semester { get; set; }
}
