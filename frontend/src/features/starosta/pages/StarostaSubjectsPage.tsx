import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Check, Filter, Pencil, Trash2, X } from "lucide-react";
import {
    deleteProposalByStarosta,
    editApprovedByStarosta,
    isEditableApprovedStatus,
    isStarostaApprovable,
    isStarostaDeletable,
    starostaApprove,
    starostaReject,
    type ExamTermStatus,
} from "../../exams/data/examStore";
import { StatusBadge } from "../../exams/components/StatusBadge";
import { formatDatePLFromISO } from "../../exams/utils/date";
import { formatTimeRange } from "../../exams/utils/time";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";
import { getApiErrorMessage } from "../../../shared/utils/apiErrors";
import { EditApprovedTermModal } from "../../exams/components/EditApprovedTermModal";
import { fetchExamSessions, fetchRooms, type ExamSessionDto, type RoomDto } from "../../../api/admin";
import { usePagedExamEvents } from "../../exams/hooks/usePagedExamEvents";
import type { ExamEventDto } from "../../../api/exams";

type Row = {
    id: string;
    subject: string;
    lecturer: string;
    date: string; // dd.MM.yyyy
    startTime: string;
    endTime: string;
    timeRange: string;
    room: string;
    status: ExamTermStatus;
    event: ExamEventDto;
};

type Toast = { type: "success" | "error"; message: string } | null;

type ToastViewProps = {
    toast: Toast;
};

function ToastView({ toast }: ToastViewProps) {
    if (!toast) return null;

    const base =
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[320px] max-w-[520px] px-5 py-3 rounded-2xl border shadow-sm text-sm flex items-center gap-3";
    const cls =
        toast.type === "success"
            ? `${base} bg-emerald-50 border-emerald-200 text-emerald-800`
            : `${base} bg-red-50 border-red-200 text-red-800`;

    return (
        <div className={cls}>
            <span className="inline-flex w-6 h-6 items-center justify-center rounded-full bg-white border">
                {toast.type === "success" ? "OK" : "!"}
            </span>
            <div className="font-medium">{toast.message}</div>
        </div>
    );
}

export default function StarostaSubjectsPage() {
    useAuth();
    const sessionPeriod = useSessionPeriod();
    const nav = useNavigate();
    const location = useLocation();

    const [toast, setToast] = useState<Toast>(null);
    const [editing, setEditing] = useState<ExamEventDto | null>(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [sessions, setSessions] = useState<ExamSessionDto[]>([]);

    const [status, setStatus] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 10;
    const fallback = "Brak danych";

    const statusFilter = status ? (status as ExamTermStatus) : undefined;
    const { data, loading, error, refresh } = usePagedExamEvents({
        search: query.trim() || undefined,
        status: statusFilter,
        dateFrom: sessionPeriod?.startISO,
        dateTo: sessionPeriod?.endISO,
        page,
        pageSize,
    });

    const showToast = useCallback((t: Toast) => {
        setToast(t);
        window.setTimeout(() => setToast(null), 2500);
    }, []);

    useEffect(() => {
        const state = location.state as { toast?: Toast } | null;
        if (state?.toast) {
            showToast(state.toast);
            nav(location.pathname, { replace: true, state: {} });
        }
    }, [location.pathname, location.state, nav, showToast]);

    useEffect(() => {
        let active = true;

        const loadRooms = async () => {
            try {
                const res = await fetchRooms();
                if (!active) return;
                setRooms(res ?? []);
            } catch {
                if (!active) return;
                setRooms([]);
            }
        };

        const loadSessions = async () => {
            try {
                const res = await fetchExamSessions();
                if (!active) return;
                setSessions(res ?? []);
            } catch {
                if (!active) return;
                setSessions([]);
            }
        };

        loadRooms();
        loadSessions();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        setPage(1);
    }, [query, status]);

    async function handleApprove(id: string) {
        try {
            await starostaApprove(id);
            showToast({ type: "success", message: "Egzamin zostal zatwierdzony!" });
            refresh();
        } catch (e: unknown) {
            const message = getApiErrorMessage(e, "Nie udalo sie zatwierdzic egzaminu.");
            showToast({ type: "error", message });
        }
    }

    async function handleReject(id: string) {
        try {
            await starostaReject(id);
            showToast({ type: "success", message: "Propozycja zostala odrzucona." });
            refresh();
        } catch (e: unknown) {
            const message = getApiErrorMessage(e, "Nie udalo sie odrzucic propozycji.");
            showToast({ type: "error", message });
        }
    }

    async function handleDelete(id: string) {
        try {
            await deleteProposalByStarosta(id);
            showToast({ type: "success", message: "Propozycja zostala usunieta." });
            refresh();
        } catch (e: unknown) {
            const message = getApiErrorMessage(e, "Nie udalo sie usunac propozycji.");
            showToast({ type: "error", message });
        }
    }

    async function handleEditSave(payload: Parameters<typeof editApprovedByStarosta>[1]) {
        if (!editing) return;
        setSavingEdit(true);
        try {
            await editApprovedByStarosta(editing.id, payload);
            showToast({ type: "success", message: "Zmieniono termin. Oczekuje na akceptacje drugiej strony." });
            setEditing(null);
            refresh();
        } catch (e: unknown) {
            const message = getApiErrorMessage(e, "Nie udalo sie zapisac zmian.");
            showToast({ type: "error", message });
        } finally {
            setSavingEdit(false);
        }
    }

    const events = data?.items ?? [];
    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

    const rows: Row[] = useMemo(() => {
        return events
            .map((e) => ({
                id: e.id,
                subject: e.title,
                lecturer: e.lecturer ?? fallback,
                date: formatDatePLFromISO(e.dateISO),
                startTime: e.time ?? fallback,
                endTime: e.endTime ?? fallback,
                timeRange: formatTimeRange(e.time, e.endTime, fallback),
                room: e.room ?? fallback,
                status: e.status,
                event: e,
            }))
            .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    }, [events, fallback]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4">
            <ToastView toast={toast} />
            {editing && (
                <EditApprovedTermModal
                    event={editing}
                    rooms={rooms}
                    sessions={sessions}
                    saving={savingEdit}
                    onClose={() => setEditing(null)}
                    onSave={handleEditSave}
                />
            )}

            <div className="bg-white border rounded-2xl p-6">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Filter className="w-4 h-4" />
                    Filtry
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <div className="text-sm text-slate-600 mb-1">Szukaj</div>
                        <input
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            placeholder="Przedmiot, sala, prowadzacy, kierunek"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    <div>
                        <div className="text-sm text-slate-600 mb-1">Status (backend)</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            <option value="">Wszystkie</option>
                            <option value="ProposedByLecturer">Proponowany (prowadzacy)</option>
                            <option value="ProposedByStudent">Proponowany (starosta)</option>
                            <option value="Draft">Wersja robocza</option>
                            <option value="Approved">Zatwierdzony</option>
                            <option value="Finalized">Zatwierdzony (finalny)</option>
                            <option value="Rejected">Odrzucony</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b text-sm text-slate-600">
                    {loading ? "Ladowanie..." : `Wyniki: ${data?.totalCount ?? 0}`}
                </div>

                <div className="hidden md:block">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b">
                            <tr className="text-left text-sm text-slate-600">
                                <th className="px-6 py-3 font-medium">Przedmiot</th>
                                <th className="px-6 py-3 font-medium">Prowadzacy</th>
                                <th className="px-6 py-3 font-medium">Data</th>
                                <th className="px-6 py-3 font-medium">Start</th>
                                <th className="px-6 py-3 font-medium">Koniec</th>
                                <th className="px-6 py-3 font-medium">Sala</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Akcje</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-slate-600" colSpan={8}>
                                        Brak wynikow.
                                    </td>
                                </tr>
                            )}

                            {rows.map((r) => (
                                <tr key={r.id} className="border-b last:border-b-0">
                                    <td className="px-6 py-4 text-sm text-slate-900">{r.subject}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.lecturer}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.date}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.startTime}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.endTime}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.room}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={r.status} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {isStarostaApprovable(r.status) && (
                                            <div className="inline-flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void handleApprove(r.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                                    title="Zatwierdz"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void handleReject(r.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                                                    title="Odrzuc"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        {isStarostaDeletable(r.status) && (
                                            <div className="inline-flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        void handleDelete(r.id);
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                                                    title="Usun propozycje"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        {isEditableApprovedStatus(r.status) && (
                                            <div className="inline-flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing(r.event)}
                                                    className="p-2 rounded-lg hover:bg-sky-50 text-sky-600"
                                                    title="Edytuj termin"
                                                >
                                                    <Pencil className="w-5 h-5" />
                                                </button>
                                            </div>
                                        )}
                                        {!isStarostaApprovable(r.status) &&
                                            !isStarostaDeletable(r.status) &&
                                            !isEditableApprovedStatus(r.status) && (
                                                <span className="text-sm text-slate-400">-</span>
                                            )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
                    {!loading && rows.length === 0 && (
                        <div className="p-4 text-sm text-slate-600">Brak wynikow.</div>
                    )}

                    {rows.map((r) => (
                        <div key={r.id} className="p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="text-slate-900 font-semibold">{r.subject}</div>
                                <StatusBadge status={r.status} />
                            </div>
                            <div className="text-sm text-slate-700">{r.lecturer}</div>
                            <div className="text-sm text-slate-700">{r.date} | {r.timeRange} | {r.room || "-"}</div>
                            {isStarostaApprovable(r.status) && (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleApprove(r.id);
                                        }}
                                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                                    >
                                        Zatwierdz
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void handleReject(r.id);
                                        }}
                                        className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold"
                                    >
                                        Odrzuc
                                    </button>
                                </div>
                            )}
                            {isStarostaDeletable(r.status) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        void handleDelete(r.id);
                                    }}
                                    className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold"
                                >
                                    Usun
                                </button>
                            )}
                            {isEditableApprovedStatus(r.status) && (
                                <button
                                    type="button"
                                    onClick={() => setEditing(r.event)}
                                    className="px-3 py-2 rounded-lg bg-sky-600 text-white text-sm font-semibold"
                                >
                                    Edytuj
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600">
                <div>
                    Strona {data?.page ?? page} / {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="px-3 py-2 border rounded-lg disabled:opacity-50"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                        Poprzednia
                    </button>
                    <button
                        type="button"
                        className="px-3 py-2 border rounded-lg disabled:opacity-50"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        Nastepna
                    </button>
                </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}
        </div>
    );
}
