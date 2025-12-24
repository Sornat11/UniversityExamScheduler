# SYSTEM ORGANIZACJI EGZAMINÓW - DOKUMENT SPECYFIKACYJNY

## 1. Opis ogólny systemu
System organizacji egzaminów to aplikacja webowa wspomagająca planowanie, zatwierdzanie oraz przeglądanie terminów egzaminów na uczelni. System usprawnia komunikację pomiędzy studentami, prowadzącymi, dziekanatem oraz starostami, eliminując kolizje terminów i błędy organizacyjne.

## 2. Cel biznesowy projektu
Celem projektu jest stworzenie zintegrowanego systemu informatycznego, który:
* Automatyzuje proces planowania egzaminów.
* Redukuje błędy i kolizje terminów.
* Zapewnia szybki dostęp do harmonogramów.
* Zwiększa komunikację między studentami, prowadzącymi i administracją.

**Efekty biznesowe:**
* Oszczędność czasu.
* Redukcja stresu logistycznego.
* Przejrzystość procesu.

## 3. Kluczowe obiekty systemowe

### 3.1 Egzamin
**Atrybuty:**
* Przedmiot
* Kierunek studiów
* Typ studiów
* Rok studiów
* Prowadzący

### 3.2 Termin egzaminu
**Atrybuty:**
* Powiązany egzamin
* Data i godzina
* Sala
* Status (propozycja / zatwierdzony / odrzucony)

### 3.3 Okres sesji
**Atrybuty:**
* Data rozpoczęcia
* Data zakończenia

## 4. Role w systemie

### 4.1 Student
* Podgląd egzaminów dla swojego kierunku, typu i roku.
* Otrzymywanie powiadomień o zmianach i zbliżających się egzaminach.
* Eksport egzaminów do kalendarza.

### 4.2 Prowadzący
* Podgląd swoich egzaminów.
* Podgląd egzaminów dla danego kierunku, typu i roku.
* Składanie propozycji terminów egzaminów.
* Zatwierdzanie propozycji złożonych przez starostę.

### 4.3 Starosta
* Składanie propozycji terminów egzaminów.
* Zatwierdzanie propozycji prowadzących.
* Dostęp wyłącznie do swojej grupy.

### 4.4 Dziekanat
* Wprowadzanie okresu trwania sesji.
* Zatwierdzanie ostatecznych terminów egzaminów.
* Przegląd kalendarzy dowolnego kierunku i prowadzącego.
* Generowanie raportów.

### 4.5 Administrator systemu
* Zarządzanie użytkownikami i uprawnieniami.
* Archiwizacja danych.
* Kontrola bezpieczeństwa.

## 5. Funkcjonalności systemu

### 5.1 Zarządzanie egzaminami
* Automatyczny odczyt egzaminów z planu studiów.
* Możliwość ręcznego dodania egzaminu.
* Edycja i archiwizacja egzaminów.

### 5.2 Zarządzanie sesją
* Definiowanie okresu sesji zimowej i letniej.
* Blokada terminów poza sesją.

### 5.3 Propozycje terminów
* Formularz propozycji terminu egzaminu.
* **Walidacje:**
    * Sprawdzenie dostępności sali.
    * Maksymalnie jeden egzamin dziennie dla danego kierunku, typu i roku.

### 5.4 Zatwierdzanie terminów
* Przez prowadzącego lub starostę (w zależności od autora propozycji).
* Ostateczne zatwierdzenie przez dziekanat.

### 5.5 Kalendarz egzaminów
* Widok miesięczny.
* Oznaczenia dni z egzaminami (kropki).
* Podgląd szczegółów po kliknięciu dnia.

### 5.6 Eksport danych
* iCal
* PDF
* Excel
* Możliwość wyboru zakresu dat.

### 5.7 Powiadomienia
**E-mail o:**
* Nowych terminach.
* Zmianach.
* Nadchodzących egzaminach.

### 5.8 Historia zmian
* Pełne wersjonowanie decyzji.
* Podgląd historii edycji.

### 5.9 Moduł alternatyw i głosowania (opcjonalnie)
* Możliwość dodania kilku wariantów terminu.
* Głosowanie przez studentów.

## 6. KPI (wskaźniki sukcesu)
* Skrócenie czasu organizacji sesji o minimum 20%.
* 100% skuteczności pod względem eliminacji kolizji.
* Poziom satysfakcji użytkowników powyżej 75%.

## 7. Założenia i ograniczenia systemowe
* Aplikacja webowa (RWD).
* Logowanie przez system uczelniany (SSO).
* Integracja z USOS / e-Dziekanat.
* Automatyczne raporty PDF.
* System powiadomień e-mail.
* Zgodność z RODO.
* Logi dostępu.
* Obsługa min. 1000 użytkowników jednocześnie.

## 8. Moduły systemowe (ekrany)
* Rejestracja
* Logowanie
* Kalendarz egzaminów
* Lista egzaminów
* Formularz propozycji terminu
* Panel zatwierdzania
* Zarządzanie sesją
* Panel administracyjny

## 9. Analiza ról – widoki i zagrożenia

### STUDENT
**Funkcje:**
* Logowanie
* Kalendarz swojego kierunku
* Eksport danych

**Zagrożenia:**
* Widoczność cudzych egzaminów
* Brak szyfrowania haseł

### PROWADZĄCY
* Podgląd swoich egzaminów
* Propozycja terminu
* Zatwierdzanie propozycji starosty

### STAROSTA
* Propozycje terminów
* Zatwierdzanie terminów prowadzącego
* Dostęp tylko do swojej grupy

### DZIEKANAT
* Definiowanie sesji
* Zatwierdzanie ostatecznych terminów
* Eksport danych
* Podgląd dowolnego kierunku

## 10. Pytania do klienta
1. Jakie informacje mają być widoczne przy egzaminie?
2. Kto ostatecznie zatwierdza terminy?
3. Ile dni przed egzaminem zamykane są zapisy?
4. Czy blokować kolizje terminów u studenta?
5. Czy wymagane są powiadomienia SMS?
6. Jak długo przechowywać archiwalne dane?
7. Czy obsługujemy poprawki i egzaminy komisyjne?
8. Czy wersja mobilna ma być PWA czy osobna aplikacja?

## 11. Inspiracje rynkowe
* https://www.timeedit.com/products/exam
* https://www.academic-scheduler.com