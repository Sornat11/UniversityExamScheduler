using AutoMapper;
using Microsoft.AspNetCore.Mvc;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Request;
using UniversityExamScheduler.Application.Dtos.ExamTermHistory.Respone;
using UniversityExamScheduler.Application.Services;
using Microsoft.AspNetCore.Authorization;
using UniversityExamScheduler.Domain.Enums;
using UniversityExamScheduler.Application.Dtos;
using UniversityExamScheduler.WebApi.Helpers;

namespace UniversityExamScheduler.WebApi.Controllers;

[Authorize(Roles = $"{nameof(Role.DeanOffice)},{nameof(Role.Admin)}")]
[Route("api/[controller]")]
[ApiController]
public class ExamTermHistoryController(IExamTermHistoryService historyService, IMapper mapper) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> AddHistory(CreateExamTermHistoryDto historyDto, CancellationToken cancellationToken)
    {
        var created = await historyService.AddAsync(historyDto, cancellationToken);
        var dto = mapper.Map<GetExamTermHistoryDto>(created);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, dto);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken)
    {
        var history = await historyService.GetByIdAsync(id, cancellationToken);
        if (history is null) return NotFound();
        var dto = mapper.Map<GetExamTermHistoryDto>(history);
        return Ok(dto);
    }

    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] Guid? examTermId = null,
        [FromQuery] Guid? changedBy = null,
        [FromQuery] ExamTermStatus? previousStatus = null,
        [FromQuery] ExamTermStatus? newStatus = null,
        [FromQuery] DateTime? changedFrom = null,
        [FromQuery] DateTime? changedTo = null,
        [FromQuery] string? search = null,
        [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null,
        CancellationToken cancellationToken = default)
    {
        var hasSearchOrFilters = !string.IsNullOrWhiteSpace(search)
            || changedBy.HasValue
            || previousStatus.HasValue
            || newStatus.HasValue
            || changedFrom.HasValue
            || changedTo.HasValue;
        var hasPaging = PaginationDefaults.HasPaging(page, pageSize);

        if (!hasPaging && !hasSearchOrFilters && examTermId.HasValue)
        {
            var forTerm = await historyService.ListByExamTermAsync(examTermId.Value, cancellationToken);
            var termDtos = mapper.Map<IEnumerable<GetExamTermHistoryDto>>(forTerm);
            return Ok(termDtos);
        }

        if (!hasPaging && !hasSearchOrFilters && !examTermId.HasValue)
        {
            var histories = await historyService.ListAsync(cancellationToken);
            var dtos = mapper.Map<IEnumerable<GetExamTermHistoryDto>>(histories);
            return Ok(dtos);
        }

        var (normalizedPage, normalizedPageSize) = PaginationDefaults.Normalize(page, pageSize);
        var (items, total) = await historyService.SearchAsync(
            examTermId,
            changedBy,
            previousStatus,
            newStatus,
            changedFrom,
            changedTo,
            search,
            normalizedPage,
            normalizedPageSize,
            cancellationToken);
        var paged = new PagedResult<GetExamTermHistoryDto>
        {
            Items = mapper.Map<IEnumerable<GetExamTermHistoryDto>>(items),
            TotalCount = total,
            Page = normalizedPage,
            PageSize = normalizedPageSize
        };
        return Ok(paged);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateHistory(Guid id, UpdateExamTermHistoryDto historyDto, CancellationToken cancellationToken)
    {
        await historyService.UpdateAsync(id, historyDto, cancellationToken);
        var updated = await historyService.GetByIdAsync(id, cancellationToken);
        var dto = mapper.Map<GetExamTermHistoryDto>(updated);
        return Ok(dto);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteHistory(Guid id, CancellationToken cancellationToken)
    {
        await historyService.RemoveAsync(id, cancellationToken);
        return NoContent();
    }
}
