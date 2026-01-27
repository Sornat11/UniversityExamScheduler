namespace UniversityExamScheduler.WebApi.Helpers;

public static class PaginationDefaults
{
    public const int DefaultPage = 1;
    public const int DefaultPageSize = 20;
    public const int MaxPageSize = 100;

    public static bool HasPaging(int? page, int? pageSize) => page.HasValue || pageSize.HasValue;

    public static (int Page, int PageSize) Normalize(int? page, int? pageSize)
    {
        var normalizedPage = page.GetValueOrDefault(DefaultPage);
        if (normalizedPage < 1)
        {
            normalizedPage = DefaultPage;
        }

        var normalizedPageSize = pageSize.GetValueOrDefault(DefaultPageSize);
        if (normalizedPageSize < 1)
        {
            normalizedPageSize = DefaultPageSize;
        }
        else if (normalizedPageSize > MaxPageSize)
        {
            normalizedPageSize = MaxPageSize;
        }

        return (normalizedPage, normalizedPageSize);
    }
}
