# Developer Runbook - University Exam Scheduler

## Prerequisites
- Docker Desktop (recommended for backend + database).
- .NET 8 SDK with `dotnet` on PATH (only for local backend).
- Node.js 20+ and npm (frontend).
- PostgreSQL running locally (only for local backend; configure via env vars).
- Ports: backend `5000`, frontend `5173` (adjust proxy if changed).

## Docker (backend + database)
1. Create local `.env` from the example and fill secrets:
   ```bash
   copy .env.example .env
   ```
2. Start backend + database:
   ```bash
   docker compose up --build
   ```
   Parametry (port, login, hasło, JWT, OTLP) są w `.env`.
3. Run the frontend locally:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Swagger UI: `http://localhost:5000/`.

## Backend (WebApi)
1. Configure environment variables (example in `.env.example`):
   - `ConnectionStrings__DefaultConnection`
   - `Jwt__Key` (>= 32 chars), `Jwt__Issuer`, `Jwt__Audience`
   - Optional: `SeedDemoData`
2. Apply migrations if the database is empty:
   ```bash
   dotnet ef database update -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi
   ```
3. Run the API:
   ```bash
   dotnet run --project UniversityExamScheduler.WebApi
   ```
4. Swagger UI: `http://localhost:5000/` (JWT support enabled).
5. Observability endpoint:
   - Health: `GET /health`
   - OTLP export: `OTEL_EXPORTER_OTLP_ENDPOINT` (opcjonalnie)

### Auth (demo)
- Use `/api/auth/login` with usernames: `student`, `starosta`, `prowadzacy`, `dziekanat`, `admin` (any password).
- `/api/auth/me` returns the user from the bearer token.
- Controllers require `Authorization: Bearer <token>`.

## Frontend (Vite + React)
1. Install deps: `cd frontend && npm install`.
2. Start dev server with proxy to backend: `npm run dev` (proxy `/api` -> `http://127.0.0.1:5000`).
3. Optional scripts: `npm run lint`, `npm run test`, `npm run build`.

## API - UI Contract
- Base URL: `/api`.
- JWT bearer required for all domain controllers.
- Enums are serialized as strings (e.g., `"Student"`, `"Lecturer"`).
- DateOnly/TimeOnly use ISO strings (`YYYY-MM-DD`, `HH:mm:ss`).

## Common Issues
- **DB connection refused**: verify PostgreSQL is running (local) or the `db` container is healthy (Docker).
- **JWT key length**: `Jwt:Key` must be >= 32 characters or the app will fail to start.
- **Missing env vars**: configure `ConnectionStrings__DefaultConnection` and `Jwt__Key` (see `.env.example`).
- **CORS**: frontend must be served from `http://localhost:5173` (already allowed by API policy).
- **Migrations**: if schema drifts, regenerate/apply migrations from `UniversityExamScheduler.Infrastructure`.

## Smoke Test Checklist
- API starts without errors and `/` (Swagger UI) is reachable.
- `POST /api/auth/login` returns a token; `GET /api/auth/me` works with that token.
- Authenticated request to `/api/Exam` returns 200 (or empty array if DB is empty).
- Frontend `npm run dev` shows login screen; demo login redirects to the app shell without errors.
