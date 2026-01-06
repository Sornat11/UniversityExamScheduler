# Dokumentacja techniczna — University Exam Scheduler

## 1. Stos technologiczny
-  .NET 8 (ASP.NET Core Web API)
- Entity Framework Core + Npgsql (PostgreSQL)
- AutoMapper, FluentValidation
- Serilog (logowanie), Swagger/OpenAPI (kontrakt HTTP)

## 2. Architektura i podział na warstwy
- **Domain** – encje i enumy odzwierciedlające model danych (użytkownicy, grupy, sale, kursy/egzaminy, sesje, terminy i historia terminów).
- **Application** – kontrakty repozytoriów (`Contracts`), DTO (Request/Respone), serwisy domenowe (logika CRUD + walidacje biznesowe), profile AutoMapper, walidatory FluentValidation, wyjątki aplikacyjne.
- **Infrastructure** – EF Core (`ApplicationDbContext`), repozytoria i Unit of Work, migracje (schema w `docs/DatabaseSchema.md`).
- **WebApi** – kontrolery REST, DI, middleware obsługi wyjątków, konfiguracja Swaggera i Seriloga.

## 3. Przepływ żądania
1. Klient wywołuje endpoint kontrolera.
2. Model binding + automatyczna walidacja FluentValidation (400 z listą błędów przy niepowodzeniu).
3. Kontroler deleguje do serwisu aplikacyjnego.
4. Serwis korzysta z `IUnitOfWork`/repozytoriów, wykonuje walidacje (np. kolizje, zakres dat).
5. Zmiany zapisywane przez `SaveChangesAsync`; zwracane DTO przez AutoMapper.

## 4. Model danych (skrót)
- `users` – dane kont, rola (Student/Lecturer/DeanOffice/Admin), aktywność.
- `student_groups`, `group_members` – grupa, kierunek, typ studiów, semestr, starosta.
- `rooms` – numer, pojemność, typ sali, dostępność.
- `courses` (`Exam`) – nazwa, prowadzący, grupa.
- `exam_sessions` – nazwa, zakres dat, aktywność.
- `exam_terms` – kurs, sesja, sala (opcjonalnie), data, godziny, typ, status, autor, powód odrzucenia.
- `exam_term_history` – historia statusów/terminów z komentarzem.
Szczegóły typów i relacji: `docs/DatabaseSchema.md`.

## 5. Walidacja i obsługa błędów
- Walidatory FluentValidation dla wszystkich DTO `Create/Update` (np. zakres dat sesji, czasy start < end, wymagane identyfikatory).
- Middleware `ExceptionHandlingMiddleware`:
  - `ValidationException` → 400 + lista błędów pól.
  - `EntityAlreadyExistsException` → 409.
  - `EntityNotFoundException` → 404.
  - Inne → 500 (szczegóły w logach).

## 6. Warstwa serwisów (przykłady reguł)
- `ExamSessionService` – pilnuje, by `StartDate <= EndDate`.
- `ExamTermService` – weryfikuje istnienie sesji oraz czy data mieści się w jej zakresie; kontroluje relację start/end time.
- `RoomService`/`StudentGroupService` – sprawdzają duplikaty (numer sali, nazwa grupy).
- `UserService` – unikalność email.

## 7. API (skrótowe zestawienie endpointów)
- `POST /api/user` – utworzenie użytkownika.
- `GET /api/user/{id}` / `GET /api/user?email=` – odczyt.
- `PUT /api/user/{id}` / `DELETE /api/user/{id}` – aktualizacja/usunięcie.
- Analogiczne CRUD-y: `/api/studentgroup`, `/api/room`, `/api/exam`, `/api/examsession`, `/api/examterm`, `/api/examtermhistory`.
- Filtry:
  - `/api/examterm?courseId=` – terminy danego kursu.
  - `/api/examtermhistory?examTermId=` – historia dla terminu.
  - `/api/studentgroup?name=` oraz `/api/room?roomNumber=`.
- Swagger UI dostępny pod `/` (RoutePrefix pusty).

## 8. Konfiguracja i uruchomienie
- Pliki konfig.: `UniversityExamScheduler.WebApi/appsettings*.json`.
- Klucz `ConnectionStrings:DefaultConnection` – łańcuch do PostgreSQL.
- Startup: `Program.cs` rejestruje DbContext, repozytoria, serwisy, AutoMapper, FluentValidation, Serilog, Swagger.
- Uruchomienie: `dotnet run --project UniversityExamScheduler.WebApi`.

## 9. Logowanie i observability
- Serilog: poziom min. `Information`, nadpisania namespace’ów Microsoft → `Warning/Information`, logger wzbogacony o nazwę środowiska.
- Wyjście: konsola (lub konfiguracja z appsettings przez `ReadFrom.Configuration`).
- Błędy HTTP logowane przez middleware.

## 10. Rozwój i testy
- Budowanie: `dotnet build`.
- Migracje EF Core (przykład): `dotnet ef migrations add <name> -p UniversityExamScheduler.Infrastructure -s UniversityExamScheduler.WebApi`.
- Uruchomienie testów (kiedy zostaną dodane): `dotnet test`.

