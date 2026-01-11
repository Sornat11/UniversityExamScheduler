# University Exam Scheduler

Full-stack system that streamlines planning and managing university exams. It coordinates students, lecturers, student representatives (starosta), and dean's office staff while reducing scheduling conflicts and organizational errors.

## Features
- CRUD for users, student groups, rooms, courses/exams, sessions, exam terms, and term history.
- FluentValidation for request validation (automatic 400 responses on invalid payloads).
- Consistent error handling (404/409/500) via middleware.
- Swagger UI available at `/` for interactive testing.
- Serilog-based logging.
- Vite + React frontend with API proxy and PWA manifest.

## Tech Stack
- Backend: .NET 8 (ASP.NET Core Web API), EF Core + PostgreSQL (Npgsql)
- Shared: AutoMapper, FluentValidation, Serilog, Swagger/OpenAPI
- Frontend: React + TypeScript (Vite), Tailwind CSS, Vite PWA

## Solution Layout
- `UniversityExamScheduler.Domain` - entities and enums.
- `UniversityExamScheduler.Application` - DTOs, services, validators, AutoMapper profiles, application exceptions.
- `UniversityExamScheduler.Infrastructure` - EF Core DbContext, repositories, Unit of Work, migrations.
- `UniversityExamScheduler.WebApi` - controllers, middleware, DI setup, Swagger/Serilog configuration.
- `frontend/` - Vite + React UI.
- `docs/` - requirements, database schema, technical docs, and runbook.

## Quick Start
### Prerequisites
- .NET 8 SDK
- Node.js 20+ and npm
- PostgreSQL

### Backend
1. Set `ConnectionStrings:DefaultConnection` and `Jwt:Key` in `UniversityExamScheduler.WebApi/appsettings.Development.json`.
2. Optional: set `SeedDemoData` to control demo seeding in development.
3. Apply migrations if needed:
   ```bash
   dotnet ef database update -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi
   ```
4. Run the API:
   ```bash
   dotnet run --project UniversityExamScheduler.WebApi
   ```
5. Open Swagger UI at `http://localhost:5000/` (or the configured port).

### Frontend (Vite + React)
1. Install deps: `cd frontend && npm install`
2. Run dev server: `npm run dev` (proxies `/api` to `http://127.0.0.1:5000`)

Auth token is stored in `localStorage` (`ues_token`) and sent automatically by the API client.

## Auth (demo)
- Use `/api/auth/login` with usernames: `student`, `starosta`, `prowadzacy`, `dziekanat`, `admin` (any password).
- `/api/auth/me` returns the current user from the JWT.
- Domain controllers require `Authorization: Bearer <token>`.

## Testing
- Backend: `dotnet test`
- Frontend: `cd frontend && npm run test`

## Documentation
- `docs/DeveloperRunbook.md`
- `docs/TechnicalDocumentation.md`
- `docs/DatabaseSchema.md`
- `docs/BussinessRequirements.md` (plus `docs/BussinessRequirements.pdf`)
- `docs/react-best-practices.md`
- `frontend/README.md`
