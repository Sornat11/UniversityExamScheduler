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
import {
    ensureExamDataLoaded,
    getExamDataSnapshot,
    getSessionPeriodSnapshot,
    subscribeExamData,
    subscribeSessionPeriod,
    type ExamEvent,
    type ExamStatus,
    type SessionPeriod,
} from "./studentExamData";

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
    const [sessionPeriod, setSessionPeriod] = useState<SessionPeriod | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<ExamEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Ɛ˜ Jedno ”d'o danych (mock / backend zaleśnie od studentExamData.ts)
    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                await ensureExamDataLoaded();
                if (!alive) return;
                setEvents(getExamDataSnapshot());
                setSessionPeriod(getSessionPeriodSnapshot());
            } catch (e: any) {
                if (!alive) return;
                setError(e?.message ?? "B’1'Żd pobierania danych");
            } finally {
                if (alive) setLoading(false);
            }
        })();

        const unsubExams = subscribeExamData(() => setEvents(getExamDataSnapshot()));
        const unsubSession = subscribeSessionPeriod(() => setSessionPeriod(getSessionPeriodSnapshot()));

        return () => {
            alive = false;
            unsubExams();
            unsubSession();
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

    const sessionRange = useMemo(() => {
        if (!sessionPeriod) return null;
        return {
            start: new Date(`${sessionPeriod.startISO}T00:00:00`),
            end: new Date(`${sessionPeriod.endISO}T23:59:59`),
        };
    }, [sessionPeriod]);

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
                    {sessionPeriod && (
                        <LegendItem
                            label={`Okres sesji ${format(new Date(sessionPeriod.startISO + "T00:00:00"), "d.MM", { locale: pl })} - ${format(new Date(sessionPeriod.endISO + "T00:00:00"), "d.MM", { locale: pl })}`}
                            dotClass="bg-emerald-50 border-emerald-200"
                        />
                    )}
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
                        const inSession = sessionRange && day >= sessionRange.start && day <= sessionRange.end;

                        const baseTone = !inMonth && mode === "month" ? "bg-neutral-50 text-slate-400" : "bg-white";
                        const sessionTone = inSession ? "bg-emerald-50 border-emerald-200 shadow-[inset_0_0_0_2px_rgba(16,185,129,0.35)]" : "";

                        return (
                            <div
                                key={dayISO}
                                className={`relative min-h-27.5 border-r border-b p-3 ${baseTone} ${sessionTone}`}
                            >
                        <div className="flex items-start justify-between">
                            <div
                                className={`text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full ${
                                    today ? "bg-emerald-500 text-white" : "text-slate-700"
                                }`}
                            >
                                {format(day, "d")}
                            </div>
                            {inSession && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                                    Sesja
                                </span>
                            )}
                        </div>

                                <div className="mt-3 space-y-2">
                                    {dayEvents.map((ev) => (
                                        <button
                                            key={ev.id}
                                            type="button"
                                            onClick={() => setSelectedEvent(ev)}
                                            className="w-full text-left flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-neutral-100 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-400"
                                            title={ev.room ? `${ev.title} (${ev.room})` : ev.title}
                                        >
                                            <span className={`w-3 h-3 rounded border ${statusDot(ev.status)}`} />
                                            <div className="text-xs text-slate-700 truncate">
                                                {ev.time ? `${ev.time} - ` : ""}
                                                {ev.title}
                                                {ev.room ? ` (${ev.room})` : ""}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
            {selectedEvent && (
                <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="text-lg font-semibold text-slate-900">{selectedEvent.title}</div>
                                <div className="text-sm text-slate-600">
                                    {format(new Date(selectedEvent.dateISO + "T00:00:00"), "d LLLL yyyy", { locale: pl })}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100 text-slate-500"
                                onClick={() => setSelectedEvent(null)}
                                aria-label="Zamknij"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                            {selectedEvent.time && (
                                <div><span className="font-semibold text-slate-900">Godzina:</span> {selectedEvent.time}</div>
                            )}
                            {selectedEvent.room && (
                                <div><span className="font-semibold text-slate-900">Sala:</span> {selectedEvent.room}</div>
                            )}
                            {selectedEvent.lecturer && (
                                <div><span className="font-semibold text-slate-900">Prowadzacy:</span> {selectedEvent.lecturer}</div>
                            )}
                            {selectedEvent.fieldOfStudy && (
                                <div><span className="font-semibold text-slate-900">Kierunek:</span> {selectedEvent.fieldOfStudy}</div>
                            )}
                            {selectedEvent.studyType && (
                                <div><span className="font-semibold text-slate-900">Typ studiow:</span> {selectedEvent.studyType}</div>
                            )}
                            {selectedEvent.status && (
                                <div className="inline-flex items-center gap-2 text-slate-700 mt-1">
                                    <span className={`w-3 h-3 rounded border ${statusDot(selectedEvent.status)}`} />
                                    <span>Status: {selectedEvent.status}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}



