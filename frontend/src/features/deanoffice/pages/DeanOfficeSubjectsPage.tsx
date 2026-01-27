import { useEffect, useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { StatusBadge } from "../../exams/components/StatusBadge";
import { formatDatePLFromISO } from "../../exams/utils/date";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";
import { useAuth } from "../../auth/hooks/useAuth";
import { usePagedExamEvents } from "../../exams/hooks/usePagedExamEvents";
import type { ExamEventDto, ExamTermType } from "../../../api/exams";
import type { ExamTermStatus } from "../../exams/data/examStore";

export default function DeanOfficeSubjectsPage() {
    useAuth();
    const sessionPeriod = useSessionPeriod();

    const [status, setStatus] = useState("");
    const [termType, setTermType] = useState("");
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const pageSize = 15;

    const statusFilter = status ? (status as ExamTermStatus) : undefined;
    const typeFilter = termType ? (termType as ExamTermType) : undefined;

    const { data, loading, error } = usePagedExamEvents({
        search: query.trim() || undefined,
        status: statusFilter,
        type: typeFilter,
        dateFrom: sessionPeriod?.startISO,
        dateTo: sessionPeriod?.endISO,
        page,
        pageSize,
    });

    useEffect(() => {
        setPage(1);
    }, [query, status, termType]);

    const rows = useMemo(() => {
        const items = data?.items ?? [];
        return items.map((e: ExamEventDto) => ({
            ...e,
            fieldOfStudy: e.fieldOfStudy ?? "Brak danych",
            studyType: e.studyType ?? "Brak danych",
            year: e.year ?? "Brak danych",
            lecturer: e.lecturer ?? "Brak danych",
            startTime: e.time ?? "-",
            endTime: e.endTime ?? "-",
            room: e.room ?? "-",
            datePL: formatDatePLFromISO(e.dateISO),
        }));
    }, [data]);

    const totalPages = data ? Math.max(1, Math.ceil(data.totalCount / data.pageSize)) : 1;

    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6">
                <div className="flex items-center gap-2 text-slate-800 font-medium">
                    <Filter className="w-4 h-4" /> Filtry
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                        <div className="text-sm text-slate-600 mb-1">Szukaj</div>
                        <input
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            placeholder="Przedmiot, kierunek, prowadzacy, sala"
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

                    <div>
                        <div className="text-sm text-slate-600 mb-1">Typ terminu</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={termType}
                            onChange={(e) => setTermType(e.target.value)}
                        >
                            <option value="">Wszystkie</option>
                            <option value="FirstAttempt">1 termin</option>
                            <option value="Retake">Poprawka</option>
                            <option value="Commission">Komisja</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b bg-slate-50/80">
                    <span className="inline-flex items-center rounded-full border bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                        {loading ? "Ladowanie..." : `Wyniki: ${data?.totalCount ?? 0}`}
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
                                <th className="px-6 py-3 font-semibold whitespace-nowrap">Start</th>
                                <th className="px-6 py-3 font-semibold whitespace-nowrap">Koniec</th>
                                <th className="px-6 py-3 font-semibold whitespace-nowrap">Sala</th>
                                <th className="px-6 py-3 font-semibold">Status</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                            {!loading && rows.length === 0 && (
                                <tr>
                                    <td className="px-6 py-6 text-sm text-slate-600" colSpan={10}>
                                        Brak wynikow.
                                    </td>
                                </tr>
                            )}

                            {rows.map((r) => (
                                <tr key={r.id} className="transition-colors hover:bg-slate-50/70">
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{r.title}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.fieldOfStudy}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.studyType}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.year}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700">{r.lecturer}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.datePL}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.startTime}</td>
                                    <td className="px-6 py-4 text-sm text-slate-700 whitespace-nowrap">{r.endTime}</td>
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
