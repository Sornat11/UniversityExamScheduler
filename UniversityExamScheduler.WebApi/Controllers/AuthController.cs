using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IUserService _userService;

    public AuthController(IConfiguration config, IUserService userService)
    {
        _config = config;
        _userService = userService;
    }

    public record LoginRequest(string Username, string Password);

    public record UserStudentGroupDto(
        Guid Id,
        string Name,
        string FieldOfStudy,
        StudyType StudyType,
        int Semester
    );

    public record UserDto(
        string Username,
        Role Role,
        bool IsStarosta,
        string? FirstName,
        string? LastName,
        string? Email,
        bool IsActive,
        IReadOnlyCollection<UserStudentGroupDto> StudentGroups
    );

    public record LoginResponse(
        string AccessToken,
        DateTime ExpiresAtUtc,
        UserDto User
    );

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req, CancellationToken cancellationToken)
    {
        var username = (req.Username ?? string.Empty).Trim().ToLowerInvariant();

        Role role;
        bool isStarosta;

        switch (username)
        {
            case "student":
                role = Role.Student;
                isStarosta = false;
                break;
            case "starosta":
                role = Role.Student;
                isStarosta = true;
                break;
            case "prowadzacy":
                role = Role.Lecturer;
                isStarosta = false;
                break;
            case "dziekanat":
                role = Role.DeanOffice;
                isStarosta = false;
                break;
            case "admin":
                role = Role.Admin;
                isStarosta = false;
                break;
            default:
                role = Role.Student;
                isStarosta = false;
                break;
        }

        if (username is not ("student" or "starosta" or "prowadzacy" or "dziekanat" or "admin"))
            return Unauthorized(new { message = "Unknown demo user. Allowed: student/starosta/prowadzacy/dziekanat/admin" });

        var dbUser = await ResolveDemoUserAsync(username, cancellationToken);
        if (dbUser is not null)
        {
            role = dbUser.Role;
            isStarosta = dbUser.IsStarosta;
        }

        if (username == "starosta")
        {
            role = Role.Student;
            isStarosta = true;
        }

        var jwt = _config.GetSection("Jwt");
        var issuer = jwt["Issuer"];
        var audience = jwt["Audience"];
        var key = jwt["Key"];
        var expiresMinutes = int.Parse(jwt["ExpiresMinutes"] ?? "120");

        if (string.IsNullOrWhiteSpace(issuer) ||
            string.IsNullOrWhiteSpace(audience) ||
            string.IsNullOrWhiteSpace(key))
        {
            return StatusCode(500, new
            {
                message = "Missing JWT configuration. Required keys: Jwt:Issuer, Jwt:Audience, Jwt:Key, Jwt:ExpiresMinutes."
            });
        }

        if (key.Length < 32)
        {
            return StatusCode(500, new
            {
                message = "Jwt:Key is too short. Use at least 32 characters for HMAC SHA256."
            });
        }

        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Role, role.ToString()),
        };

        if (dbUser is not null)
        {
            claims.Add(new Claim(ClaimTypes.NameIdentifier, dbUser.Id.ToString()));
        }

        if (isStarosta)
        {
            claims.Add(new Claim("is_starosta", "true"));
        }

        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key));
        var creds = new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256);

        var expiresAt = DateTime.UtcNow.AddMinutes(expiresMinutes);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds
        );

        var tokenString = new JwtSecurityTokenHandler().WriteToken(token);
        var userDto = BuildUser(username, role, isStarosta, dbUser);

        return Ok(new LoginResponse(
            AccessToken: tokenString,
            ExpiresAtUtc: expiresAt,
            User: userDto
        ));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me(CancellationToken cancellationToken)
    {
        var username = User.Identity?.Name;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(roleClaim))
        {
            return Unauthorized(new { message = "Token is missing required claims." });
        }

        var isStarosta = User.HasClaim(c => c.Type == "is_starosta" && c.Value == "true");
        var role = Enum.TryParse<Role>(roleClaim, out var parsedRole) ? parsedRole : Role.Student;

        User? dbUser = null;
        var rawId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(rawId, out var userId))
        {
            dbUser = await _userService.GetByIdWithGroupsAsync(userId, cancellationToken);
            if (dbUser is not null)
            {
                role = dbUser.Role;
                isStarosta = dbUser.IsStarosta;
            }
        }

        if (string.Equals(username, "starosta", StringComparison.OrdinalIgnoreCase))
        {
            role = Role.Student;
            isStarosta = true;
        }

        return Ok(BuildUser(username, role, isStarosta, dbUser));
    }

    private static UserDto BuildUser(string username, Role role, bool isStarosta, User? dbUser)
    {
        var email = dbUser?.Email ?? ResolveDemoEmail(username);
        var groups = MapGroups(dbUser);
        return new UserDto(
            Username: username,
            Role: role,
            IsStarosta: isStarosta,
            FirstName: dbUser?.FirstName ?? username switch
            {
                "student" => "Jan",
                "starosta" => "Jan",
                "prowadzacy" => "Adam",
                "dziekanat" => "Anna",
                "admin" => "Admin",
                _ => null
            },
            LastName: dbUser?.LastName ?? username switch
            {
                "student" => "Kowalski",
                "starosta" => "Kowalski",
                "prowadzacy" => "Nowak",
                "dziekanat" => "Wisniewska",
                _ => null
            },
            Email: email,
            IsActive: dbUser?.IsActive ?? true,
            StudentGroups: groups
        );
    }

    private static IReadOnlyCollection<UserStudentGroupDto> MapGroups(User? dbUser)
    {
        if (dbUser?.GroupMemberships is null || dbUser.GroupMemberships.Count == 0)
        {
            return Array.Empty<UserStudentGroupDto>();
        }

        return dbUser.GroupMemberships
            .Where(m => m.Group != null)
            .Select(m => m.Group!)
            .Select(g => new UserStudentGroupDto(g.Id, g.Name, g.FieldOfStudy, g.StudyType, g.Semester))
            .ToList();
    }

    private static string? ResolveDemoEmail(string username) =>
        username switch
        {
            "student" => "student@example.com",
            "starosta" => "starosta@example.com",
            "prowadzacy" => "prowadza@example.com",
            "dziekanat" => "dziekanat@example.com",
            "admin" => "admin@example.com",
            _ => null
        };

    private Task<User?> ResolveDemoUserAsync(string username, CancellationToken cancellationToken)
    {
        var email = ResolveDemoEmail(username);

        if (string.IsNullOrWhiteSpace(email))
        {
            return Task.FromResult<User?>(null);
        }

        return _userService.GetByEmailAsync(email, cancellationToken);
    }
}
