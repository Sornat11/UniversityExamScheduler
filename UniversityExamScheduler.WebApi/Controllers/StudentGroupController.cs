using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Request;
using UniversityExamScheduler.Application.Dtos.StudentGroup.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Application.Dtos;
using UniversityExamScheduler.WebApi.Helpers;

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
    public async Task<IActionResult> Get(
        [FromQuery] string? name,
        [FromQuery] string? search,
        [FromQuery] string? fieldOfStudy,
        [FromQuery] StudyType? studyType,
        [FromQuery] int? semester,
        [FromQuery] Guid? starostaId,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var hasSearchOrFilters = !string.IsNullOrWhiteSpace(search)
            || !string.IsNullOrWhiteSpace(fieldOfStudy)
            || studyType.HasValue
            || semester.HasValue
            || starostaId.HasValue;
        var hasPaging = PaginationDefaults.HasPaging(page, pageSize);

        if (!hasPaging && !hasSearchOrFilters && !string.IsNullOrWhiteSpace(name))
        {
            var group = await groupService.GetByNameAsync(name, cancellationToken);
            if (group is null) return NotFound();
            var groupDto = mapper.Map<GetStudentGroupDto>(group);
            return Ok(groupDto);
        }

        if (!hasPaging && !hasSearchOrFilters && string.IsNullOrWhiteSpace(name))
        {
            var groups = await groupService.ListAsync(cancellationToken);
            var dtos = mapper.Map<IEnumerable<GetStudentGroupDto>>(groups);
            return Ok(dtos);
        }

        var (normalizedPage, normalizedPageSize) = PaginationDefaults.Normalize(page, pageSize);
        var (items, total) = await groupService.SearchAsync(
            name,
            search,
            fieldOfStudy,
            studyType,
            semester,
            starostaId,
            normalizedPage,
            normalizedPageSize,
            cancellationToken);
        var paged = new PagedResult<GetStudentGroupDto>
        {
            Items = mapper.Map<IEnumerable<GetStudentGroupDto>>(items),
            TotalCount = total,
            Page = normalizedPage,
            PageSize = normalizedPageSize
        };
        return Ok(paged);
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
