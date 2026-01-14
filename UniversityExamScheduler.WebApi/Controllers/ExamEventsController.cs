using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Entities;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize]
[ApiController]
[Route("api/exam-events")]
public class ExamEventsController : ControllerBase
{
    private readonly IExamTermService _termService;

    public ExamEventsController(IExamTermService termService)
    {
        _termService = termService;
    }

    public sealed record ExamEventDto
    {
        public Guid Id { get; init; }
        public string Title { get; init; } = string.Empty;
        public string DateISO { get; init; } = string.Empty;
        public string? Time { get; init; }
        public string? Room { get; init; }
        public string? Lecturer { get; init; }
        public string? FieldOfStudy { get; init; }
        public string? StudyType { get; init; }
        public string? Year { get; init; }
        public string? GroupId { get; init; }
        public string? GroupName { get; init; }
        public ExamTermStatus Status { get; init; } = ExamTermStatus.Draft;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExamEventDto>>> List(CancellationToken cancellationToken)
    {
        var role = GetRole();
        if (role is null)
        {
            return Unauthorized(new { message = "Missing role claim." });
        }

        var hasUserId = TryGetUserId(out var userId);

        IEnumerable<ExamTerm> items;
        switch (role.Value)
        {
            case Role.Lecturer:
                if (!hasUserId) return Forbid();
                items = await _termService.ListWithDetailsAsync(userId, null, cancellationToken);
                break;
            case Role.Student:
                if (!hasUserId) return Forbid();
                items = await _termService.ListWithDetailsAsync(null, userId, cancellationToken);
                break;
            case Role.DeanOffice:
            case Role.Admin:
                items = await _termService.ListWithDetailsAsync(null, null, cancellationToken);
                break;
            default:
                return Forbid();
        }

        var dtos = items
            .Select(MapEvent)
            .ToList();
        return Ok(dtos);
    }

    private Role? GetRole()
    {
        var raw = User.FindFirstValue(ClaimTypes.Role);
        return Enum.TryParse<Role>(raw, out var parsed) ? parsed : null;
    }

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }

    private static ExamEventDto MapEvent(ExamTerm term)
    {
        var exam = term.Exam;
        var group = exam?.Group;
        var lecturer = exam?.Lecturer;

        var year = group is null ? null : SemesterToYear(group.Semester)?.ToString();

        return new ExamEventDto
        {
            Id = term.Id,
            Title = exam?.Name ?? string.Empty,
            DateISO = term.Date.ToString("yyyy-MM-dd"),
            Time = term.StartTime.ToString("HH:mm"),
            Room = term.Room?.RoomNumber,
            Lecturer = lecturer is null ? null : $"{lecturer.FirstName} {lecturer.LastName}",
            FieldOfStudy = group?.FieldOfStudy,
            StudyType = group?.StudyType.ToString(),
            Year = year,
            GroupId = group?.Id.ToString(),
            GroupName = group?.Name,
            Status = term.Status
        };
    }

    private static int? SemesterToYear(int semester)
    {
        if (semester <= 0) return null;
        return (int)Math.Ceiling(semester / 2.0);
    }

}
