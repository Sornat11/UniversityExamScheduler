using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Respone;
using UniversityExamScheduler.Application.Services;

namespace UniversityExamScheduler.WebApi.Controllers;

[Route("api/[controller]")]
[ApiController]
public class StudentGroupController : ControllerBase
{
    private readonly IStudentGroupService _groupService;
    private readonly IMapper _mapper;

    public StudentGroupController(IStudentGroupService groupService, IMapper mapper)
    {
        _groupService = groupService;
        _mapper = mapper;
    }

    [HttpPost]
    public async Task<IActionResult> AddGroup(CreateStudentGroupDto groupDto, CancellationToken cancellationToken)
    {
        var created = await _groupService.AddAsync(groupDto, cancellationToken);
        var createdDto = _mapper.Map<GetStudentGroupDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var group = await _groupService.GetByIdAsync(id, cancellationToken);
        if (group is null) return NotFound();
        var dto = _mapper.Map<GetStudentGroupDto>(group);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] string? name, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            var group = await _groupService.GetByNameAsync(name, cancellationToken);
            if (group is null) return NotFound();
            var groupDto = _mapper.Map<GetStudentGroupDto>(group);
            return Ok(groupDto);
        }

        var groups = await _groupService.ListAsync(cancellationToken);
        var dtos = _mapper.Map<IEnumerable<GetStudentGroupDto>>(groups);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateGroup(Guid id, UpdateStudentGroupDto groupDto, CancellationToken cancellationToken)
    {
        await _groupService.UpdateAsync(id, groupDto, cancellationToken);
        var updated = await _groupService.GetByIdAsync(id, cancellationToken);
        var updatedDto = _mapper.Map<GetStudentGroupDto>(updated);
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteGroup(Guid id, CancellationToken cancellationToken)
    {
        await _groupService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
