using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Domain.Entities;

[Table("rooms")]
public class Room
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; }

    [Column("room_number")]
    [Required]
    [MaxLength(50)]
    public string RoomNumber { get; set; } = string.Empty;

    [Column("capacity")]
    public int Capacity { get; set; }

    [Column("type")]
    public RoomType Type { get; set; }

    [Column("is_available")]
    public bool IsAvailable { get; set; } = true;

    public ICollection<ExamTerm> ExamTerms { get; set; } = new List<ExamTerm>();
}
