using System;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.ExamTerm.Request;

public class CreateExamTermDto
{
    public Guid CourseId { get; set; }
    public Guid SessionId { get; set; }
    public Guid? RoomId { get; set; }
    public DateOnly Date { get; set; }
    public TimeOnly StartTime { get; set; }
    public TimeOnly EndTime { get; set; }
    public ExamTermType Type { get; set; }
    public ExamTermStatus Status { get; set; }
    public Guid CreatedBy { get; set; }
    public string? RejectionReason { get; set; }
}
