using System;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.StudentGroup.Request;

public class UpdateStudentGroupDto
{
    public string Name { get; set; } = string.Empty;
    public string FieldOfStudy { get; set; } = string.Empty;
    public StudyType StudyType { get; set; }
    public int Semester { get; set; }
    public Guid StarostaId { get; set; }
}
