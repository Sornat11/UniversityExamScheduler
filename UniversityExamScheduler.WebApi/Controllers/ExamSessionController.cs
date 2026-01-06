using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Dtos.ExamSession.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
[Route("api/[controller]")]
[ApiController]
public class ExamSessionController(IExamSessionService sessionService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddSession(CreateExamSessionDto sessionDto, CancellationToken cancellationToken)
    {
        var created = await sessionService.AddAsync(sessionDto, cancellationToken);
        var createdDto = mapper.Map<GetExamSessionDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var session = await sessionService.GetByIdAsync(id, cancellationToken);
        if (session is null) return NotFound();
        var dto = mapper.Map<GetExamSessionDto>(session);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var sessions = await sessionService.ListAsync(cancellationToken);
        var dtos = mapper.Map<IEnumerable<GetExamSessionDto>>(sessions);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSession(Guid id, UpdateExamSessionDto sessionDto, CancellationToken cancellationToken)
    {
        await sessionService.UpdateAsync(id, sessionDto, cancellationToken);
        var updated = await sessionService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamSessionDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(Guid id, CancellationToken cancellationToken)
    {
        await sessionService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
