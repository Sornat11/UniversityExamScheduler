import { format, isSameMonth, isToday } from "date-fns";
import type { ExamEvent } from "../../../exams/data/examStore";
import { statusDotClass } from "../../../exams/utils/status";
import { formatTimeRange } from "../../../exams/utils/time";

type SessionRange = {
    start: Date;
    end: Date;
};

type Props = {
    mode: "month" | "week";
    cursor: Date;
    days: Date[];
    eventsByDate: Map<string, ExamEvent[]>;
    sessionRange: SessionRange | null;
    onSelectEvent: (event: ExamEvent) => void;
};

export function ScheduleCalendar({ mode, cursor, days, eventsByDate, sessionRange, onSelectEvent }: Props) {
    return (
        <div className="bg-white border rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 border-b">
                {["Pon", "Wt", "Srd", "Czw", "Pt", "Sob", "Nie"].map((d) => (
                    <div key={d} className="py-3 text-center text-sm text-slate-600">
                        {d}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7">
                {days.map((day) => {
                    const dayISO = format(day, "yyyy-MM-dd");
                    const dayEvents = eventsByDate.get(dayISO) ?? [];
                    const inMonth = isSameMonth(day, cursor);
                    const today = isToday(day);
                    const inSession = sessionRange && day >= sessionRange.start && day <= sessionRange.end;

                    const baseTone = !inMonth && mode === "month" ? "bg-neutral-50 text-slate-400" : "bg-white";
                    const sessionTone = inSession ? "bg-amber-50 border-amber-200 shadow-[inset_0_0_0_2px_rgba(245,158,11,0.4)]" : "";

                    return (
                        <div key={dayISO} className={`relative min-h-27.5 border-r border-b p-3 ${baseTone} ${sessionTone}`}>
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
                                {dayEvents.map((ev) => {
                                    const timeRange = formatTimeRange(ev.time, ev.endTime, "");
                                    const title = [
                                        timeRange || null,
                                        ev.title,
                                        ev.room ? `(${ev.room})` : null,
                                    ]
                                        .filter(Boolean)
                                        .join(" ");
                                    return (
                                        <button
                                            key={ev.id}
                                            type="button"
                                            onClick={() => onSelectEvent(ev)}
                                            className="w-full text-left flex items-center gap-2 rounded-md px-1 py-0.5 hover:bg-neutral-100 focus-visible:outline focus-visible:ring-2 focus-visible:ring-emerald-400"
                                            title={title}
                                        >
                                            <span className={`w-3 h-3 rounded border ${statusDotClass(ev.status)}`} />
                                            <div className="text-xs text-slate-700 truncate">
                                                {timeRange ? `${timeRange} ` : ""}
                                                {ev.title}
                                                {ev.room ? ` (${ev.room})` : ""}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
