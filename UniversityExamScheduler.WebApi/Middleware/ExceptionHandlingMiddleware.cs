using System.Text.Json;
using UniversityExamScheduler.Application.Exceptions;

namespace UniversityExamScheduler.WebApi.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (EntityAlreadyExistsException ex)
        {
            _logger.LogWarning(ex, "Conflict");
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";
            var payload = new { title = "Conflict", detail = ex.Message };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (EntityNotFoundException ex)
        {
            _logger.LogWarning(ex, "Not Found");
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            context.Response.ContentType = "application/json";
            var payload = new { title = "Not Found", detail = ex.Message };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception");
            context.Response.StatusCode = StatusCodes.Status500InternalServerError;
            context.Response.ContentType = "application/json";
            var payload = new { title = "Internal Server Error", detail = "An unexpected error occurred." };
            await context.Response.WriteAsync(JsonSerializer.Serialize(payload));
        }
    }
}
