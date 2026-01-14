import { useMemo, useState } from "react";
import {
    addDays,
    addMonths,
    endOfMonth,
    endOfWeek,
    format,
    startOfMonth,
    startOfWeek,
    subMonths,
} from "date-fns";
import { pl } from "date-fns/locale";
import { downloadExamCSV, getVisibleExamEvents, isApprovedStatus, type ExamEvent } from "../../exams/data/examStore";
import { useAuth } from "../../auth/hooks/useAuth";
import { useExamEvents } from "../../exams/hooks/useExamEvents";
import { useSessionPeriod } from "../../exams/hooks/useSessionPeriod";
import { ScheduleToolbar } from "../components/schedule/ScheduleToolbar";
import { ScheduleLegend } from "../components/schedule/ScheduleLegend";
import { ScheduleCalendar } from "../components/schedule/ScheduleCalendar";
import { EventDetailsModal } from "../components/schedule/EventDetailsModal";

export default function StudentSchedulePage() {
    const { user } = useAuth();
    const { events, loading, error } = useExamEvents();
    const sessionPeriod = useSessionPeriod();

    const [mode, setMode] = useState<"month" | "week">("month");
    const [cursor, setCursor] = useState(() => new Date());
    const [selectedEvent, setSelectedEvent] = useState<ExamEvent | null>(null);

    const visibleEvents = useMemo(() => {
        const scoped = getVisibleExamEvents(events, user, sessionPeriod);
        return scoped.filter((event) => isApprovedStatus(event.status));
    }, [events, user, sessionPeriod]);

    const eventsByDate = useMemo(() => {
        const map = new Map<string, ExamEvent[]>();
        for (const e of visibleEvents) {
            const arr = map.get(e.dateISO) ?? [];
            arr.push(e);
            map.set(e.dateISO, arr);
        }
        return map;
    }, [visibleEvents]);

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

    const days = mode === "month" ? monthGrid : weekGrid;

    return (
        <div className="space-y-5">
            <ScheduleToolbar
                mode={mode}
                label={mode === "month" ? monthLabel : format(cursor, "d LLLL yyyy", { locale: pl })}
                onPrev={() => setCursor((d) => (mode === "month" ? subMonths(d, 1) : addDays(d, -7)))}
                onNext={() => setCursor((d) => (mode === "month" ? addMonths(d, 1) : addDays(d, 7)))}
                onModeChange={setMode}
                onExport={() => downloadExamCSV("egzaminy.csv", visibleEvents)}
            />

            {(loading || error) && (
                <div className="bg-white border rounded-2xl p-4 text-sm">
                    {loading && <div className="text-slate-600">Ladowanie...</div>}
                    {error && <div className="text-red-600">Blad: {error}</div>}
                </div>
            )}

            <ScheduleLegend sessionPeriod={sessionPeriod} />

            <ScheduleCalendar
                mode={mode}
                cursor={cursor}
                days={days}
                eventsByDate={eventsByDate}
                sessionRange={sessionRange}
                onSelectEvent={setSelectedEvent}
            />

            {selectedEvent && (
                <EventDetailsModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}
        </div>
    );
}

