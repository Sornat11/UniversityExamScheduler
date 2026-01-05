
using Microsoft.EntityFrameworkCore;
using Serilog;
using UniversityExamScheduler.Application;
using UniversityExamScheduler.WebApi.Middleware;
using FluentValidation.AspNetCore;
using UniversityExamScheduler.Infrastructure;
using UniversityExamScheduler.Infrastructure.Persistence;
using UniversityExamScheduler.WebApi.Logging;
using UniversityExamScheduler.WebApi.Swagger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var jwtSection = builder.Configuration.GetSection("Jwt");
var issuer = jwtSection["Issuer"];
var audience = jwtSection["Audience"];
var key = jwtSection["Key"];
var expiresMinutes = int.Parse(jwtSection["ExpiresMinutes"] ?? "120");

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
    // opcjonalnie: polityki per rola
    options.AddPolicy("DziekanatOnly", p => p.RequireRole("dziekanat"));
});

SerilogConfigurator.ConfigureSerilog(builder.Configuration);
builder.Host.UseSerilog();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddOpenApi();
builder.Services.AddInfrastructure();
builder.Services.AddApplication();
builder.Services.AddControllers();
builder.Services.AddFluentValidationAutoValidation();

builder.Services.AddSwaggerDocumentation();

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();

app.UseMiddleware<ExceptionHandlingMiddleware>();

app.UseSwaggerDocumentation();

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
