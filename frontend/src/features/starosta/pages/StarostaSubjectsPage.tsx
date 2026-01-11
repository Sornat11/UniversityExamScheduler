import { useMemo, useState } from "react";
import { Check, X, Filter } from "lucide-react";
import { getVisibleExamEvents, type ExamStatus, starostaApprove, starostaReject } from "../../exams/data/examStore";
import { useExamEvents } from "../../exams/hooks/useExamEvents";
import { StatusBadge } from "../../exams/components/StatusBadge";
import { formatDatePLFromISO } from "../../exams/utils/date";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";

type Row = {
    id: string;
    subject: string;
    lecturer: string;
    date: string; // dd.MM.yyyy
    time: string;
    room: string;
    status: ExamStatus;
};

type Toast = { type: "success" | "error"; message: string } | null;

type ToastViewProps = {
    toast: Toast;
};

function ToastView({ toast }: ToastViewProps) {
    if (!toast) return null;

    const base =
        "fixed top-6 right-6 z-50 min-w-[320px] max-w-[520px] px-5 py-3 rounded-2xl border shadow-sm text-sm flex items-center gap-3";
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
    const { user } = useAuth();
    const { events, loading } = useExamEvents();
    const sessionPeriod = useSessionPeriod();

    const [toast, setToast] = useState<Toast>(null);

    // filtry
    const [status, setStatus] = useState<"Wszystkie" | ExamStatus>("Wszystkie");
    const fallback = "Brak danych";

    function showToast(t: Toast) {
        setToast(t);
        window.setTimeout(() => setToast(null), 2500);
    }

    const visibleEvents = useMemo(
        () => getVisibleExamEvents(events, user, sessionPeriod),
        [events, user, sessionPeriod]
    );

    const rows: Row[] = useMemo(() => {
        return visibleEvents
            .map((e) => ({
                id: e.id,
                subject: e.title,
                lecturer: e.lecturer ?? fallback,
                date: formatDatePLFromISO(e.dateISO),
                time: e.time ?? fallback,
                room: e.room ?? fallback,
                status: e.status,
            }))
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    }, [visibleEvents]);

    const filtered = useMemo(() => {
        let r = rows;
        if (status !== "Wszystkie") r = r.filter((x) => x.status === status);
        return r;
    }, [rows, status]);

    return (
        <div className="space-y-6 max-w-6xl mx-auto px-4">
            <ToastView toast={toast} />

            {/* Filtry */}
            <div className="bg-white border rounded-2xl p-6">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Filter className="w-4 h-4" />
                    Filtry
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mt-4">
                    <div>
                        <div className="text-sm text-slate-600 mb-1">Status</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as ExamStatus | "Wszystkie")}
                        >
                            <option>Wszystkie</option>
                            <option>Zatwierdzony</option>
                            <option>Czesciowo zatwierdzony</option>
                            <option>Proponowany</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b text-sm text-slate-600">
                    {loading ? "Ladowanie..." : `Wyniki: ${filtered.length}`}
                </div>

                <div className="hidden md:block">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b">
                            <tr className="text-left text-sm text-slate-600">
                                <th className="px-6 py-3 font-medium">Przedmiot</th>
                                <th className="px-6 py-3 font-medium">Prowadzacy</th>
                                <th className="px-6 py-3 font-medium">Data</th>
                                <th className="px-6 py-3 font-medium">Godzina</th>
                                <th className="px-6 py-3 font-medium">Sala</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                                <th className="px-6 py-3 font-medium text-right">Akcje</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-slate-600" colSpan={7}>
                                        Brak wynikow.
                                    </td>
                                </tr>
                            )}

                            {filtered.map((r) => (
                                <tr key={r.id} className="border-b last:border-b-0">
                                    <td className="px-6 py-4 text-sm text-slate-900">{r.subject}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.lecturer}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.date}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.time}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.room}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={r.status} />
                                    </td>

                                    {/* Akcje jak na screenie: tylko dla "Proponowany" */}
                                    <td className="px-6 py-4 text-right">
                                        {r.status === "Proponowany" ? (
                                            <div className="inline-flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        starostaApprove(r.id);
                                                        showToast({ type: "success", message: "Egzamin zostal zatwierdzony!" });
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                                    title="Zatwierdz"
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        starostaReject(r.id);
                                                        showToast({ type: "error", message: "Propozycja zostala odrzucona." });
                                                    }}
                                                    className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                                                    title="Odrzuc"
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-slate-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="md:hidden divide-y divide-slate-100">
                    {filtered.length === 0 && (
                        <div className="p-4 text-sm text-slate-600">Brak wynikow.</div>
                    )}
                    {filtered.map((r) => (
                        <div key={r.id} className="p-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <div className="text-slate-900 font-semibold">{r.subject}</div>
                                <StatusBadge status={r.status} />
                            </div>
                            <div className="text-sm text-slate-700">{r.lecturer}</div>
                            <div className="text-sm text-slate-700">{r.date} · {r.time || "-"} · {r.room || "-"}</div>
                            {r.status === "Proponowany" && (
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            starostaApprove(r.id);
                                            showToast({ type: "success", message: "Egzamin zostal zatwierdzony!" });
                                        }}
                                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold"
                                    >
                                        Zatwierdz
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            starostaReject(r.id);
                                            showToast({ type: "error", message: "Propozycja zostala odrzucona." });
                                        }}
                                        className="px-3 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold"
                                    >
                                        Odrzuc
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


