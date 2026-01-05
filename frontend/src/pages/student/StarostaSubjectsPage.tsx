import { useEffect, useMemo, useState } from "react";
import { Check, X, Filter } from "lucide-react";
import {
    ensureExamDataLoaded,
    getExamDataSnapshot,
    subscribeExamData,
    type ExamStatus, type ExamEvent, starostaApprove,
} from "./studentExamData";

type Row = {
    id: string;
    subject: string;
    fieldOfStudy: string;
    studyType: string;
    year: string;
    lecturer: string;
    date: string; // dd.MM.yyyy
    time: string;
    room: string;
    status: ExamStatus;
};

function formatDatePLFromISO(iso: string) {
    const d = new Date(iso + "T00:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

function StatusBadge({ status }: { status: ExamStatus }) {
    if (status === "Zatwierdzony") {
        return (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
        ✓ Zatwierdzony
      </span>
        );
    }
    if (status === "Częściowo zatwierdzony") {
        return (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
        ⟳ Częściowo zatwierdzony
      </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
      ⏱ Proponowany
    </span>
    );
}

type Toast = { type: "success" | "error"; message: string } | null;

function ToastView({ toast }: { toast: Toast }) {
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
        {toast.type === "success" ? "✓" : "!"}
      </span>
            <div className="font-medium">{toast.message}</div>
        </div>
    );
}

export default function StarostaSubjectsPage() {
    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const [toast, setToast] = useState<Toast>(null);

    // filtry
    const [field, setField] = useState("Wszystkie");
    const [studyType, setStudyType] = useState("Wszystkie");
    const [year, setYear] = useState("Wszystkie");
    const [status, setStatus] = useState<"Wszystkie" | ExamStatus>("Wszystkie");

    // load + subscribe do wspólnego store
    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            await ensureExamDataLoaded();
            if (!alive) return;
            setEvents(getExamDataSnapshot());
            setLoading(false);
        })();

        const unsub = subscribeExamData(() => {
            setEvents(getExamDataSnapshot());
        });

        return () => {
            alive = false;
            unsub();
        };
    }, []);

    function showToast(t: Toast) {
        setToast(t);
        window.setTimeout(() => setToast(null), 2500);
    }

    const rows: Row[] = useMemo(() => {
        return events
            .map((e) => ({
                id: e.id,
                subject: e.title,
                fieldOfStudy: e.fieldOfStudy ?? "—",
                studyType: e.studyType ?? "—",
                year: e.year ?? "—",
                lecturer: e.lecturer ?? "—",
                date: formatDatePLFromISO(e.dateISO),
                time: e.time ?? "—",
                room: e.room ?? "—",
                status: e.status,
            }))
            .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    }, [events]);

    const options = useMemo(() => {
        const fields = Array.from(new Set(rows.map((r) => r.fieldOfStudy).filter((x) => x !== "—")));
        const types = Array.from(new Set(rows.map((r) => r.studyType).filter((x) => x !== "—")));
        const years = Array.from(new Set(rows.map((r) => r.year).filter((x) => x !== "—")));
        return { fields, types, years };
    }, [rows]);

    const filtered = useMemo(() => {
        let r = rows;

        if (field !== "Wszystkie") r = r.filter((x) => x.fieldOfStudy === field);
        if (studyType !== "Wszystkie") r = r.filter((x) => x.studyType === studyType);
        if (year !== "Wszystkie") r = r.filter((x) => x.year === year);
        if (status !== "Wszystkie") r = r.filter((x) => x.status === status);

        return r;
    }, [rows, field, studyType, year, status]);

    return (
        <div className="space-y-6">
            <ToastView toast={toast} />

            <div className="text-slate-900 font-semibold text-xl">Lista przedmiotów</div>

            {/* Filtry */}
            <div className="bg-white border rounded-2xl p-6">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Filter className="w-4 h-4" />
                    Filtry
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <div className="text-sm text-slate-600 mb-1">Kierunek</div>
                        <select className="w-full h-10 border rounded-lg px-3 bg-white" value={field} onChange={(e) => setField(e.target.value)}>
                            <option>Wszystkie</option>
                            {options.fields.map((x) => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="text-sm text-slate-600 mb-1">Typ studiów</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={studyType}
                            onChange={(e) => setStudyType(e.target.value)}
                        >
                            <option>Wszystkie</option>
                            {options.types.map((x) => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="text-sm text-slate-600 mb-1">Rok</div>
                        <select className="w-full h-10 border rounded-lg px-3 bg-white" value={year} onChange={(e) => setYear(e.target.value)}>
                            <option>Wszystkie</option>
                            {options.years.map((x) => (
                                <option key={x}>{x}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <div className="text-sm text-slate-600 mb-1">Status</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as any)}
                        >
                            <option>Wszystkie</option>
                            <option>Zatwierdzony</option>
                            <option>Częściowo zatwierdzony</option>
                            <option>Proponowany</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabela */}
            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b text-sm text-slate-600">{loading ? "Ładowanie..." : `Wyniki: ${filtered.length}`}</div>

                <div className="overflow-x-auto">
                    <table className="min-w-[1120px] w-full">
                        <thead className="bg-neutral-50 border-b">
                        <tr className="text-left text-sm text-slate-600">
                            <th className="px-6 py-3 font-medium">Przedmiot</th>
                            <th className="px-6 py-3 font-medium">Kierunek</th>
                            <th className="px-6 py-3 font-medium">Typ</th>
                            <th className="px-6 py-3 font-medium">Rok</th>
                            <th className="px-6 py-3 font-medium">Prowadzący</th>
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
                                <td className="px-6 py-6 text-sm text-slate-600" colSpan={10}>
                                    Brak wyników.
                                </td>
                            </tr>
                        )}

                        {filtered.map((r) => (
                            <tr key={r.id} className="border-b last:border-b-0">
                                <td className="px-6 py-4 text-sm text-slate-900">{r.subject}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{r.fieldOfStudy}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{r.studyType}</td>
                                <td className="px-6 py-4 text-sm text-slate-700">{r.year}</td>
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
                                                    showToast({ type: "success", message: "Egzamin został zatwierdzony!" });
                                                }}
                                                className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                                title="Zatwierdź"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    starostaReject(r.id);
                                                    showToast({ type: "error", message: "Propozycja została odrzucona." });
                                                }}
                                                className="p-2 rounded-lg hover:bg-red-50 text-red-600"
                                                title="Odrzuć"
                                            >
                                                <X className="w-5 h-5" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-slate-400">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
