using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace UniversityExamScheduler.Domain.Entities;

[Table("group_members")]
public class GroupMember
{
    [Column("group_id")]
    public Guid GroupId { get; set; }
    public StudentGroup? Group { get; set; }

    [Column("student_id")]
    public Guid StudentId { get; set; }
    public User? Student { get; set; }
}
