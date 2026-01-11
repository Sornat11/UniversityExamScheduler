# University Exam Scheduler - Database Schema Documentation

## Konwencje
- Nazwy tabel i kolumn: `snake_case` (zgodne z PostgreSQL).
- Nazwy encji w C#: `PascalCase` (mapowanie przez EF Core).
- Klucze główne są typu UUID, jeśli nie podano inaczej.

---

## 1. Użytkownicy i role (IAM)

**Tabela:** `users`
| Kolumna     | Typ         | Opis                                             |
|-------------|-------------|--------------------------------------------------|
| id          | UUID, PK    | Identyfikator użytkownika                        |
| external_id | String      | Id z SSO/USOS (opcjonalnie)                      |
| email       | String      | Email                                            |
| first_name  | String      | Imię                                             |
| last_name   | String      | Nazwisko                                         |
| role        | Enum/String | `Student`, `Lecturer`, `DeanOffice`, `Admin`     |
| is_starosta | Boolean     | Czy użytkownik pełni rolę starosty               |
| is_active   | Boolean     | Czy aktywny                                      |

---

## 2. Struktura uczelni (grupy i członkostwa)

**Tabela:** `student_groups`
| Kolumna        | Typ         | Opis                                    |
|----------------|-------------|-----------------------------------------|
| id             | UUID, PK    | Identyfikator grupy                     |
| name           | String      | Nazwa grupy                             |
| field_of_study | String      | Kierunek                                |
| study_type     | Enum        | `Stacjonarne`, `Niestacjonarne`         |
| semester       | Int         | Semestr                                 |
| starosta_id    | UUID, FK    | Starosta (FK do users.id)               |

**Tabela:** `group_members`
| Kolumna    | Typ      | Opis                                  |
|------------|----------|---------------------------------------|
| group_id   | UUID, FK | Grupa (FK do student_groups.id)       |
| student_id | UUID, FK | Student (FK do users.id)              |

**PK:** `(group_id, student_id)`

---

## 3. Logistyka (sale i sesje)

**Tabela:** `rooms`
| Kolumna      | Typ      | Opis                           |
|--------------|----------|--------------------------------|
| id           | UUID, PK | Identyfikator sali             |
| room_number  | String   | Numer sali                     |
| capacity     | Int      | Pojemność                      |
| type         | Enum     | `Lecture`, `Lab`, `Computer`   |
| is_available | Boolean  | Czy dostępna                   |

**Tabela:** `exam_sessions`
| Kolumna    | Typ      | Opis                     |
|------------|----------|--------------------------|
| id         | UUID, PK | Identyfikator sesji      |
| name       | String   | Nazwa sesji              |
| start_date | Date     | Data rozpoczęcia         |
| end_date   | Date     | Data zakończenia         |
| is_active  | Boolean  | Czy aktywna              |

---

## 4. Przedmioty (kursy)

**Tabela:** `courses` (`Exam`)
| Kolumna     | Typ      | Opis                      |
|-------------|----------|---------------------------|
| id          | UUID, PK | Identyfikator kursu       |
| name        | String   | Nazwa kursu               |
| lecturer_id | UUID, FK | Prowadzący (users.id)     |
| group_id    | UUID, FK | Grupa (student_groups.id) |

---

## 5. Egzaminy i terminy

**Tabela:** `exam_terms`
| Kolumna          | Typ      | Opis                                                                 |
|------------------|----------|----------------------------------------------------------------------|
| id               | UUID, PK | Identyfikator terminu                                                |
| course_id        | UUID, FK | Kurs (courses.id)                                                    |
| session_id       | UUID, FK | Sesja (exam_sessions.id)                                             |
| room_id          | UUID, FK | Sala (rooms.id, nullable)                                            |
| date             | Date     | Data egzaminu                                                        |
| start_time       | Time     | Godzina rozpoczęcia                                                  |
| end_time         | Time     | Godzina zakończenia                                                  |
| type             | Enum     | `FirstAttempt`, `Retake`, `Commission`                               |
| status           | Enum     | `Draft`, `ProposedByLecturer`, `ProposedByStudent`, `Conflict`, `Approved`, `Finalized`, `Rejected` |
| created_by       | UUID, FK | Kto utworzył propozycję (users.id)                                   |
| rejection_reason | String   | Powód odrzucenia (opcjonalnie)                                       |

---

## 6. Historia zmian

**Tabela:** `exam_term_history`
| Kolumna         | Typ       | Opis                                  |
|-----------------|-----------|---------------------------------------|
| id              | UUID, PK  | Identyfikator historii                |
| exam_term_id    | UUID, FK  | Termin egzaminu (exam_terms.id)       |
| changed_by      | UUID, FK  | Kto zmienił (users.id)                |
| changed_at      | Timestamp | Kiedy zmieniono                       |
| previous_status | Enum      | Poprzedni status                      |
| new_status      | Enum      | Nowy status                           |
| previous_date   | DateTime  | Poprzednia data (opcjonalnie)         |
| new_date        | DateTime  | Nowa data (opcjonalnie)               |
| comment         | String    | Komentarz (opcjonalnie)               |

---

## Kluczowe relacje i logika
- Jeden egzamin dziennie na grupę: sprawdzaj liczbę terminów w danym dniu dla grupy.
- Starosta widzi tylko egzaminy swojej grupy.
- Workflow akceptacji: statusy sterują widocznością i uprawnieniami.
- Blokada daty: data egzaminu musi mieścić się w zakresie sesji.

---

## Przykładowe zapytania

**Sprawdzenie kolizji egzaminów dla grupy:**
```sql
SELECT count(*)
FROM exam_terms t
JOIN courses c ON t.course_id = c.id
WHERE c.group_id = [ID_GRUPY] AND t.date = [DATA];
```

**Widok egzaminów dla starosty:**
```sql
SELECT *
FROM exam_terms t
JOIN courses c ON t.course_id = c.id
WHERE c.group_id = [ID_GRUPY];
```

**Walidacja daty egzaminu:**
```sql
SELECT *
FROM exam_terms t
JOIN exam_sessions s ON t.session_id = s.id
WHERE t.date < s.start_date OR t.date > s.end_date;
```

---

## Uwagi
- Wszystkie relacje FK powinny mieć ON DELETE CASCADE lub RESTRICT według potrzeb.
- Enumy mapowane w C# na typy wyliczeniowe.
- Historia zmian pozwala na audyt i wersjonowanie.

---

**Autor:** Sornat11
**Ostatnia aktualizacja:** 2026-01-11
