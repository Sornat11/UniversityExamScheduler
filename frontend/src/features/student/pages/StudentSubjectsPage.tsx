import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { getVisibleExamEvents, type ExamStatus } from "../../exams/data/examStore";
import { StatusBadge } from "../../exams/components/StatusBadge";
import { useExamEvents } from "../../exams/hooks/useExamEvents";
import { formatDatePLFromISO } from "../../exams/utils/date";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";

type Row = {
    id: string;
    subject: string;
    lecturer: string;
    date: string; // dd.MM.yyyy
    time: string; // HH:mm
    room: string;
    status: ExamStatus;
};

export default function StudentSubjectsPage() {
    const { user } = useAuth();
    const { events, loading } = useExamEvents();
    const sessionPeriod = useSessionPeriod();

    const [status, setStatus] = useState<"Wszystkie" | ExamStatus>("Wszystkie");
    const fallback = "Brak danych";

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
        <div className="space-y-6">
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
            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="px-6 py-4 border-b text-sm text-slate-600">
                    {loading ? "Ladowanie..." : `Wyniki: ${filtered.length}`}
                </div>

                <div className="hidden xl:block">
                    <table className="w-full">
                        <thead className="bg-neutral-50 border-b">
                            <tr className="text-left text-sm text-slate-600">
                                <th className="px-6 py-3 font-medium">Przedmiot</th>
                                <th className="px-6 py-3 font-medium">Prowadzacy</th>
                                <th className="px-6 py-3 font-medium">Data</th>
                                <th className="px-6 py-3 font-medium">Godzina</th>
                                <th className="px-6 py-3 font-medium">Sala</th>
                                <th className="px-6 py-3 font-medium">Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {!loading && filtered.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-slate-600" colSpan={6}>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="xl:hidden divide-y divide-slate-100">
                    {!loading && filtered.length === 0 && (
                        <div className="p-4 text-sm text-slate-600">Brak wynikow.</div>
                    )}
                    {filtered.map((r) => (
                        <div key={r.id} className="p-4 space-y-2">
                            <div className="flex items-center justify-between gap-3">
                                <div className="text-slate-900 font-semibold">{r.subject}</div>
                                <StatusBadge status={r.status} />
                            </div>
                            <div className="text-sm text-slate-700">{r.lecturer}</div>
                            <div className="text-sm text-slate-700">
                                {r.date} | {r.time || "-"} | {r.room || "-"}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}


