using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Request;
using UniversityExamScheduler.Application.Dtos.ExamTerm.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ExamTermController : ControllerBase
{
    private readonly IExamTermService _termService;
    private readonly IMapper _mapper;

    public ExamTermController(IExamTermService termService, IMapper mapper)
    {
        _termService = termService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddTerm(CreateExamTermDto termDto, CancellationToken cancellationToken)
    {
        var created = await _termService.AddAsync(termDto, cancellationToken);
        var dto = _mapper.Map<GetExamTermDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var term = await _termService.GetByIdAsync(id, cancellationToken);
        if (term is null) return NotFound();
        var dto = _mapper.Map<GetExamTermDto>(term);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List([FromQuery] Guid? courseId, CancellationToken cancellationToken)
    {
        if (courseId.HasValue)
        {
            var termsByCourse = await _termService.ListByCourseAsync(courseId.Value, cancellationToken);
            var courseDtos = _mapper.Map<IEnumerable<GetExamTermDto>>(termsByCourse);
            return Ok(courseDtos);
        }

        var terms = await _termService.ListAsync(cancellationToken);
        var dtos = _mapper.Map<IEnumerable<GetExamTermDto>>(terms);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTerm(Guid id, UpdateExamTermDto termDto, CancellationToken cancellationToken)
    {
        await _termService.UpdateAsync(id, termDto, cancellationToken);
        var updated = await _termService.GetByIdAsync(id, cancellationToken);
        var dto = _mapper.Map<GetExamTermDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTerm(Guid id, CancellationToken cancellationToken)
    {
        await _termService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
