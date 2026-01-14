/* src/features/exams/data/examStore.ts
   Wspolne zrodlo danych (API) dla:
   - kalendarza (schedule)
   - list przedmiotow (subjects)
   - panelu dziekanatu (panel)
   Bez auth po stronie frontu.
*/

import {
    approveExamTermByLecturer,
    approveExamTermByStarosta,
    createExamTerm,
    finalApproveExamTerm,
    finalRejectExamTerm,
    fetchExamEvents,
    rejectExamTermByLecturer,
    rejectExamTermByStarosta,
} from "../../../api/exams";
import { fetchExamSessions, type ExamSessionDto, type ExamTermStatus } from "../../../api/admin";

export type ExamStatus = "Proponowany" | "Zatwierdzony" | "Odrzucony";
export type { ExamTermStatus };

export type ExamEvent = {
    id: string;

    // glowne pola
    title: string;
    dateISO: string; // YYYY-MM-DD
    time?: string; // HH:mm
    room?: string;

    // kontekst (do tabeli)
    fieldOfStudy?: string; // "Informatyka"
    studyType?: string; // "Stacjonarne" / "Niestacjonarne"
    year?: string; // "1".."5"
    groupId?: string;
    groupName?: string;
    studentUsernames?: string[];
    lecturerUsername?: string;
    lecturer?: string; // "Dr Piotr Wisniewski"

    // workflow zatwierdzen
    approvedByStarosta?: boolean;
    approvedByLecturer?: boolean;
    deanApproved?: boolean;

    // status terminu z backendu
    status: ExamTermStatus;

    createdAtISO?: string;
};

export type SessionPeriod = {
    startISO: string; // YYYY-MM-DD
    endISO: string; // YYYY-MM-DD
};

export type ProposeExamTermInput = {
    title: string;
    dateISO: string;
    time?: string;
    room?: string;

    courseId?: string;
    sessionId?: string;
    roomId?: string | null;
    termType?: "FirstAttempt" | "Retake" | "Commission";
    startTime?: string;
    endTime?: string;

    fieldOfStudy?: string;
    studyType?: string;
    year?: string;
    groupId?: string;
    groupName?: string;
    studentUsernames?: string[];
    lecturerUsername?: string;
    lecturer?: string;

    // opcjonalnie kto stworzyl propozycje (nie jest wymagane do dzialania)
    proposer?: "Student" | "Starosta" | "Lecturer" | "DeanOffice";
};

// -----------------------------
// In-memory store + listeners
// -----------------------------
let isLoaded = false;
let loadedToken: string | null = null;
let exams: ExamEvent[] = [];
const listeners = new Set<() => void>();

let session: SessionPeriod | null = null;
const sessionListeners = new Set<() => void>();

function notify() {
    for (const l of listeners) l();
}

function notifySession() {
    for (const l of sessionListeners) l();
}

const MIN_TIME_MINUTES = 8 * 60;
const MAX_TIME_MINUTES = 20 * 60;
const DEFAULT_TERM_MINUTES = 90;

export function normalizeTimeToSlot(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    const match = /^(\d{1,2}):(\d{2})/.exec(raw.trim());
    if (!match) return undefined;

    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return undefined;

    const total = Math.max(MIN_TIME_MINUTES, Math.min(MAX_TIME_MINUTES, hours * 60 + minutes));
    const rounded = Math.round(total / 15) * 15;
    const clamped = Math.max(MIN_TIME_MINUTES, Math.min(MAX_TIME_MINUTES, rounded));
    const hh = String(Math.floor(clamped / 60)).padStart(2, "0");
    const mm = String(clamped % 60).padStart(2, "0");
    return `${hh}:${mm}`;
}

function toApiTime(raw?: string | null): string | null {
    if (!raw) return null;
    const trimmed = raw.trim();
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(trimmed)) {
        const [h, m, s] = trimmed.split(":");
        return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0")}`;
    }
    const normalized = normalizeTimeToSlot(trimmed);
    return normalized ? `${normalized}:00` : null;
}

function addMinutesToTime(start: string, minutes: number): string {
    const [h, m] = start.split(":").map((v) => Number(v));
    const total = h * 60 + m + minutes;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function getStatusCategory(status: ExamTermStatus): ExamStatus {
    if (status === "Approved" || status === "Finalized") return "Zatwierdzony";
    if (status === "Rejected") return "Odrzucony";
    return "Proponowany";
}

export function getStatusLabel(status: ExamTermStatus): string {
    switch (status) {
        case "ProposedByLecturer":
            return "Proponowany (prowadzacy)";
        case "ProposedByStudent":
            return "Proponowany (starosta)";
        case "Draft":
            return "Szkic";
        case "Conflict":
            return "Konflikt";
        case "Approved":
            return "Zatwierdzony";
        case "Finalized":
            return "Zatwierdzony (finalny)";
        case "Rejected":
            return "Odrzucony";
        default:
            return "Proponowany";
    }
}

export function isApprovedStatus(status: ExamTermStatus): boolean {
    return status === "Approved" || status === "Finalized";
}

export function isStarostaApprovable(status: ExamTermStatus): boolean {
    return status === "ProposedByLecturer";
}

export function isLecturerApprovable(status: ExamTermStatus): boolean {
    return status === "ProposedByStudent";
}

function normalizeTermStatus(raw?: string | null): ExamTermStatus {
    switch (raw) {
        case "Draft":
        case "ProposedByLecturer":
        case "ProposedByStudent":
        case "Conflict":
        case "Approved":
        case "Finalized":
        case "Rejected":
            return raw;
        case "Zatwierdzony":
            return "Approved";
        case "Odrzucony":
            return "Rejected";
        default:
            return "Draft";
    }
}

function normalizeExam(e: ExamEvent): ExamEvent {
    const approvedByStarosta = Boolean(e.approvedByStarosta);
    const approvedByLecturer = Boolean(e.approvedByLecturer);
    const deanApproved = Boolean(e.deanApproved);
    const normalizedTime = normalizeTimeToSlot(e.time);
    const status = normalizeTermStatus(e.status);

    return {
        ...e,
        approvedByStarosta,
        approvedByLecturer,
        deanApproved,
        time: normalizedTime,
        status,
    };
}

function selectActiveSession(sessions: ExamSessionDto[]): SessionPeriod | null {
    if (!sessions || sessions.length === 0) return null;
    const active =
        sessions.filter((s) => s.isActive).sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ??
        sessions[0];
    if (!active) return null;
    return { startISO: active.startDate, endISO: active.endDate };
}

async function loadApiSession(): Promise<void> {
    const sessions = await fetchExamSessions();
    session = selectActiveSession(sessions ?? []);
    notifySession();
}

async function loadApiEvents(token: string): Promise<void> {
    const apiEvents = await fetchExamEvents();
    exams = apiEvents.map((e) => normalizeExam(e));
    loadedToken = token;
    notify();
}

async function refreshApiEvents() {
    const token = loadedToken ?? localStorage.getItem("ues_token");
    if (!token) throw new Error("Brak autoryzacji.");
    await loadApiEvents(token);
    try {
        await loadApiSession();
    } catch {
        session = null;
        notifySession();
    }
    isLoaded = true;
}

// -----------------------------
// Public API (uzywane przez strony)
// -----------------------------

/** Laduje dane egzaminow z backendu. */
export async function ensureExamDataLoaded(): Promise<void> {
    const token = localStorage.getItem("ues_token");
    if (!token) {
        exams = [];
        session = null;
        loadedToken = null;
        isLoaded = false;
        notify();
        notifySession();
        throw new Error("Brak autoryzacji.");
    }

    if (isLoaded && loadedToken === token) return;

    // symulacja opoznienia (zeby UI mialo "Loading" jak w realu)
    await new Promise((r) => setTimeout(r, 120));

    await loadApiEvents(token);
    try {
        await loadApiSession();
    } catch {
        session = null;
        notifySession();
    }

    isLoaded = true;
}

/** Snapshot - nie mutuj tej tablicy w miejscu */
export function getExamDataSnapshot(): ExamEvent[] {
    return exams.slice();
}

type AppRole = "Student" | "Lecturer" | "DeanOffice" | "Admin";
type UserView = {
    username?: string;
    role?: string | number;
    isStarosta?: boolean;
    firstName?: string;
    lastName?: string;
};

function normalizeRole(role: unknown): AppRole | null {
    if (typeof role === "number") {
        return (["Student", "Lecturer", "DeanOffice", "Admin"][role] as AppRole) ?? null;
    }
    if (role === "Student" || role === "Lecturer" || role === "DeanOffice" || role === "Admin") return role;
    return null;
}

function normalizeUsername(username?: string) {
    return String(username ?? "").trim().toLowerCase();
}

export function getVisibleExamEvents(
    all: ExamEvent[],
    user: UserView | null,
    sessionPeriod: SessionPeriod | null = null
): ExamEvent[] {
    const inSession = (dateISO: string) => {
        if (!sessionPeriod) return true;
        return dateISO >= sessionPeriod.startISO && dateISO <= sessionPeriod.endISO;
    };

    const filterBySession = (items: ExamEvent[]) => items.filter((e) => inSession(e.dateISO));

    if (!user) return filterBySession(all.slice());

    const role = normalizeRole(user.role);
    if (!role || role === "DeanOffice" || role === "Admin") return filterBySession(all.slice());

    const username = normalizeUsername(user.username);
    if (!username) return filterBySession(all.slice());

    if (role === "Lecturer") {
        const fullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim().toLowerCase();
        const hasLecturerScope = all.some((e) => e.lecturerUsername || e.lecturer);
        if (!hasLecturerScope) return filterBySession(all.slice());
        return filterBySession(
            all.filter((e) => {
                if (e.lecturerUsername) return normalizeUsername(e.lecturerUsername) === username;
                if (fullName && e.lecturer) return e.lecturer.toLowerCase().includes(fullName);
                return false;
            })
        );
    }

    const hasStudentScope = all.some((e) => Array.isArray(e.studentUsernames) && e.studentUsernames.length > 0);
    if (!hasStudentScope) return filterBySession(all.slice());

    return filterBySession(
        all.filter((e) => {
            if (!e.studentUsernames || e.studentUsernames.length === 0) return false;
            return e.studentUsernames.map(normalizeUsername).includes(username);
        })
    );
}

/** Alias dla starych importow */
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

/** Dodanie propozycji terminu (starosta/Prowadzacy) */
export async function proposeExamTerm(input: ProposeExamTermInput): Promise<void> {
    const courseId = input.courseId;
    const sessionId = input.sessionId;
    const startTime = toApiTime(input.startTime ?? input.time);
    if (!courseId || !sessionId || !startTime) {
        throw new Error("Brak wymaganych danych do utworzenia terminu.");
    }

    const startSlot = startTime.slice(0, 5);
    const endTime = toApiTime(input.endTime ?? addMinutesToTime(startSlot, DEFAULT_TERM_MINUTES));
    if (!endTime) {
        throw new Error("Brak godziny zakonczenia.");
    }

    await createExamTerm({
        courseId,
        sessionId,
        roomId: input.roomId ?? null,
        date: input.dateISO,
        startTime,
        endTime,
        type: input.termType ?? "FirstAttempt",
    });

    await refreshApiEvents();
}

/** Starosta akceptuje propozycje */
export async function approveByStarosta(id: string): Promise<void> {
    await approveExamTermByStarosta(id);
    await refreshApiEvents();
}

/** Prowadzacy akceptuje propozycje */
export async function approveByLecturer(id: string): Promise<void> {
    await approveExamTermByLecturer(id);
    await refreshApiEvents();
}

export async function rejectByLecturer(id: string): Promise<void> {
    await rejectExamTermByLecturer(id);
    await refreshApiEvents();
}

/** Dziekanat finalnie zatwierdza (wtedy status zawsze Zatwierdzony) */
export async function deanFinalApprove(id: string): Promise<void> {
    await finalApproveExamTerm(id);
    await refreshApiEvents();
}

/** Dziekanat finalnie odrzuca */
export async function deanFinalReject(id: string): Promise<void> {
    await finalRejectExamTerm(id);
    await refreshApiEvents();
}

export async function starostaReject(id: string): Promise<void> {
    await rejectExamTermByStarosta(id);
    await refreshApiEvents();
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
        "Prowadzacy",
        "Data",
        "Godzina",
        "Sala",
        "Status",
        "StarostaOK",
        "ProwadzacyOK",
        "DziekanatOK",
    ];

    const escape = (value: string) => {
        const s = String(value ?? "");
        if (/[\",\\n\\r]/.test(s)) {
            return `"${s.replace(/\"/g, "\"\"")}"`;
        }
        return s;
    };

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
            getStatusLabel(e.status),
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

export const starostaApprove = approveByStarosta;
export const lecturerApprove = approveByLecturer;
export const lecturerReject = rejectByLecturer;
export const deanApprove = deanFinalApprove;
export const deanReject = deanFinalReject;
export const starostaRejectAction = starostaReject;
