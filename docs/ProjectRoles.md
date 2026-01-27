# Role w projekcie i zrealizowane zadania

Ponizej opis roli i zadan na podstawie repozytorium. Uzupelnij nazwiska/osoby wg zespolu.

## Backend / API
- Implementacja Web API (.NET 8), warstw Domain/Application/Infrastructure/WebApi.
- JWT auth, RBAC, autoryzacja endpointow.
- CRUD dla kluczowych encji + walidacja DTO (FluentValidation).
- Error handling (middleware) i logowanie (Serilog).
- Seed demo data oraz migracje bazy.

## Frontend / UI
- React + Vite UI z rolami: Student, Starosta, Lecturer, DeanOffice.
- Kalendarz i listy terminow, propozycje terminow, akceptacje/odrzucenia.
- Panel dziekanatu (uzytkownicy, sesje, przedmioty).
- Eksport CSV harmonogramu studenta.

## DevOps / Infra
- Dockerfile.backend + docker compose (backend + Postgres); frontend uruchamiany lokalnie.
- Konfiguracja przez zmienne srodowiskowe (.env.example; bez sekretow w repo).

## QA / Testy
- Testy jednostkowe backendu (validators, services, controllers).
- Testy repozytoriow (in-memory EF) oraz wybrane testy frontend utils/components.

## Dokumentacja / Analiza
- README, DeveloperRunbook, TechnicalDocumentation, DatabaseSchema.
- BussinessRequirements (opis potrzeb i zakresu).
