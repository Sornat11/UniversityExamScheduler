# University Exam Scheduler – Database Schema Documentation

## Konwencje
- Nazwy tabel i kolumn: `snake_case` (zgodne z PostgreSQL)
- Nazwy encji w C#: `PascalCase` (mapowanie przez EF Core)

---

## 1. Użytkownicy i Role (IAM)

**Tabela:** `users`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| id              | UUID, PK    | Identyfikator użytkownika                 |
| external_id     | String      | Id z SSO/USOS                             |
| email           | String      | Email                                     |
| first_name      | String      | Imię                                      |
| last_name       | String      | Nazwisko                                  |
| role            | Enum/String | 'STUDENT', 'LECTURER', 'DEAN_OFFICE', 'ADMIN' |
| is_active       | Boolean     | Czy aktywny                               |

---

## 2. Struktura Uczelni (Grupy i Starostowie)

**Tabela:** `student_groups`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| id              | UUID, PK    | Identyfikator grupy                       |
| name            | String      | Nazwa grupy                               |
| field_of_study  | String      | Kierunek                                  |
| study_type      | Enum        | 'Stacjonarne', 'Niestacjonarne'           |
| semester        | Int         | Semestr                                   |
| starosta_id     | UUID, FK    | Starosta (FK do users.id)                 |

**Tabela:** `group_members`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| group_id        | UUID, FK    | Grupa (FK do student_groups.id)           |
| student_id      | UUID, FK    | Student (FK do users.id)                  |

---

## 3. Logistyka (Sale i Sesje)

**Tabela:** `rooms`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| id              | UUID, PK    | Identyfikator sali                        |
| room_number     | String      | Numer sali                                |
| capacity        | Int         | Pojemność                                 |
| type            | Enum        | 'LECTURE', 'LAB', 'COMPUTER'              |
| is_available    | Boolean     | Czy dostępna                              |

**Tabela:** `exam_sessions`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| id              | UUID, PK    | Identyfikator sesji                       |
| name            | String      | Nazwa sesji                               |
| start_date      | Date        | Data rozpoczęcia                          |
| end_date        | Date        | Data zakończenia                          |
| is_active       | Boolean     | Czy aktywna                               |

---

## 4. Przedmioty (Kursy)

**Tabela:** `courses`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| id              | UUID, PK    | Identyfikator kursu                       |
| name            | String      | Nazwa kursu                               |
| lecturer_id     | UUID, FK    | Prowadzący (FK do users.id)               |
| group_id        | UUID, FK    | Grupa (FK do student_groups.id)           |

---

## 5. Egzaminy i Terminy

**Tabela:** `exam_terms`
| Kolumna           | Typ         | Opis                                      |
|-------------------|-------------|-------------------------------------------|
| id                | UUID, PK    | Identyfikator terminu                     |
| course_id         | UUID, FK    | Kurs (FK do courses.id)                   |
| session_id        | UUID, FK    | Sesja (FK do exam_sessions.id)            |
| room_id           | UUID, FK    | Sala (FK do rooms.id, Nullable)           |
| date              | Date        | Data egzaminu                             |
| start_time        | Time        | Godzina rozpoczęcia                       |
| end_time          | Time        | Godzina zakończenia                       |
| type              | Enum        | 'FIRST_ATTEMPT', 'RETAKE', 'COMMISSION'   |
| status            | Enum        | Status egzaminu (patrz niżej)             |
| created_by        | UUID, FK    | Kto utworzył propozycję                   |
| rejection_reason  | String      | Powód odrzucenia (Nullable)               |

**Enum:** `ExamTermStatus`
- DRAFT
- PROPOSED_BY_LECTURER
- PROPOSED_BY_STUDENT
- CONFLICT
- APPROVED
- FINALIZED
- REJECTED

---

## 6. Historia Zmian

**Tabela:** `exam_term_history`
| Kolumna         | Typ         | Opis                                      |
|-----------------|-------------|-------------------------------------------|
| id              | BigInt, PK  | Identyfikator historii                    |
| exam_term_id    | UUID, FK    | Termin egzaminu (FK do exam_terms.id)     |
| changed_by      | UUID, FK    | Kto zmienił                               |
| changed_at      | Timestamp   | Kiedy zmieniono                           |
| previous_status | Enum        | Poprzedni status                          |
| new_status      | Enum        | Nowy status                               |
| previous_date   | DateTime    | Poprzednia data (Nullable)                |
| new_date        | DateTime    | Nowa data (Nullable)                      |
| comment         | String      | Komentarz                                 |

---

## Kluczowe Relacje i Logika
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

**Widok egzaminów dla Starosty:**
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

**Autor projektu: Sornat11**
**Data: 2025-12-08**
