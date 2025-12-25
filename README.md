# University Exam Scheduler

Web API that streamlines planning and managing university exams. It coordinates students, lecturers, student representatives, and dean’s office staff while reducing scheduling conflicts and organizational mistakes.

## Features
- CRUD for users, student groups, rooms, courses/exams, sessions, exam terms, and change history.
- Validation with FluentValidation (automatic 400 responses on bad payloads).
- Consistent error handling (404/409/500) via middleware.
- Swagger UI available at `/` for interactive testing.
- Serilog-based logging.

## Tech Stack
- .NET 10 (ASP.NET Core Web API), Entity Framework Core + PostgreSQL (Npgsql)
- AutoMapper, FluentValidation
- Serilog, Swagger/OpenAPI

## Solution Layout
- `UniversityExamScheduler.Domain` – entities and enums.
- `UniversityExamScheduler.Application` – DTOs, services, validators, AutoMapper profiles, exceptions.
- `UniversityExamScheduler.Infrastructure` – EF Core DbContext, repositories, Unit of Work, migrations.
- `UniversityExamScheduler.WebApi` – controllers, middleware, DI setup, Swagger/Serilog configuration.
- `docs/` – business requirements, database schema, and technical documentation (`DokumentacjaTechniczna.md` in Polish).

## Getting Started
1. Set `ConnectionStrings:DefaultConnection` in `UniversityExamScheduler.WebApi/appsettings.Development.json`.
2. Apply migrations if needed (example):
   ```bash
   dotnet ef database update -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi
   ```
3. Run the API:
   ```bash
   dotnet run --project UniversityExamScheduler.WebApi
   ```
4. Open Swagger UI at `http://localhost:5000/` (or the configured port).

## Testing
Run all tests (when present):
```bash
dotnet test
```
