using System.Text.Json;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using UniversityExamScheduler.Application.Exceptions;
using UniversityExamScheduler.WebApi.Middleware;

namespace UniversityExamScheduler.WebApi.Tests.Middleware;

public class ExceptionHandlingMiddlewareTests
{
    [Fact]
    public async Task InvokeAsync_ReturnsNotFoundPayload_WhenEntityMissing()
    {
        var exception = new EntityNotFoundException("User not found");
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
        RequestDelegate next = _ => throw exception;
        var middleware = new ExceptionHandlingMiddleware(next, logger.Object);

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status404NotFound);
        var body = await ReadBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.GetProperty("title").GetString().Should().Be("Not Found");
        doc.RootElement.GetProperty("detail").GetString().Should().Be("User not found");
    }

    [Fact]
    public async Task InvokeAsync_ReturnsValidationErrors_WhenValidationException()
    {
        var failures = new[]
        {
            new ValidationFailure("Email", "Email is required.")
        };
        var exception = new ValidationException(failures);
        var context = new DefaultHttpContext();
        context.Response.Body = new MemoryStream();

        var logger = new Mock<ILogger<ExceptionHandlingMiddleware>>();
        RequestDelegate next = _ => throw exception;
        var middleware = new ExceptionHandlingMiddleware(next, logger.Object);

        await middleware.InvokeAsync(context);

        context.Response.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        var body = await ReadBodyAsync(context);
        using var doc = JsonDocument.Parse(body);
        doc.RootElement.GetProperty("title").GetString().Should().Be("Validation Failed");
        var errors = doc.RootElement.GetProperty("errors");
        errors.GetArrayLength().Should().Be(1);
        errors[0].GetProperty("PropertyName").GetString().Should().Be("Email");
    }

    private static async Task<string> ReadBodyAsync(HttpContext context)
    {
        context.Response.Body.Seek(0, SeekOrigin.Begin);
        using var reader = new StreamReader(context.Response.Body, leaveOpen: true);
        return await reader.ReadToEndAsync();
    }
}
