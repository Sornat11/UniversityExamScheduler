import { useEffect, useMemo, useState } from "react";
import { Filter, Check, X } from "lucide-react";
import { getVisibleExamEvents, type ExamStatus, deanFinalApprove, deanFinalReject } from "../../exams/data/examStore";
import { useExamEvents } from "../../exams/hooks/useExamEvents";
import { StatusBadge } from "../../exams/components/StatusBadge";
import { formatDatePLFromISO } from "../../exams/utils/date";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";
import { useAuth } from "../../auth/hooks/useAuth";

export default function DeanOfficeSubjectsPage() {
    const { user } = useAuth();
    const { events, loading } = useExamEvents();
    const sessionPeriod = useSessionPeriod();

    const [toast, setToast] = useState<string | null>(null);
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    const [field, setField] = useState("Wszystkie");
    const [studyType, setStudyType] = useState("Wszystkie");
    const [year, setYear] = useState("Wszystkie");
    const [status, setStatus] = useState<"Wszystkie" | ExamStatus>("Wszystkie");
    const fallback = "Brak danych";
    const normalize = (v: string) => v.trim().toLowerCase();

    const visibleEvents = useMemo(
        () => getVisibleExamEvents(events, user, sessionPeriod),
        [events, user, sessionPeriod]
    );

    const rows = useMemo(() => {
        return visibleEvents.map((e) => ({
            ...e,
            fieldOfStudy: e.fieldOfStudy ?? fallback,
            studyType: e.studyType ?? fallback,
            year: e.year ?? fallback,
            lecturer: e.lecturer ?? fallback,
            time: e.time ?? fallback,
            room: e.room ?? fallback,
            datePL: formatDatePLFromISO(e.dateISO),
            // dziekanat ma akcje tylko dla terminow oczekujacych finalnej decyzji
            canFinalAction: e.status === "Czesciowo zatwierdzony",
        }));
    }, [visibleEvents]);

    async function handleFinalApprove(id: string) {
        try {
            await deanFinalApprove(id);
            setToast("Egzamin zostal zatwierdzony!");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Nie udalo sie zatwierdzic egzaminu.";
            setToast(message);
        }
    }

    async function handleFinalReject(id: string) {
        try {
            await deanFinalReject(id);
            setToast("Egzamin zostal odrzucony!");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Nie udalo sie odrzucic egzaminu.";
            setToast(message);
        }
    }

    const options = useMemo(() => {
        const fields = Array.from(new Set(rows.map((r) => r.fieldOfStudy).filter((x) => x !== fallback)));
        const types = Array.from(new Set(rows.map((r) => r.studyType).filter((x) => x !== fallback)));
        const years = Array.from(new Set(rows.map((r) => r.year).filter((x) => x !== fallback)));
        return { fields, types, years };
    }, [rows]);

    const filtered = useMemo(() => {
        let r = rows;
        if (field !== "Wszystkie") r = r.filter((x) => normalize(x.fieldOfStudy) === normalize(field));
        if (studyType !== "Wszystkie") r = r.filter((x) => normalize(x.studyType) === normalize(studyType));
        if (year !== "Wszystkie") r = r.filter((x) => normalize(x.year) === normalize(year));
        if (status !== "Wszystkie") r = r.filter((x) => x.status === status);
        return r;
    }, [rows, field, studyType, year, status]);

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 shadow">
                    OK {toast}
                </div>
            )}

            <div className="bg-white border rounded-2xl p-6">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Filter className="w-4 h-4" /> Filtry
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
                        <div className="text-sm text-slate-600 mb-1">Typ studiow</div>
                        <select className="w-full h-10 border rounded-lg px-3 bg-white" value={studyType} onChange={(e) => setStudyType(e.target.value)}>
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

            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b text-sm text-slate-600">
                    {loading ? "Ladowanie..." : `Wyniki: ${filtered.length}`}
                </div>

                <div>
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b">
                            <tr className="text-left text-sm text-slate-600">
                                <th className="px-6 py-3 font-medium">Przedmiot</th>
                                <th className="px-6 py-3 font-medium">Kierunek</th>
                                <th className="px-6 py-3 font-medium">Typ</th>
                                <th className="px-6 py-3 font-medium">Rok</th>
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
                                    <td className="px-6 py-6 text-sm text-slate-600" colSpan={10}>
                                        Brak wynikow.
                                    </td>
                                </tr>
                            )}

                            {filtered.map((r) => (
                                <tr key={r.id} className="border-b last:border-b-0">
                                    <td className="px-6 py-4 text-sm text-slate-900">{r.title}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.fieldOfStudy}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.studyType}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.year}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.lecturer}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.datePL}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.time}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.room}</td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={r.status} />
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        {r.canFinalAction ? (
                                            <div className="inline-flex items-center gap-3">
                                                <button
                                                    type="button"
                                                    className="text-emerald-600 hover:text-emerald-700"
                                                    title="Zatwierdz"
                                                    onClick={() => {
                                                        void handleFinalApprove(r.id);
                                                    }}
                                                >
                                                    <Check className="w-5 h-5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-red-500 hover:text-red-600"
                                                    title="Odrzuc"
                                                    onClick={() => {
                                                        void handleFinalReject(r.id);
                                                    }}
                                                >
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-slate-300">-</span>
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



