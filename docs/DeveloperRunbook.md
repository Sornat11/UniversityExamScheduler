# Developer Runbook - University Exam Scheduler

## Prerequisites
- .NET 8 SDK with `dotnet` on PATH.
- Node.js 20+ and npm.
- PostgreSQL running locally (default connection string points to `postgres:postgres@localhost:5432`).
- Ports: backend `5000`, frontend `5173` (adjust proxy if changed).

## Backend (WebApi)
1. Configure connection string in `UniversityExamScheduler.WebApi/appsettings.Development.json` (`ConnectionStrings:DefaultConnection`).
2. Apply migrations if the database is empty:  
   ```bash
   dotnet ef database update -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi
   ```
3. Run the API:  
   ```bash
   dotnet run --project UniversityExamScheduler.WebApi
   ```
4. Swagger UI: `http://localhost:5000/` (JWT support enabled).

### Auth (demo)
- Use `/api/auth/login` with usernames: `student`, `starosta`, `prowadzacy`, `dziekanat`, `admin` (any password).  
- `/api/auth/me` returns the user from the bearer token.  
- Controllers require `Authorization: Bearer <token>`.

## Frontend (Vite + React)
1. Install deps: `cd frontend && npm install`.
2. Start dev server with proxy to backend: `npm run dev` (proxy `/api` -> `http://127.0.0.1:5000`).
3. Auth tokens are stored in `localStorage` (`ues_token`) and sent automatically by the API client.

## API ↔ UI Contract
- Base URL: `/api`.
- JWT bearer required for all domain controllers.
- Enums are serialized as strings (e.g., `"Student"`, `"Lecturer"`).
- Date/time types use ISO strings (`DateOnly`/`TimeOnly`).

## Common Issues
- **DB connection refused**: verify PostgreSQL is running and credentials match `appsettings.Development.json`.
- **JWT key length**: `Jwt:Key` must be ≥32 characters or the app will fail to start.
- **CORS**: frontend must be served from `http://localhost:5173` (already allowed by API policy).
- **Migrations**: if schema drifts, regenerate/apply migrations from `UniversityExamScheduler.Infrastructure`.

## Smoke Test Checklist
- API starts without errors and `/swagger` is reachable.
- `POST /api/auth/login` returns a token; `GET /api/auth/me` works with that token.
- Authenticated request to `/api/Exam` returns 200 (or empty array if DB is empty).
- Frontend `npm run dev` shows login screen, demo login redirects to the app shell without errors.
