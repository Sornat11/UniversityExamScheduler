using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Dtos.Exam.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
[Route("api/[controller]")]
[ApiController]
public class ExamController(IExamService examService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddExam(CreateExamDto examDto, CancellationToken cancellationToken)
    {
        var created = await examService.AddAsync(examDto, cancellationToken);
        var createdDto = mapper.Map<GetExamDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var exam = await examService.GetByIdAsync(id, cancellationToken);
        if (exam is null) return NotFound();
        var dto = mapper.Map<GetExamDto>(exam);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var exams = await examService.ListAsync(cancellationToken);
        var dtos = mapper.Map<IEnumerable<GetExamDto>>(exams);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExam(Guid id, UpdateExamDto examDto, CancellationToken cancellationToken)
    {
        await examService.UpdateAsync(id, examDto, cancellationToken);
        var updated = await examService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExam(Guid id, CancellationToken cancellationToken)
    {
        await examService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
