using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Domain.Entities;

[Table("exam_terms")]
public class ExamTerm
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("course_id")]
    [ForeignKey(nameof(Exam))]
    public Guid CourseId { get; set; }
    public Exam? Exam { get; set; }

    [Column("session_id")]
    [ForeignKey(nameof(Session))]
    public Guid SessionId { get; set; }
    public ExamSession? Session { get; set; }

    [Column("room_id")]
    [ForeignKey(nameof(Room))]
    public Guid? RoomId { get; set; }
    public Room? Room { get; set; }

    [Column("date")]
    public DateOnly Date { get; set; }

    [Column("start_time")]
    public TimeOnly StartTime { get; set; }

    [Column("end_time")]
    public TimeOnly EndTime { get; set; }

    [Column("type")]
    public ExamTermType Type { get; set; }

    [Column("status")]
    public ExamTermStatus Status { get; set; }

    [Column("created_by")]
    [ForeignKey(nameof(CreatedByUser))]
    public Guid CreatedBy { get; set; }
    public User? CreatedByUser { get; set; }

    [Column("rejection_reason")]
    [MaxLength(500)]
    public string? RejectionReason { get; set; }

    public ICollection<ExamTermHistory> History { get; set; } = new List<ExamTermHistory>();
}
