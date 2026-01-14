import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { getStatusCategory, getVisibleExamEvents, type ExamStatus } from "../../exams/data/examStore";
import { useExamEvents } from "../../exams/hooks/useExamEvents";
import { StatusBadge } from "../../exams/components/StatusBadge";
import { formatDatePLFromISO } from "../../exams/utils/date";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";
import { useAuth } from "../../auth/hooks/useAuth";

export default function DeanOfficeSubjectsPage() {
    const { user } = useAuth();
    const { events, loading } = useExamEvents();
    const sessionPeriod = useSessionPeriod();

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
        }));
    }, [visibleEvents]);

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
        if (status !== "Wszystkie") r = r.filter((x) => getStatusCategory(x.status) === status);
        return r;
    }, [rows, field, studyType, year, status]);

    return (
        <div className="space-y-6">
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
                            <option>Proponowany</option>
                            <option>Odrzucony</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-slate-50/80">
                    <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {loading ? "Ladowanie..." : `Wyniki: ${filtered.length}`}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                        <thead className="bg-slate-50/80 border-b">
                            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                <th className="px-6 py-3 font-semibold">Przedmiot</th>
                                <th className="px-6 py-3 font-semibold">Kierunek</th>
                                <th className="px-6 py-3 font-semibold">Typ</th>
                                <th className="px-6 py-3 font-semibold">Rok</th>
                                <th className="px-6 py-3 font-semibold">Prowadzacy</th>
                                <th className="px-6 py-3 font-semibold whitespace-nowrap">Data</th>
                                <th className="px-6 py-3 font-semibold whitespace-nowrap">Godzina</th>
                                <th className="px-6 py-3 font-semibold whitespace-nowrap">Sala</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-slate-600" colSpan={9}>
                                        Brak wynikow.
                                    </td>
                                </tr>
                            )}

                            {filtered.map((r) => (
                                <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.title}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.fieldOfStudy}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.studyType}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.year}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.lecturer}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.datePL}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.time}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.room}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={r.status} />
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



