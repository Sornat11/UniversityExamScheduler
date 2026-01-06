/* src/pages/student/studentExamData.ts
   Wspólne źródło danych (MOCK) dla:
   - kalendarza (schedule)
   - list przedmiotów (subjects)
   - panelu dziekanatu (panel)
   Bez auth po stronie frontu.
*/

export type ExamStatus = "Proponowany" | "Częściowo zatwierdzony" | "Zatwierdzony";

export type ExamEvent = {
    id: string;

    // główne pola
    title: string;
    dateISO: string; // YYYY-MM-DD
    time?: string; // HH:mm
    room?: string;

    // kontekst (do tabeli)
    fieldOfStudy?: string; // "Informatyka"
    studyType?: string; // "Stacjonarne" / "Niestacjonarne"
    year?: string; // "1".."5"
    lecturer?: string; // "Dr Piotr Wiśniewski"

    // workflow zatwierdzeń
    approvedByStarosta?: boolean;
    approvedByLecturer?: boolean;
    deanApproved?: boolean;

    // status wyliczany z flag
    status: ExamStatus;

    createdAtISO?: string;
};

export type SessionPeriod = {
    startISO: string; // YYYY-MM-DD
    endISO: string;   // YYYY-MM-DD
};

export type ProposeExamTermInput = {
    title: string;
    dateISO: string;
    time?: string;
    room?: string;

    fieldOfStudy?: string;
    studyType?: string;
    year?: string;
    lecturer?: string;

    // opcjonalnie – kto stworzył propozycję (nie jest wymagane do działania)
    proposer?: "Student" | "Starosta" | "Lecturer" | "DeanOffice";
};

// -----------------------------
// LocalStorage keys
// -----------------------------
const LS_EXAMS_KEY = "ues_exams_v1";
const LS_SESSION_KEY = "ues_session_v1";

// -----------------------------
// In-memory store + listeners
// -----------------------------
let isLoaded = false;
let exams: ExamEvent[] = [];
const listeners = new Set<() => void>();

let session: SessionPeriod | null = null;
const sessionListeners = new Set<() => void>();

function notify() {
    persist();
    for (const l of listeners) l();
}

function notifySession() {
    persistSession();
    for (const l of sessionListeners) l();
}

function persist() {
    try {
        localStorage.setItem(LS_EXAMS_KEY, JSON.stringify(exams));
    } catch {
        // ignore
    }
}

function persistSession() {
    try {
        localStorage.setItem(LS_SESSION_KEY, JSON.stringify(session));
    } catch {
        // ignore
    }
}

function safeParse<T>(raw: string | null): T | null {
    if (!raw) return null;
    try {
        return JSON.parse(raw) as T;
    } catch {
        return null;
    }
}

function nowISO() {
    return new Date().toISOString();
}

function genId() {
    // wystarczające do mocków
    return "ex_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

function recomputeStatus(e: ExamEvent): ExamStatus {
    if (e.deanApproved) return "Zatwierdzony";
    if (e.approvedByStarosta || e.approvedByLecturer) return "Częściowo zatwierdzony";
    return "Proponowany";
}

function normalizeExam(e: ExamEvent): ExamEvent {
    const approvedByStarosta = Boolean(e.approvedByStarosta);
    const approvedByLecturer = Boolean(e.approvedByLecturer);
    const deanApproved = Boolean(e.deanApproved);

    const normalized: ExamEvent = {
        ...e,
        approvedByStarosta,
        approvedByLecturer,
        deanApproved,
        status: recomputeStatus({ ...e, approvedByStarosta, approvedByLecturer, deanApproved }),
    };

    return normalized;
}

// -----------------------------
// Default mocks (zgodne z figmą)
// -----------------------------
function defaultMockExams(): ExamEvent[] {
    const base = {
        fieldOfStudy: "Informatyka",
        studyType: "Stacjonarne",
        year: "3",
    };

    return [
        // Zatwierdzone (finalnie przez dziekanat)
        normalizeExam({
            id: "ex_math_1",
            title: "Matematyka",
            lecturer: "Dr Jan Kowalczyk",
            dateISO: "2025-01-20",
            time: "10:00",
            room: "A-101",
            ...base,
            approvedByStarosta: true,
            approvedByLecturer: true,
            deanApproved: true,
            status: "Zatwierdzony",
            createdAtISO: "2025-01-01T10:00:00.000Z",
        }),
        normalizeExam({
            id: "ex_networks_1",
            title: "Sieci komputerowe",
            lecturer: "Dr Tomasz Nowicki",
            dateISO: "2025-01-28",
            time: "11:00",
            room: "A-102",
            ...base,
            approvedByStarosta: true,
            approvedByLecturer: true,
            deanApproved: true,
            status: "Zatwierdzony",
            createdAtISO: "2025-01-02T10:00:00.000Z",
        }),

        // Częściowo zatwierdzone
        normalizeExam({
            id: "ex_prog_1",
            title: "Programowanie",
            lecturer: "Dr Piotr Wiśniewski",
            dateISO: "2025-01-22",
            time: "14:00",
            room: "B-205",
            ...base,
            approvedByLecturer: true,
            approvedByStarosta: false,
            deanApproved: false,
            status: "Częściowo zatwierdzony",
            createdAtISO: "2025-01-03T10:00:00.000Z",
        }),

        // Proponowane
        normalizeExam({
            id: "ex_db_1",
            title: "Bazy danych",
            lecturer: "Dr Anna Lewandowska",
            dateISO: "2025-01-25",
            time: "09:00",
            room: "C-301",
            ...base,
            approvedByStarosta: false,
            approvedByLecturer: false,
            deanApproved: false,
            status: "Proponowany",
            createdAtISO: "2025-01-04T10:00:00.000Z",
        }),

        // Inne kierunki / typy (żeby filtry wyglądały sensownie)
        normalizeExam({
            id: "ex_algo_1",
            title: "Algorytmy",
            lecturer: "Dr Katarzyna Wojciechowska",
            dateISO: "2025-01-30",
            time: "16:00",
            room: "D-101",
            fieldOfStudy: "Informatyka",
            studyType: "Niestacjonarne",
            year: "2",
            approvedByStarosta: false,
            approvedByLecturer: false,
            deanApproved: false,
            status: "Proponowany",
            createdAtISO: "2025-01-05T10:00:00.000Z",
        }),

        // Propozycja w 2026 (żeby w miesiącu styczniu było coś widoczne)
        normalizeExam({
            id: "ex_math_2026",
            title: "Matematyka",
            lecturer: "Dr Piotr Wiśniewski",
            dateISO: "2026-01-05",
            time: "16:22",
            room: "A-100",
            ...base,
            approvedByStarosta: false,
            approvedByLecturer: false,
            deanApproved: false,
            status: "Proponowany",
            createdAtISO: "2025-12-30T10:00:00.000Z",
        }),
    ];
}

function defaultMockSession(): SessionPeriod {
    return { startISO: "2025-01-15", endISO: "2025-02-15" };
}

// -----------------------------
// Public API (używane przez strony)
// -----------------------------

/** Udaje “fetch” – ładuje dane z localStorage albo z mocków */
export async function ensureExamDataLoaded(): Promise<void> {
    if (isLoaded) return;

    // symulacja opóźnienia (żeby UI miało “Loading…” jak w realu)
    await new Promise((r) => setTimeout(r, 120));

    const stored = safeParse<ExamEvent[]>(localStorage.getItem(LS_EXAMS_KEY));
    const storedSession = safeParse<SessionPeriod>(localStorage.getItem(LS_SESSION_KEY));

    if (stored && Array.isArray(stored) && stored.length > 0) {
        exams = stored.map(normalizeExam);
    } else {
        exams = defaultMockExams();
    }

    session = storedSession ?? defaultMockSession();

    isLoaded = true;
}

/** Snapshot – nie mutuj tej tablicy w miejscu */
export function getExamDataSnapshot(): ExamEvent[] {
    return exams.slice();
}

/** Alias dla starych importów */
export const getStudentExamData = getExamDataSnapshot;

export function subscribeExamData(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

// -----------------------------
// Session period (dziekanat panel)
// -----------------------------
export function getSessionPeriodSnapshot(): SessionPeriod | null {
    return session ? { ...session } : null;
}

export function subscribeSessionPeriod(fn: () => void): () => void {
    sessionListeners.add(fn);
    return () => sessionListeners.delete(fn);
}

export function setSessionPeriod(startISO: string, endISO: string) {
    session = { startISO, endISO };
    notifySession();
}

// -----------------------------
// CRUD / workflow actions
// -----------------------------

/** Dodanie propozycji terminu (starosta/prowadzący) */
export function proposeExamTerm(input: ProposeExamTermInput): ExamEvent {
    const e: ExamEvent = normalizeExam({
        id: genId(),
        title: input.title.trim(),
        dateISO: input.dateISO,
        time: input.time,
        room: input.room,
        fieldOfStudy: input.fieldOfStudy,
        studyType: input.studyType,
        year: input.year,
        lecturer: input.lecturer,

        approvedByStarosta: false,
        approvedByLecturer: false,
        deanApproved: false,
        status: "Proponowany",
        createdAtISO: nowISO(),
    });

    exams = [e, ...exams];
    notify();
    return e;
}

/** Ogólny update eventu (gdy chcesz coś podmienić bez robienia osobnych funkcji) */
export function updateExam(id: string, patch: Partial<ExamEvent>) {
    exams = exams.map((e) => (e.id === id ? normalizeExam({ ...e, ...patch }) : e));
    notify();
}

/** Starosta akceptuje propozycję */
export function approveByStarosta(id: string) {
    exams = exams.map((e) => {
        if (e.id !== id) return e;
        const next = normalizeExam({ ...e, approvedByStarosta: true });
        return next;
    });
    notify();
}

/** Prowadzący akceptuje propozycję */
export function approveByLecturer(id: string) {
    exams = exams.map((e) => {
        if (e.id !== id) return e;
        const next = normalizeExam({ ...e, approvedByLecturer: true });
        return next;
    });
    notify();
}

/** Dziekanat finalnie zatwierdza (wtedy status zawsze Zatwierdzony) */
export function deanFinalApprove(id: string) {
    exams = exams.map((e) => {
        if (e.id !== id) return e;
        const next = normalizeExam({ ...e, deanApproved: true });
        return next;
    });
    notify();
}

/** Dziekanat finalnie odrzuca – w mockach usuwamy z listy */
export function deanFinalReject(id: string) {
    exams = exams.filter((e) => e.id !== id);
    notify();
}

/** Reset do mocków (przydatne w dev) */
export function resetToMocks() {
    exams = defaultMockExams();
    session = defaultMockSession();
    persist();
    persistSession();
    notify();
    notifySession();
}

// -----------------------------
// Helpers (np. eksport CSV)
// -----------------------------
export function exportExamDataToCSVString(rows?: ExamEvent[]): string {
    const data = (rows ?? exams).slice();

    const header = [
        "Przedmiot",
        "Kierunek",
        "Typ",
        "Rok",
        "Prowadzący",
        "Data",
        "Godzina",
        "Sala",
        "Status",
        "StarostaOK",
        "ProwadzacyOK",
        "DziekanatOK",
    ];

    const escape = (s: string) => `"${String(s ?? "").replace(/"/g, '""')}"`;

    const lines = data.map((e) =>
        [
            e.title,
            e.fieldOfStudy ?? "",
            e.studyType ?? "",
            e.year ?? "",
            e.lecturer ?? "",
            e.dateISO,
            e.time ?? "",
            e.room ?? "",
            e.status,
            e.approvedByStarosta ? "1" : "0",
            e.approvedByLecturer ? "1" : "0",
            e.deanApproved ? "1" : "0",
        ]
            .map(escape)
            .join(",")
    );

    return [header.join(","), ...lines].join("\n");
}

export function downloadExamCSV(filename = "egzaminy.csv", rows?: ExamEvent[]) {
    const csv = exportExamDataToCSVString(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
}

export function starostaReject(id: string) {
    exams = exams.filter((e) => e.id !== id);
    notify();
}

export const starostaApprove = approveByStarosta;
export const lecturerApprove = approveByLecturer;
export const deanApprove = deanFinalApprove;
export const deanReject = deanFinalReject;
export const starostaRejectAction = starostaReject;
