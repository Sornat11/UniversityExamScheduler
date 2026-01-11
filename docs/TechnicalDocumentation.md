# Dokumentacja techniczna - University Exam Scheduler

## 1. Stos technologiczny
- .NET 8 (ASP.NET Core Web API)
- Entity Framework Core + Npgsql (PostgreSQL)
- AutoMapper, FluentValidation
- Serilog (logowanie), Swagger/OpenAPI (kontrakt HTTP)
- Frontend: React + TypeScript (Vite), Tailwind CSS, Vite PWA, React Query

## 2. Architektura i podział na warstwy
- Domain - encje i enumy odzwierciedlające model danych (użytkownicy, grupy, sale, kursy/egzaminy, sesje, terminy i historia terminów).
- Application - kontrakty repozytoriów, DTO (Request/Response), serwisy domenowe, profile AutoMapper, walidatory FluentValidation, wyjątki aplikacyjne.
- Infrastructure - EF Core (ApplicationDbContext), repozytoria i Unit of Work, migracje.
- WebApi - kontrolery REST, DI, middleware obsługi wyjątków, konfiguracja Swaggera i Seriloga.
- Frontend - UI (frontend/) oparte o React Router, React Query i klienta API w `src/api`.

## 3. Przepływ żądania
1. Klient wywołuje endpoint kontrolera.
2. Model binding + automatyczna walidacja FluentValidation (400 z listą błędów przy niepowodzeniu).
3. Kontroler deleguje do serwisu aplikacyjnego.
4. Serwis korzysta z `IUnitOfWork`/repozytoriów i wykonuje walidacje biznesowe (np. kolizje, zakres dat).
5. Zmiany zapisywane przez `SaveChangesAsync`; zwracane DTO przez AutoMapper.

## 4. Model danych (skrót)
- `users` - dane kont, rola, flaga starosty, aktywność.
- `student_groups`, `group_members` - grupa, kierunek, typ studiów, semestr, starosta i członkostwa.
- `rooms` - numer, pojemność, typ sali, dostępność.
- `courses` (`Exam`) - nazwa, prowadzący, grupa.
- `exam_sessions` - nazwa, zakres dat, aktywność.
- `exam_terms` - kurs, sesja, sala (opcjonalnie), data, godziny, typ, status, autor, powód odrzucenia.
- `exam_term_history` - historia statusów/terminów z komentarzem.
Szczegóły typów i relacji: `docs/DatabaseSchema.md`.

## 5. Walidacja i obsługa błędów
- Walidatory FluentValidation dla wszystkich DTO `Create/Update` (np. zakres dat sesji, czasy start < end, wymagane identyfikatory).
- Middleware `ExceptionHandlingMiddleware`:
  - `ValidationException` -> 400 + lista błędów pól.
  - `EntityAlreadyExistsException` -> 409.
  - `EntityNotFoundException` -> 404.
  - Inne -> 500 (szczegóły w logach).

## 6. Warstwa serwisów (przykłady reguł)
- `ExamSessionService` - pilnuje, by `StartDate <= EndDate`.
- `ExamTermService` - weryfikuje istnienie sesji, sprawdza zakres dat i relację start/end time.
- `RoomService`/`StudentGroupService` - sprawdzają duplikaty (numer sali, nazwa grupy).
- `UserService` - unikalność email.

## 7. API (skrócone zestawienie)
- Auth: `POST /api/auth/login`, `GET /api/auth/me`.
- CRUD: `/api/user`, `/api/studentgroup`, `/api/room`, `/api/exam`, `/api/examsession`, `/api/examterm`, `/api/examtermhistory`.
- Filtry:
  - `/api/examterm?courseId=` - terminy danego kursu.
  - `/api/examtermhistory?examTermId=` - historia dla terminu.
  - `/api/studentgroup?name=` oraz `/api/room?roomNumber=`.
- Swagger UI dostępny pod `/`.
- JSON: enumy jako stringi, DateOnly/TimeOnly jako ISO (`YYYY-MM-DD`, `HH:mm:ss`).

## 8. Konfiguracja i uruchomienie
- Pliki konfiguracyjne: `UniversityExamScheduler.WebApi/appsettings*.json`.
- `ConnectionStrings:DefaultConnection` - połączenie do PostgreSQL.
- `Jwt:Key` musi mieć co najmniej 32 znaki.
- `SeedDemoData` kontroluje załadowanie danych przy starcie (domyślnie `true` w dev).
- `Program.cs` rejestruje DbContext, repozytoria, serwisy, AutoMapper, FluentValidation, Serilog i Swagger.
- Uruchomienie: `dotnet run --project UniversityExamScheduler.WebApi`.

## 9. Logowanie i obserwowalność
- Serilog: poziom min. `Information`, nadpisania namespace'ów Microsoft -> `Warning/Information`, wzbogacenie o nazwę środowiska.
- Wyjście: konsola (lub konfiguracja z appsettings przez `ReadFrom.Configuration`).
- Błędy HTTP logowane przez middleware.

## 10. Rozwój i testy
- Backend: `dotnet build`, `dotnet test`.
- Frontend: `npm run dev`, `npm run build`, `npm run test`.
