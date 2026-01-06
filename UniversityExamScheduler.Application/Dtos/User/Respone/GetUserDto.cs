using System;
using System.ComponentModel.DataAnnotations;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.User.Respone;

public class GetUserDto
{
    [Required]
    public Guid Id { get; set; }
    
    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; }

    public bool IsStarosta { get; set; }

    public bool IsActive { get; set; } = true;
}
