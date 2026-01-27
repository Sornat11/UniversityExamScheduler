
using Microsoft.EntityFrameworkCore;
using Serilog;
using UniversityExamScheduler.Application;
using UniversityExamScheduler.WebApi.Middleware;
using FluentValidation.AspNetCore;
using UniversityExamScheduler.Infrastructure;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.WebApi.Logging;
using UniversityExamScheduler.WebApi.Extensions;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json.Serialization;
using UniversityExamScheduler.Domain.Enums;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

var jwtSection = builder.Configuration.GetSection("Jwt");
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];
var key = jwtSection["Key"];
var expiresMinutes = int.Parse(jwtSection["ExpiresMinutes"] ?? "120");
var seedDemoData = builder.Configuration.GetValue("SeedDemoData", builder.Environment.IsDevelopment());
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var otlpEndpoint = builder.Configuration["OTEL_EXPORTER_OTLP_ENDPOINT"];
var serviceName = builder.Configuration["OTEL_SERVICE_NAME"] ?? "UniversityExamScheduler.Api";
Uri? otlpUri = null;

if (string.IsNullOrWhiteSpace(connectionString) || connectionString.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("ConnectionStrings:DefaultConnection must be configured via environment variables (ConnectionStrings__DefaultConnection).");
}

if (string.IsNullOrWhiteSpace(key) || key.Length < 32 || key.Contains("CHANGE_ME", StringComparison.OrdinalIgnoreCase))
{
    throw new InvalidOperationException("Jwt:Key must be configured via environment variables (Jwt__Key) and have at least 32 characters.");
}

if (!string.IsNullOrWhiteSpace(otlpEndpoint) && !Uri.TryCreate(otlpEndpoint, UriKind.Absolute, out otlpUri))
{
    throw new InvalidOperationException("OTEL_EXPORTER_OTLP_ENDPOINT must be a valid absolute URI.");
}

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = issuer,
            ValidateAudience = true,
            ValidAudience = audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key!)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("DziekanatOnly", p => p.RequireRole(nameof(Role.DeanOffice), nameof(Role.Admin)));
});

SerilogConfigurator.ConfigureSerilog(builder.Configuration);
builder.Host.UseSerilog();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(connectionString));

builder.Services.AddInfrastructure();
builder.Services.AddApplication();
builder.Services
    .AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddHealthChecks();

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(serviceName))
    .WithTracing(tracing =>
    {
        tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation();

        if (otlpUri is not null)
        {
            tracing.AddOtlpExporter(options => options.Endpoint = otlpUri);
        }
    })
    .WithMetrics(metrics =>
    {
        metrics
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            .AddRuntimeInstrumentation();

        if (otlpUri is not null)
        {
            metrics.AddOtlpExporter(options => options.Endpoint = otlpUri);
        }
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (seedDemoData)
{
    await app.Services.SeedReferenceDataAsync();
}
app.UseCors("Frontend");
app.UseSerilogRequestLogging();
app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.RoutePrefix = string.Empty;
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "UniversityExamScheduler API v1");
});

// app.UseHttpsRedirection();

app.MapHealthChecks("/health");
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
