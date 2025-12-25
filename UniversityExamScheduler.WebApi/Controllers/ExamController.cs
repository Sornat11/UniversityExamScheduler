using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.Exam.Request;
using UniversityExamScheduler.Application.Dtos.Exam.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class ExamController : ControllerBase
{
    private readonly IExamService _examService;
    private readonly IMapper _mapper;

    public ExamController(IExamService examService, IMapper mapper)
    {
        _examService = examService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddExam(CreateExamDto examDto, CancellationToken cancellationToken)
    {
        var created = await _examService.AddAsync(examDto, cancellationToken);
        var createdDto = _mapper.Map<GetExamDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var exam = await _examService.GetByIdAsync(id, cancellationToken);
        if (exam is null) return NotFound();
        var dto = _mapper.Map<GetExamDto>(exam);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
    {
        var exams = await _examService.ListAsync(cancellationToken);
        var dtos = _mapper.Map<IEnumerable<GetExamDto>>(exams);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateExam(Guid id, UpdateExamDto examDto, CancellationToken cancellationToken)
    {
        await _examService.UpdateAsync(id, examDto, cancellationToken);
        var updated = await _examService.GetByIdAsync(id, cancellationToken);
        var dto = _mapper.Map<GetExamDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteExam(Guid id, CancellationToken cancellationToken)
    {
        await _examService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
