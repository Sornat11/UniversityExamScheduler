using System;
using System.ComponentModel.DataAnnotations;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.User.Request;

public class CreateUserDto
{
    public string? ExternalId { get; set; }

    [Required]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public Role Role { get; set; }

    public bool IsActive { get; set; } = true;
}
