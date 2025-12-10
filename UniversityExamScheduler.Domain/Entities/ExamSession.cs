using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniversityExamScheduler.Domain.Entities;

[Table("exam_sessions")]
public class ExamSession
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("start_date")]
    public DateOnly StartDate { get; set; }

    [Column("end_date")]
    public DateOnly EndDate { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    public ICollection<ExamTerm> ExamTerms { get; set; } = new List<ExamTerm>();
}
