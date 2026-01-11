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
public class ExamTermController(IExamTermService termService, IExamService examService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)},{nameof(Role.Lecturer)}")]
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

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }
}
