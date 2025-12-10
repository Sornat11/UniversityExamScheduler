using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Domain.Entities;

[Table("exam_term_history")]
public class ExamTermHistory
{
    [Key]
    [Column("id")]
    public long Id { get; set; }

    [Column("exam_term_id")]
    [ForeignKey(nameof(ExamTerm))]
    public Guid ExamTermId { get; set; }
    public ExamTerm? ExamTerm { get; set; }

    [Column("changed_by")]
    [ForeignKey(nameof(ChangedByUser))]
    public Guid ChangedBy { get; set; }
    public User? ChangedByUser { get; set; }

    [Column("changed_at")]
    public DateTime ChangedAt { get; set; }

    [Column("previous_status")]
    public ExamTermStatus PreviousStatus { get; set; }

    [Column("new_status")]
    public ExamTermStatus NewStatus { get; set; }

    [Column("previous_date")]
    public DateTime? PreviousDate { get; set; }

    [Column("new_date")]
    public DateTime? NewDate { get; set; }

    [Column("comment")]
    [MaxLength(250)]
    public string? Comment { get; set; }
}
