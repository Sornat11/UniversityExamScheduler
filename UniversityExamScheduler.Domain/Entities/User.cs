using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Domain.Entities;

[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("external_id")]
    [MaxLength(100)]
    public string? ExternalId { get; set; }

    [Column("email")]
    [Required]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Column("first_name")]
    [Required]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Column("last_name")]
    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Column("role")]
    [Required]
    public Role Role { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; } = true;

    public ICollection<GroupMember> GroupMemberships { get; set; } = new List<GroupMember>();
    public ICollection<StudentGroup> StarostaGroups { get; set; } = new List<StudentGroup>();
}
