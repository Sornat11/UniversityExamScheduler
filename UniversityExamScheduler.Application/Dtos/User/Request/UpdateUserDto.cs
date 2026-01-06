using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.Application.Dtos.User.Request;

public class UpdateUserDto
{
    public string? ExternalId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public Role Role { get; set; }
    public bool IsStarosta { get; set; }
    public bool IsActive { get; set; } = true;
}
