using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ExamTermHistoryController : ControllerBase
{
    private readonly IExamTermHistoryService _historyService;
    private readonly IMapper _mapper;

    public ExamTermHistoryController(IExamTermHistoryService historyService, IMapper mapper)
    {
        _historyService = historyService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddHistory(CreateExamTermHistoryDto historyDto, CancellationToken cancellationToken)
    {
        var created = await _historyService.AddAsync(historyDto, cancellationToken);
        var dto = _mapper.Map<GetExamTermHistoryDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var history = await _historyService.GetByIdAsync(id, cancellationToken);
        if (history is null) return NotFound();
        var dto = _mapper.Map<GetExamTermHistoryDto>(history);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? examTermId, CancellationToken cancellationToken)
    {
        if (examTermId.HasValue)
        {
            var forTerm = await _historyService.ListByExamTermAsync(examTermId.Value, cancellationToken);
            var termDtos = _mapper.Map<IEnumerable<GetExamTermHistoryDto>>(forTerm);
            return Ok(termDtos);
        }

        var histories = await _historyService.ListAsync(cancellationToken);
        var dtos = _mapper.Map<IEnumerable<GetExamTermHistoryDto>>(histories);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHistory(Guid id, UpdateExamTermHistoryDto historyDto, CancellationToken cancellationToken)
    {
        await _historyService.UpdateAsync(id, historyDto, cancellationToken);
        var updated = await _historyService.GetByIdAsync(id, cancellationToken);
        var dto = _mapper.Map<GetExamTermHistoryDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHistory(Guid id, CancellationToken cancellationToken)
    {
        await _historyService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
