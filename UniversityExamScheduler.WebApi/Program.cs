
using Microsoft.EntityFrameworkCore;
using Serilog;
using Serilog.Events;
using UniversityExamScheduler.Application;
using UniversityExamScheduler.WebApi.Middleware;
using FluentValidation.AspNetCore;
using UniversityExamScheduler.Infrastructure;
using UniversityExamScheduler.Infrastructure.Persistence;

using UniversityExamScheduler.WebApi.Logging;

var builder = WebApplication.CreateBuilder(args);

SerilogConfigurator.ConfigureSerilog(builder.Configuration);
builder.Host.UseSerilog();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure();
builder.Services.AddApplication();
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// app.UseHttpsRedirection();

app.MapControllers();

try
{
    Log.Information("Starting web host");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Host terminated unexpectedly");
    throw;
}
finally
{
    Log.CloseAndFlush();
}
