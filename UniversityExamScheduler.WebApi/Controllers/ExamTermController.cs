using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Respone;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ExamTermController(
    IExamTermService termService,
    IExamService examService,
    IStudentGroupService studentGroupService,
    IMapper mapper) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)},{nameof(Role.Lecturer)},{nameof(Role.Student)}")]
    public async Task<IActionResult> AddTerm(CreateExamTermDto termDto, CancellationToken cancellationToken)
    {
        if (User.IsInRole(nameof(Role.Lecturer)))
        {
            if (!TryGetUserId(out var lecturerId))
            {
                return Forbid();
            }

            var exam = await examService.GetByIdAsync(termDto.CourseId, cancellationToken);
            if (exam is null)
            {
                return NotFound();
            }

            if (exam.LecturerId != lecturerId)
            {
                return Forbid();
            }

            termDto.CreatedBy = lecturerId;
            termDto.Status = ExamTermStatus.ProposedByLecturer;
        }
        else if (User.IsInRole(nameof(Role.Student)))
        {
            if (!User.HasClaim(c => c.Type == "is_starosta" && c.Value == "true"))
            {
                return Forbid();
            }

            if (!TryGetUserId(out var studentId))
            {
                return Forbid();
            }

            var exam = await examService.GetByIdAsync(termDto.CourseId, cancellationToken);
            if (exam is null)
            {
                return NotFound();
            }

            var isMember = await studentGroupService.IsMemberAsync(studentId, exam.GroupId, cancellationToken);
            if (!isMember)
            {
                return Forbid();
            }

            termDto.CreatedBy = studentId;
            termDto.Status = ExamTermStatus.ProposedByStudent;
        }
        else if (termDto.CreatedBy == Guid.Empty)
        {
            return BadRequest(new { message = "CreatedBy is required." });
        }

        var created = await termService.AddAsync(termDto, cancellationToken);
        var dto = mapper.Map<GetExamTermDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, dto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        var dto = mapper.Map<GetExamTermDto>(term);
        return Ok(dto);
    }

    [HttpGet]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> List([FromQuery] Guid? courseId, CancellationToken cancellationToken)
    {
        if (courseId.HasValue)
        {
            var termsByCourse = await termService.ListByCourseAsync(courseId.Value, cancellationToken);
            var courseDtos = mapper.Map<IEnumerable<GetExamTermDto>>(termsByCourse);
            return Ok(courseDtos);
        }

        var terms = await termService.ListAsync(cancellationToken);
        var dtos = mapper.Map<IEnumerable<GetExamTermDto>>(terms);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> UpdateTerm(Guid id, UpdateExamTermDto termDto, CancellationToken cancellationToken)
    {
        await termService.UpdateAsync(id, termDto, cancellationToken);
        var updated = await termService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamTermDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> DeleteTerm(Guid id, CancellationToken cancellationToken)
    {
        await termService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }

    public sealed record RejectRequest(string? Reason);

    [HttpPost("{id}/approve-by-starosta")]
    [Authorize(Roles = $"{nameof(Role.Student)}")]
    public async Task<IActionResult> ApproveByStarosta(Guid id, CancellationToken cancellationToken)
    {
        if (!User.HasClaim(c => c.Type == "is_starosta" && c.Value == "true"))
        {
            return Forbid();
        }

        if (!TryGetUserId(out var studentId))
        {
            return Forbid();
        }

        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        if (term.Status != ExamTermStatus.ProposedByLecturer)
        {
            return BadRequest(new { message = "Only lecturer proposals can be approved by starosta." });
        }

        var exam = await examService.GetByIdAsync(term.CourseId, cancellationToken);
        if (exam is null)
        {
            return NotFound();
        }

        var isMember = await studentGroupService.IsMemberAsync(studentId, exam.GroupId, cancellationToken);
        if (!isMember)
        {
            return Forbid();
        }

        await termService.UpdateStatusAsync(term.Id, ExamTermStatus.Approved, null, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/reject-by-starosta")]
    [Authorize(Roles = $"{nameof(Role.Student)}")]
    public async Task<IActionResult> RejectByStarosta(Guid id, [FromBody] RejectRequest? request, CancellationToken cancellationToken)
    {
        if (!User.HasClaim(c => c.Type == "is_starosta" && c.Value == "true"))
        {
            return Forbid();
        }

        if (!TryGetUserId(out var studentId))
        {
            return Forbid();
        }

        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        if (term.Status != ExamTermStatus.ProposedByLecturer)
        {
            return BadRequest(new { message = "Only lecturer proposals can be rejected by starosta." });
        }

        var exam = await examService.GetByIdAsync(term.CourseId, cancellationToken);
        if (exam is null)
        {
            return NotFound();
        }

        var isMember = await studentGroupService.IsMemberAsync(studentId, exam.GroupId, cancellationToken);
        if (!isMember)
        {
            return Forbid();
        }

        await termService.UpdateStatusAsync(term.Id, ExamTermStatus.Rejected, request?.Reason, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/approve-by-lecturer")]
    [Authorize(Roles = $"{nameof(Role.Lecturer)}")]
    public async Task<IActionResult> ApproveByLecturer(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var lecturerId))
        {
            return Forbid();
        }

        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        if (term.Status != ExamTermStatus.ProposedByStudent)
        {
            return BadRequest(new { message = "Only student proposals can be approved by lecturer." });
        }

        var exam = await examService.GetByIdAsync(term.CourseId, cancellationToken);
        if (exam is null)
        {
            return NotFound();
        }

        if (exam.LecturerId != lecturerId)
        {
            return Forbid();
        }

        await termService.UpdateStatusAsync(term.Id, ExamTermStatus.Approved, null, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/reject-by-lecturer")]
    [Authorize(Roles = $"{nameof(Role.Lecturer)}")]
    public async Task<IActionResult> RejectByLecturer(Guid id, [FromBody] RejectRequest? request, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var lecturerId))
        {
            return Forbid();
        }

        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        if (term.Status != ExamTermStatus.ProposedByStudent)
        {
            return BadRequest(new { message = "Only student proposals can be rejected by lecturer." });
        }

        var exam = await examService.GetByIdAsync(term.CourseId, cancellationToken);
        if (exam is null)
        {
            return NotFound();
        }

        if (exam.LecturerId != lecturerId)
        {
            return Forbid();
        }

        await termService.UpdateStatusAsync(term.Id, ExamTermStatus.Rejected, request?.Reason, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/final-approve")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> FinalApprove(Guid id, CancellationToken cancellationToken)
    {
        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        if (term.Status != ExamTermStatus.Approved)
        {
            return BadRequest(new { message = "Only approved terms can be finalized." });
        }

        await termService.UpdateStatusAsync(term.Id, ExamTermStatus.Finalized, null, cancellationToken);
        return NoContent();
    }

    [HttpPost("{id}/final-reject")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> FinalReject(Guid id, [FromBody] RejectRequest? request, CancellationToken cancellationToken)
    {
        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        if (term.Status != ExamTermStatus.Approved)
        {
            return BadRequest(new { message = "Only approved terms can be rejected by dean office." });
        }

        await termService.UpdateStatusAsync(term.Id, ExamTermStatus.Rejected, request?.Reason, cancellationToken);
        return NoContent();
    }

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }
}
