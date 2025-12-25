using System;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.ExamTermHistory.Respone;

public class GetExamTermHistoryDto
{
    public Guid Id { get; set; }
    public Guid ExamTermId { get; set; }
    public Guid ChangedBy { get; set; }
    public DateTime ChangedAt { get; set; }
    public ExamTermStatus PreviousStatus { get; set; }
    public ExamTermStatus NewStatus { get; set; }
    public DateTime? PreviousDate { get; set; }
    public DateTime? NewDate { get; set; }
    public string? Comment { get; set; }
}
