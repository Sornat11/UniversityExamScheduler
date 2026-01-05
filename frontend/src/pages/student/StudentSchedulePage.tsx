import { useEffect, useMemo, useState } from "react";
import { Download, ChevronLeft, ChevronRight } from "lucide-react";
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    isSameMonth,
    isToday,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import {type ExamEvent, type ExamStatus, getStudentExamData} from "./studentExamData";

function statusDot(status: ExamStatus) {
    if (status === "Proponowany") return "bg-yellow-200 border-yellow-300";
    if (status === "Częściowo zatwierdzony") return "bg-blue-200 border-blue-300";
    return "bg-emerald-200 border-emerald-300";
}

function LegendItem({ label, dotClass }: Readonly<{ label: string; dotClass: string }>) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className={`w-3 h-3 rounded border ${dotClass}`} />
            {label}
        </div>
    );
}

export default function StudentSchedulePage() {
    const [mode, setMode] = useState<"month" | "week">("month");
    const [cursor, setCursor] = useState(() => new Date());

    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ✅ Jedno źródło danych (mock / backend zależnie od studentExamData.ts)
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = getStudentExamData();
                if (!alive) return;
                setEvents(data);
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "Błąd pobierania danych");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, ExamEvent[]>();
        for (const e of events) {
            const arr = map.get(e.dateISO) ?? [];
            arr.push(e);
            map.set(e.dateISO, arr);
        }
        return map;
    }, [events]);

    const monthLabel = format(cursor, "LLLL yyyy", { locale: pl });

    const monthGrid = useMemo(() => {
        const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
        const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });

        const days: Date[] = [];
        let d = start;
        while (d <= end) {
            days.push(d);
            d = addDays(d, 1);
        }
        return days;
    }, [cursor]);

    const weekGrid = useMemo(() => {
        const start = startOfWeek(cursor, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(start, i));
    }, [cursor]);

    const exportData = () => {
        const csv = ["date,title,status"]
            .concat(events.map((e) => `${e.dateISO},"${String(e.title).replaceAll('"', '""')}",${e.status}`))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "egzaminy.csv";
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-5">
            {/* Pasek góra: miesiąc + tryb + eksport */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center"
                        onClick={() => setCursor((d) => (mode === "month" ? subMonths(d, 1) : addDays(d, -7)))}
                        type="button"
                        title="Poprzedni"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-700" />
                    </button>

                    <div className="min-w-40 text-center font-medium text-slate-800">
                        {mode === "month" ? monthLabel : format(cursor, "d LLLL yyyy", { locale: pl })}
                    </div>

                    <button
                        className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center"
                        onClick={() => setCursor((d) => (mode === "month" ? addMonths(d, 1) : addDays(d, 7)))}
                        type="button"
                        title="Następny"
                    >
                        <ChevronRight className="w-5 h-5 text-slate-700" />
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="inline-flex rounded-xl border bg-white p-1">
                        <button
                            type="button"
                            onClick={() => setMode("month")}
                            className={`px-4 py-2 rounded-lg text-sm transition ${
                                mode === "month" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-700"
                            }`}
                        >
                            Miesiąc
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("week")}
                            className={`px-4 py-2 rounded-lg text-sm transition ${
                                mode === "week" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-700"
                            }`}
                        >
                            Tydzień
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={exportData}
                        className="
  inline-flex items-center gap-2
  rounded-xl px-5 py-2.5 text-base font-semibold
  bg-white text-emerald-700
  border-2 border-emerald-600
  shadow-sm
  hover:bg-emerald-50
  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
  transition
"
                    >
                        <Download className="w-4 h-4" />
                        Eksportuj
                    </button>


                </div>
            </div>

            {(loading || error) && (
                <div className="bg-white border rounded-2xl p-4 text-sm">
                    {loading && <div className="text-slate-600">Ładowanie…</div>}
                    {error && <div className="text-red-600">Błąd: {error}</div>}
                </div>
            )}

            {/* Legenda */}
            <div className="bg-white border rounded-2xl p-4">
                <div className="flex items-center gap-4">
                    <div className="text-sm text-slate-600">Legenda:</div>
                    <LegendItem label="Proponowany" dotClass="bg-yellow-200 border-yellow-300" />
                    <LegendItem label="Częściowo zatwierdzony" dotClass="bg-blue-200 border-blue-300" />
                    <LegendItem label="Zatwierdzony" dotClass="bg-emerald-200 border-emerald-300" />
                </div>
            </div>

            {/* Kalendarz */}
            <div className="bg-white border rounded-2xl overflow-hidden">
                <div className="grid grid-cols-7 border-b">
                    {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nie"].map((d) => (
                        <div key={d} className="py-3 text-center text-sm text-slate-600">
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7">
                    {(mode === "month" ? monthGrid : weekGrid).map((day) => {
                        const dayISO = format(day, "yyyy-MM-dd");
                        const dayEvents = eventsByDate.get(dayISO) ?? [];
                        const inMonth = isSameMonth(day, cursor);
                        const today = isToday(day);

                        return (
                            <div
                                key={dayISO}
                                className={`min-h-27.5 border-r border-b p-3 ${
                                    !inMonth && mode === "month" ? "bg-neutral-50 text-slate-400" : "bg-white"
                                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div
                                        className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                                            today ? "bg-emerald-500 text-white" : "text-slate-700"
                                        }`}
                                    >
                                        {format(day, "d")}
                                    </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                    {dayEvents.slice(0, 2).map((ev) => (
                                        <div key={ev.id} className="flex items-center gap-2">
                                            <span className={`w-3 h-3 rounded border ${statusDot(ev.status)}`} />
                                            <div className="text-xs text-slate-700 truncate">{ev.title}</div>
                                        </div>
                                    ))}
                                    {dayEvents.length > 2 && <div className="text-xs text-slate-500">+{dayEvents.length - 2} więcej</div>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
