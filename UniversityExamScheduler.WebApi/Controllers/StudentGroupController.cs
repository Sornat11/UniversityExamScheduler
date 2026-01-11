using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class StudentGroupController(IStudentGroupService groupService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> AddGroup(CreateStudentGroupDto groupDto, CancellationToken cancellationToken)
    {
        var created = await groupService.AddAsync(groupDto, cancellationToken);
        var createdDto = mapper.Map<GetStudentGroupDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, createdDto);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)},{nameof(Role.Lecturer)}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var group = await groupService.GetByIdAsync(id, cancellationToken);
        if (group is null) return NotFound();
        var dto = mapper.Map<GetStudentGroupDto>(group);
        return Ok(dto);
    }

    [HttpGet]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)},{nameof(Role.Lecturer)}")]
    public async Task<IActionResult> Get([FromQuery] string? name, CancellationToken cancellationToken)
    {
        if (!string.IsNullOrWhiteSpace(name))
        {
            var group = await groupService.GetByNameAsync(name, cancellationToken);
            if (group is null) return NotFound();
            var groupDto = mapper.Map<GetStudentGroupDto>(group);
            return Ok(groupDto);
        }

        var groups = await groupService.ListAsync(cancellationToken);
        var dtos = mapper.Map<IEnumerable<GetStudentGroupDto>>(groups);
        return Ok(dtos);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> UpdateGroup(Guid id, UpdateStudentGroupDto groupDto, CancellationToken cancellationToken)
    {
        await groupService.UpdateAsync(id, groupDto, cancellationToken);
        var updated = await groupService.GetByIdAsync(id, cancellationToken);
        var updatedDto = mapper.Map<GetStudentGroupDto>(updated);
        return Ok(updatedDto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> DeleteGroup(Guid id, CancellationToken cancellationToken)
    {
        await groupService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
