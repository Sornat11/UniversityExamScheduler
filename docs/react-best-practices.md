# Najlepsze praktyki w React
## Struktura projektu, architektura i dobre nawyki

Dokument opisuje sprawdzone praktyki pracy z React. Moze sluzyc jako:
- notatka do nauki
- wewnetrzny standard projektu
- baza do pliku README

Skupia sie na skalowalnosci, czytelnosci i utrzymaniu kodu.

---

## 1. Ogolne zasady projektowania w React

### 1.1 Myslenie komponentowe
- Komponent powinien miec jedna odpowiedzialnosc.
- Jezeli komponent:
  - ma wiecej niz ~200 linii
  - laczy logike, fetchowanie danych i UI
  - to nalezy go rozbic

Zasada:
> Jesli nie da sie opisac komponentu jednym zdaniem, to robi za duzo.

---

### 1.2 Komponenty funkcyjne zamiast klas
- Stosuj funkcyjne komponenty + hooki.
- Komponenty klasowe traktuj jako legacy.

```tsx
function UserCard({ user }: Props) {
  return <div>{user.name}</div>;
}
```

---

## 2. Struktura projektu

### 2.1 Struktura feature-based (zalecana)
Niepolecana struktura warstwowa:

```
components/
services/
hooks/
pages/
```

Struktura oparta o feature:

```
src/
  api/
  app/
    store.ts
    router.tsx
    providers.tsx
  features/
    auth/
      components/
      hooks/
      services/
      auth.slice.ts
      auth.types.ts
    users/
    orders/
  shared/
    components/
    hooks/
    utils/
    types/
  pages/
  assets/
  main.tsx
```

Zalety:
- lepsza modularnosc
- latwiejsze skalowanie
- mozliwosc usuniecia calego feature jednym ruchem

---

## 3. Komponenty

### 3.1 Podzial odpowiedzialnosci
Podzial:
- Presentational (UI) - tylko propsy, brak logiki
- Container (logic) - hooki, dane, API

```tsx
// UserCard.tsx (UI)
export function UserCard({ name }: Props) {
  return <div>{name}</div>;
}
```

```tsx
// UserCardContainer.tsx
export function UserCardContainer() {
  const user = useUser();
  return <UserCard name={user.name} />;
}
```

### 3.2 Unikanie "smart everything"
Nie:
- jeden komponent robi fetch, walidacje, UI, modale

Tak:
- Page - orkiestracja
- Hook - logika
- Component - UI

---

## 4. Hooki

### 4.1 Wlasne hooki
Tworz custom hooki, gdy:
- useEffect robi sie dlugi
- logika sie powtarza

```tsx
function useUsers() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    // fetch
  }, []);
  return users;
}
```

### 4.2 Zasady uzywania hookow
- nie uzywaj hookow w if
- nie uzywaj hookow w petlach
- nie uzywaj hookow w zwyklych funkcjach
- hooki tylko na top-level komponentu lub innego hooka

---

## 5. Stan aplikacji

### 5.1 Stan lokalny
useState, useReducer:
- formularze
- modale
- lokalne UI

### 5.2 Stan globalny
Redux / Zustand / Context:
- autoryzacja
- dane uzytkownika
- koszyk
- dane wspoldzielone

Nie globalizuj wszystkiego.

### 5.3 Stan serwerowy
- Dane z API trzymaj w React Query (cache, retry, invalidacja).
- Rozdziel stan serwerowy od UI.

---

## 6. Side effects i API

### 6.1 Logika API poza komponentami
Nie:

```tsx
useEffect(() => {
  axios.get("/users");
}, []);
```

Tak:

```ts
// services/user.service.ts
export const getUsers = () => api.get("/users");
```

```tsx
useEffect(() => {
  getUsers().then(...);
}, []);
```

### 6.2 Jedno zrodlo API
- jeden klient api.ts
- interceptory
- obsluga tokenow
- centralny error handling

---

## 7. TypeScript

### 7.1 Typuj wszystko, co publiczne
- props
- dane z API
- wartosci zwracane z hookow

```ts
type User = {
  id: string;
  name: string;
};
```

### 7.2 Unikaj any
- any wylacza TypeScript
- lepiej uzyc unknown lub precyzyjnego typu

---

## 8. Nazewnictwo i czytelnosc

### 8.1 Nazwy
- komponenty: UserList, UserDetails
- hooki: useAuth, useUsers
- funkcje: getUserById

Nie: data1, temp, handleStuff

### 8.2 Organizacja plikow
- jeden komponent = jeden plik
- komponent, test i style blisko siebie

---

## 9. Wydajnosc
- nie optymalizuj na zapas
- uzywaj memo, useCallback, useMemo tylko gdy jest problem

Czytelnosc jest wazniejsza niz mikrooptymalizacje.

---

## 10. Testy
Testuj:
- hooki
- logike biznesowa
- zachowanie widokow

Nie testuj:
- szczegolow implementacji UI

Rekomendowane narzedzia: Vitest + React Testing Library.

---

## 11. Czego unikac
- logiki w JSX
- ogromnych komponentow
- globalnego stanu dla wszystkiego
- fetchowania danych w kazdym komponencie
- braku typow
- magicznych stringow
- kopiowania logiki

---

## 12. Podsumowanie (TL;DR)
- struktura feature-based
- male, czytelne komponenty
- logika w hookach
- API poza komponentami
- TypeScript wszedzie
- prostota i czytelnosc ponad spryt
