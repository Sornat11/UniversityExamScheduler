using System.Collections.Generic;

namespace UniversityExamScheduler.Application.Dtos;

public class PagedResult<T>
{
    public required IEnumerable<T> Items { get; init; }
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
}
