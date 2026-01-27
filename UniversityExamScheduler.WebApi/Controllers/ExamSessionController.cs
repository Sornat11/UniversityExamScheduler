using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamSession.Request;
using UniversityExamScheduler.Application.Dtos.ExamSession.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Application.Dtos;
using UniversityExamScheduler.WebApi.Helpers;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize]
[Route("api/[controller]")]
[ApiController]
public class ExamSessionController(IExamSessionService sessionService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
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
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] bool? isActive,
        [FromQuery] DateOnly? startFrom,
        [FromQuery] DateOnly? startTo,
        [FromQuery] DateOnly? endFrom,
        [FromQuery] DateOnly? endTo,
        [FromQuery] int? page,
        [FromQuery] int? pageSize,
        CancellationToken cancellationToken)
    {
        var hasSearchOrFilters = !string.IsNullOrWhiteSpace(search)
            || isActive.HasValue
            || startFrom.HasValue
            || startTo.HasValue
            || endFrom.HasValue
            || endTo.HasValue;
        var hasPaging = PaginationDefaults.HasPaging(page, pageSize);

        if (!hasPaging && !hasSearchOrFilters)
        {
            var sessions = await sessionService.ListAsync(cancellationToken);
            var dtos = mapper.Map<IEnumerable<GetExamSessionDto>>(sessions);
            return Ok(dtos);
        }

        var (normalizedPage, normalizedPageSize) = PaginationDefaults.Normalize(page, pageSize);
        var (items, total) = await sessionService.SearchAsync(
            search,
            isActive,
            startFrom,
            startTo,
            endFrom,
            endTo,
            normalizedPage,
            normalizedPageSize,
            cancellationToken);
        var paged = new PagedResult<GetExamSessionDto>
        {
            Items = mapper.Map<IEnumerable<GetExamSessionDto>>(items),
            TotalCount = total,
            Page = normalizedPage,
            PageSize = normalizedPageSize
        };
        return Ok(paged);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> UpdateSession(Guid id, UpdateExamSessionDto sessionDto, CancellationToken cancellationToken)
    {
        await sessionService.UpdateAsync(id, sessionDto, cancellationToken);
        var updated = await sessionService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamSessionDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
    public async Task<IActionResult> DeleteSession(Guid id, CancellationToken cancellationToken)
    {
        await sessionService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
