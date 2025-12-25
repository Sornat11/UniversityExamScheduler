using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Dtos.ExamSession.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ExamSessionController : ControllerBase
{
    private readonly IExamSessionService _sessionService;
    private readonly IMapper _mapper;

    public ExamSessionController(IExamSessionService sessionService, IMapper mapper)
    {
        _sessionService = sessionService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddSession(CreateExamSessionDto sessionDto, CancellationToken cancellationToken)
    {
        var created = await _sessionService.AddAsync(sessionDto, cancellationToken);
        var createdDto = _mapper.Map<GetExamSessionDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var session = await _sessionService.GetByIdAsync(id, cancellationToken);
        if (session is null) return NotFound();
        var dto = _mapper.Map<GetExamSessionDto>(session);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var sessions = await _sessionService.ListAsync(cancellationToken);
        var dtos = _mapper.Map<IEnumerable<GetExamSessionDto>>(sessions);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateSession(Guid id, UpdateExamSessionDto sessionDto, CancellationToken cancellationToken)
    {
        await _sessionService.UpdateAsync(id, sessionDto, cancellationToken);
        var updated = await _sessionService.GetByIdAsync(id, cancellationToken);
        var dto = _mapper.Map<GetExamSessionDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteSession(Guid id, CancellationToken cancellationToken)
    {
        await _sessionService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
