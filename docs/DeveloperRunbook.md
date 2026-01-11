# Developer Runbook - University Exam Scheduler

## Prerequisites
- .NET 8 SDK with `dotnet` on PATH.
- Node.js 20+ and npm.
- PostgreSQL running locally (default connection string in `appsettings.Development.json`).
- Ports: backend `5000`, frontend `5173` (adjust proxy if changed).

## Backend (WebApi)
1. Configure connection string in `UniversityExamScheduler.WebApi/appsettings.Development.json` (`ConnectionStrings:DefaultConnection`).
2. Ensure `Jwt:Key` has at least 32 characters.
3. Optional: toggle `SeedDemoData` to load demo entities at startup.
4. Apply migrations if the database is empty:
   ```bash
   dotnet ef database update -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi
   ```
5. Run the API:
   ```bash
   dotnet run --project UniversityExamScheduler.WebApi
   ```
6. Swagger UI: `http://localhost:5000/` (JWT support enabled).

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
- **DB connection refused**: verify PostgreSQL is running and credentials match `appsettings.Development.json`.
- **JWT key length**: `Jwt:Key` must be >= 32 characters or the app will fail to start.
- **CORS**: frontend must be served from `http://localhost:5173` (already allowed by API policy).
- **Migrations**: if schema drifts, regenerate/apply migrations from `UniversityExamScheduler.Infrastructure`.

## Smoke Test Checklist
- API starts without errors and `/` (Swagger UI) is reachable.
- `POST /api/auth/login` returns a token; `GET /api/auth/me` works with that token.
- Authenticated request to `/api/Exam` returns 200 (or empty array if DB is empty).
- Frontend `npm run dev` shows login screen; demo login redirects to the app shell without errors.
