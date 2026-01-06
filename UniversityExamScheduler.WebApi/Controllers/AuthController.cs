using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
[Authorize]
public class AuthController : ControllerBase
{
    private readonly IConfiguration _config;

    public AuthController(IConfiguration config)
    {
        _config = config;
    }

    public record LoginRequest(string Username, string Password);

    public record UserDto(
        string Username,
        Role Role,
        bool IsStarosta,
        string? FirstName,
        string? LastName
    );

    public record LoginResponse(
        string AccessToken,
        DateTime ExpiresAtUtc,
        UserDto User
    );

    [HttpPost("login")]
    [AllowAnonymous]
    public ActionResult<LoginResponse> Login([FromBody] LoginRequest req)
    {
        var username = (req.Username ?? string.Empty).Trim().ToLowerInvariant();

        var (role, isStarosta) = username switch
        {
            "student" => (Role.Student, false),
            "starosta" => (Role.Student, true),
            "prowadzacy" => (Role.Lecturer, false),
            "dziekanat" => (Role.DeanOffice, false),
            "admin" => (Role.Admin, false),
            _ => (Role.Student, false)
        };

        if (username is not ("student" or "starosta" or "prowadzacy" or "dziekanat" or "admin"))
            return Unauthorized(new { message = "Unknown demo user. Allowed: student/starosta/prowadzacy/dziekanat/admin" });

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
        var userDto = BuildUser(username, role, isStarosta);

        return Ok(new LoginResponse(
            AccessToken: tokenString,
            ExpiresAtUtc: expiresAt,
            User: userDto
        ));
    }

    [HttpGet("me")]
    [Authorize]
    public ActionResult<UserDto> Me()
    {
        var username = User.Identity?.Name;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(roleClaim))
        {
            return Unauthorized(new { message = "Token is missing required claims." });
        }

        var isStarosta = User.HasClaim(c => c.Type == "is_starosta" && c.Value == "true");
        var role = Enum.TryParse<Role>(roleClaim, out var parsedRole) ? parsedRole : Role.Student;

        return Ok(BuildUser(username, role, isStarosta));
    }

    private static UserDto BuildUser(string username, Role role, bool isStarosta) =>
        new(
            Username: username,
            Role: role,
            IsStarosta: isStarosta,
            FirstName: username switch
            {
                "student" => "Jan",
                "starosta" => "Jan",
                "prowadzacy" => "Adam",
                "dziekanat" => "Anna",
                "admin" => "Admin",
                _ => null
            },
            LastName: username switch
            {
                "student" => "Kowalski",
                "starosta" => "Kowalski",
                "prowadzacy" => "Nowak",
                "dziekanat" => "Wisniewska",
                _ => null
            }
        );
}
