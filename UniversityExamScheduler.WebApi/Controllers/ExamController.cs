using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Dtos.Exam.Respone;
using UniversityExamScheduler.Application.Services;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ExamController(IExamService examService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> AddExam(CreateExamDto examDto, CancellationToken cancellationToken)
    {
        var created = await examService.AddAsync(examDto, cancellationToken);
        var createdDto = mapper.Map<GetExamDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)},{nameof(Role.Lecturer)}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var exam = await examService.GetByIdAsync(id, cancellationToken);
        if (exam is null) return NotFound();
        if (User.IsInRole(nameof(Role.Lecturer)) && !IsOwnedByLecturer(exam.LecturerId))
        {
            return Forbid();
        }
        var dto = mapper.Map<GetExamDto>(exam);
        return Ok(dto);
    }

    [HttpGet]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)},{nameof(Role.Lecturer)},{nameof(Role.Student)}")]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        if (User.IsInRole(nameof(Role.Student)))
        {
            if (!TryGetUserId(out var studentId))
            {
                return Forbid();
            }

            var studentExams = await examService.ListForStudentAsync(studentId, cancellationToken);

            var studentDtos = mapper.Map<IEnumerable<GetExamDto>>(studentExams);
            return Ok(studentDtos);
        }

        var exams = await examService.ListAsync(cancellationToken);
        if (User.IsInRole(nameof(Role.Lecturer)))
        {
            if (!TryGetUserId(out var lecturerId))
            {
                return Forbid();
            }
            exams = exams.Where(e => e.LecturerId == lecturerId);
        }
        var dtos = mapper.Map<IEnumerable<GetExamDto>>(exams);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> UpdateExam(Guid id, UpdateExamDto examDto, CancellationToken cancellationToken)
    {
        await examService.UpdateAsync(id, examDto, cancellationToken);
        var updated = await examService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> DeleteExam(Guid id, CancellationToken cancellationToken)
    {
        await examService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }

    private bool TryGetUserId(out Guid userId)
    {
        userId = Guid.Empty;
        var raw = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(raw, out userId);
    }

    private bool IsOwnedByLecturer(Guid lecturerId)
    {
        return TryGetUserId(out var userId) && lecturerId == userId;
    }
}
