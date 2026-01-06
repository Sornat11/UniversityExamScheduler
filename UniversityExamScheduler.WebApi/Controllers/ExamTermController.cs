using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
[Route("api/[controller]")]
[ApiController]
public class ExamTermController(IExamTermService termService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddTerm(CreateExamTermDto termDto, CancellationToken cancellationToken)
    {
        var created = await termService.AddAsync(termDto, cancellationToken);
        var dto = mapper.Map<GetExamTermDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var term = await termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        var dto = mapper.Map<GetExamTermDto>(term);
        return Ok(dto);
    }

    [HttpGet]
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
    public async Task<IActionResult> UpdateTerm(Guid id, UpdateExamTermDto termDto, CancellationToken cancellationToken)
    {
        await termService.UpdateAsync(id, termDto, cancellationToken);
        var updated = await termService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamTermDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTerm(Guid id, CancellationToken cancellationToken)
    {
        await termService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
