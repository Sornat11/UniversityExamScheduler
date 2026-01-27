import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { getStatusLabel, type ExamEvent } from "../../../exams/data/examStore";
import { statusDotClass } from "../../../exams/utils/status";
import { formatTimeRange } from "../../../exams/utils/time";

type Props = {
    event: ExamEvent;
    onClose: () => void;
};

export function EventDetailsModal({ event, onClose }: Props) {
    const timeRange = formatTimeRange(event.time, event.endTime, "");

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold text-slate-900">{event.title}</div>
                        <div className="text-sm text-slate-600">
                            {format(new Date(event.dateISO + "T00:00:00"), "d LLLL yyyy", { locale: pl })}
                        </div>
                    </div>
                    <button
                        type="button"
                        className="w-8 h-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100 text-slate-500"
                        onClick={onClose}
                        aria-label="Zamknij"
                    >
                        X
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-700">
                    {timeRange && (
                        <div>
                            <span className="font-semibold text-slate-900">Godzina:</span> {timeRange}
                        </div>
                    )}
                    {event.room && (
                        <div>
                            <span className="font-semibold text-slate-900">Sala:</span> {event.room}
                        </div>
                    )}
                    {event.lecturer && (
                        <div>
                            <span className="font-semibold text-slate-900">Prowadzacy:</span> {event.lecturer}
                        </div>
                    )}
                    {event.fieldOfStudy && (
                        <div>
                            <span className="font-semibold text-slate-900">Kierunek:</span> {event.fieldOfStudy}
                        </div>
                    )}
                    {event.studyType && (
                        <div>
                            <span className="font-semibold text-slate-900">Typ studiow:</span> {event.studyType}
                        </div>
                    )}
                    {event.status && (
                        <div className="inline-flex items-center gap-2 text-slate-700 mt-1">
                            <span className={`w-3 h-3 rounded border ${statusDotClass(event.status)}`} />
                            <span>Status: {getStatusLabel(event.status)}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
