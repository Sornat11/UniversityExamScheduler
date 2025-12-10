using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace UniversityExamScheduler.Domain.Entities;

[Table("courses")]
public class Exam
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column("lecturer_id")]
    [ForeignKey(nameof(Lecturer))]
    public Guid LecturerId { get; set; }
    public User? Lecturer { get; set; }

    [Column("group_id")]
    [ForeignKey(nameof(Group))]
    public Guid GroupId { get; set; }
    public StudentGroup? Group { get; set; }

    public ICollection<ExamTerm> ExamTerms { get; set; } = new List<ExamTerm>();
}
