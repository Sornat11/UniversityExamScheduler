# University Exam Scheduler

Full-stack system that streamlines planning and managing university exams. It coordinates students, lecturers, student representatives (starosta), and dean's office staff while reducing scheduling conflicts and organizational errors.

## Features
- CRUD for users, student groups, rooms, courses/exams, sessions, exam terms, and term history.
- FluentValidation for request validation (automatic 400 responses on invalid payloads).
- Consistent error handling (404/409/500) via middleware.
- Swagger UI available at `/` for interactive testing.
- Serilog-based logging.
- OpenTelemetry metrics/traces (OTLP export) + health endpoint.
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
- Docker Desktop (recommended for backend + database)
- .NET 8 SDK (only for local backend)
- Node.js 20+ and npm (for frontend)
- PostgreSQL (only for local backend)

### Docker (backend + database)
1. Create local `.env` from the example and fill secrets:
   ```bash
   copy .env.example .env
   ```
2. Start backend + database:
   ```bash
   docker compose up --build
   ```
   Configuration (ports, credentials, JWT, OTLP) lives in `.env`.
3. Run the frontend locally:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. API is available at `http://localhost:5000/` (Swagger UI).

### Backend
1. Set environment variables (example in `.env.example`):
   - `ConnectionStrings__DefaultConnection`
   - `Jwt__Key` (min. 32 chars), `Jwt__Issuer`, `Jwt__Audience`
   - Optional: `SeedDemoData`
2. Apply migrations if needed:
   ```bash
   dotnet ef database update -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi
   ```
3. Run the API:
   ```bash
   dotnet run --project UniversityExamScheduler.WebApi
   ```
4. Open Swagger UI at `http://localhost:5000/` (or the configured port).

### Managing development secrets (dotnet user-secrets) 🔐
Dotnet User Secrets przechowuje poufne wartości lokalnie dla środowiska deweloperskiego (nie do produkcji). Poniższe polecenia są gotowe do wklejenia w PowerShell i odnoszą się do tego projektu.

- Zainicjuj mechanizm (jeśli jeszcze nie zainicjowano):
```powershell
dotnet user-secrets init --project UniversityExamScheduler.WebApi
```

- Ustaw sekrety (przykład korzysta z wartości z pliku `.env`):
```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=UniversityExamSchedulerDb;Username=postgres;Password=postgres" --project UniversityExamScheduler.WebApi

dotnet user-secrets set "Jwt:Issuer" "UniversityExamScheduler" --project UniversityExamScheduler.WebApi

dotnet user-secrets set "Jwt:Audience" "UniversityExamScheduler" --project UniversityExamScheduler.WebApi

dotnet user-secrets set "Jwt:Key" "DEV_ONLY_0123456789abcdef0123456789abcdef0123456789abcdef" --project UniversityExamScheduler.WebApi

dotnet user-secrets set "Jwt:ExpiresMinutes" "120" --project UniversityExamScheduler.WebApi
```

- Wyświetl istniejące sekrety:
```powershell
dotnet user-secrets list --project UniversityExamScheduler.WebApi
```

- Usuń sekret:
```powershell
dotnet user-secrets remove "Jwt:Key" --project UniversityExamScheduler.WebApi
```

- Alternatywnie możesz podejrzeć plik secrets.json (Windows):
```powershell
Get-Content "$env:APPDATA\Microsoft\UserSecrets\898e15a0-f26a-405f-99a4-0b455737b933\secrets.json" | ConvertFrom-Json
```

Uwaga:
- User Secrets są przeznaczone tylko do środowiska development — na produkcji używaj bezpiecznego magazynu (np. Azure Key Vault, AWS Secrets Manager) lub zmiennych środowiskowych.
- Nigdy nie commituj ani nie wystawiaj wartości ze `secrets.json` publicznie.



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
- `docs/Architecture.md`
- `docs/DatabaseSchema.md`
- `docs/BussinessRequirements.md` (plus `docs/BussinessRequirements.pdf`)
- `docs/react-best-practices.md`
- `frontend/README.md`
