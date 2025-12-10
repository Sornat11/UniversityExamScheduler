using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Domain.Entities;

[Table("student_groups")]
public class StudentGroup
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("name")]
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Column("field_of_study")]
    [Required]
    [MaxLength(100)]
    public string FieldOfStudy { get; set; } = string.Empty;

    [Column("study_type")]
    [Required]
    public StudyType StudyType { get; set; }

    [Column("semester")]
    public int Semester { get; set; }

    [Column("starosta_id")]
    [ForeignKey(nameof(Starosta))]
    public Guid StarostaId { get; set; }
    public User? Starosta { get; set; }

    public ICollection<GroupMember> Members { get; set; } = new List<GroupMember>();
    public ICollection<Exam> Courses { get; set; } = new List<Exam>();
}
