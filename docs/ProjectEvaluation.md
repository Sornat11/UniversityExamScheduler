# Kryteria oceny - analiza projektu

Zrodla: README.md, docs/*, UniversityExamScheduler.*, frontend/.

## 1. Dzialajace MVP + kompletnosc scenariuszy (60%)
Zrealizowane:
- Instalacja i demo: README + DeveloperRunbook, seed demo data, docker compose (backend + Postgres).
- CRUD + walidacje dla encji: Users, StudentGroups, Rooms, Exams, ExamSessions, ExamTerms, ExamTermHistory; FluentValidation; error middleware.
- Walidacje konfliktow terminow (kolizje sal/grup/prowadzacych) + status Conflict.
- UI dla Student/Starosta/Lecturer/DeanOffice: przeglad terminow, propozycje, akceptacje, panel dziekanatu, kalendarz; empty states i toasty.

Czesciowo:
- UI admina: placeholder "Panel admina (Admin)".
- CRUD w UI: brak widokow do zarzadzania wszystkimi encjami (np. rooms, lecturers, students, student_groups, term_history) - tylko API.

Braki:
- Widok historii zmian terminow w UI.
- Panel admina: mozliwosc dodania/edycji/usuniecia kazdej encji (np. dodanie nowego pokoju z pelnymi danymi, dodanie prowadzacego, edycja/usuniecie studentow).

Dodatkowe punkty:
- Statusy i workflow: sa (ExamTermStatus + endpointy approve/reject/final).
- Raporty/eksport: CSV eksport w harmonogramie studenta.
- UX: potwierdzenia usuniecia w panelu dziekanatu, toasty, empty states.

## 2. Skalowalnosc i poprawnosc wspolbieznosci (10%)
Zrealizowane:
- Backend stateless: JWT bearer, brak sesji serwerowej.
- Filtry w API: np. examTerm?courseId, studentGroup?name, room?roomNumber, examTermHistory?examTermId, user search.

Czesciowo:
- Paginacja tylko w UserController (page/pageSize); inne listy zwracaja calosc.

Braki/dodatkowe:
- Brak explicit indeksow biznesowych + uzasadnien (poza indexami FK z migracji).
- Brak cache.
- Brak testu obciazeniowego.

## 3. Bezpieczenstwo, role, audyt (10%)
Zrealizowane:
- RBAC: Student, Lecturer, DeanOffice, Admin + starosta (claim).
- Autoryzacja na poziomie API: [Authorize] + role per endpoint.
- Walidacja danych: FluentValidation, DTO.
- Audyt terminow: automatyczne wpisy ExamTermHistory + logowanie create/update/status/delete.
- Logowanie udanych/nieudanych logowan (AuthController).

Czesciowo:
- Logowanie aplikacyjne (Serilog) + middleware; brak audytu operacji.

Braki/dodatkowe:
- Brak jawnego potwierdzenia zabezpieczen OWASP (ZAP scan, CSP itd.). CSRF nie dotyczy (JWT w header).

## 4. Testy + jakosc kodu + dokumentacja API (10%)
Zrealizowane:
- Warstwy Domain/Application/Infrastructure/WebApi; spojne nazwy.
- Obsluga bledow i kody HTTP (400/401/403/404/409/500).
- Swagger/OpenAPI (auto z kontrolerow).

Czesciowo:
- Testy jednostkowe backendu (validators, services, controllers) i frontu (utils/components), repo tests z in-memory DB.
- Brak integracyjnych testow API + real DB; brak e2e.

## 5. Obserwowalnosc, dokumentacja architektury, konteneryzacja (10%)
Zrealizowane:
- Konfiguracja przez zmienne srodowiskowe (.env.example; bez sekretow w repo).
- Dockerfile.backend + docker compose (backend + Postgres); frontend uruchamiany lokalnie.
- Dokumentacja architektury z diagramami (`docs/Architecture.md`).
- Obserwowalnosc: Serilog + OpenTelemetry, endpoint `/health`, opcjonalny eksport OTLP.
