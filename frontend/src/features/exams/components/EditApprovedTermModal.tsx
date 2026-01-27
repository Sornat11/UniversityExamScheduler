import { useMemo, useState } from "react";
import type { ExamSessionDto, RoomDto } from "../../../api/admin";
import type { ExamEventDto, ExamTermType } from "../../../api/exams";
import { normalizeTimeToSlot, type UpdateApprovedExamTermInput } from "../data/examStore";

const EXAM_DURATION_MINUTES = 90;

function addMinutes(time: string, minutes: number) {
    const [h, m] = time.split(":").map((v) => Number(v));
    if (Number.isNaN(h) || Number.isNaN(m)) return "";
    const total = h * 60 + m + minutes;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

type Props = {
    event: ExamEventDto;
    rooms: RoomDto[];
    sessions: ExamSessionDto[];
    onClose: () => void;
    onSave: (payload: UpdateApprovedExamTermInput) => void | Promise<void>;
    saving?: boolean;
};

export function EditApprovedTermModal({ event, rooms, sessions, onClose, onSave, saving = false }: Props) {
    const [dateISO, setDateISO] = useState(event.dateISO);
    const [time, setTime] = useState(event.time ?? "");
    const [roomId, setRoomId] = useState(event.roomId ?? "");
    const [sessionId, setSessionId] = useState(event.sessionId ?? "");
    const [termType, setTermType] = useState<ExamTermType>(event.type ?? "FirstAttempt");

    const endTime = useMemo(() => {
        const normalized = normalizeTimeToSlot(time) ?? time;
        return normalized ? addMinutes(normalized, EXAM_DURATION_MINUTES) : "";
    }, [time]);

    const canSubmit = Boolean(dateISO && time && sessionId && termType && sessions.length > 0 && !saving);

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="text-lg font-semibold text-slate-900">Edytuj zatwierdzony termin</div>
                        <div className="text-sm text-slate-600">{event.title}</div>
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

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900">
                    Zmiana terminu wymaga ponownej akceptacji drugiej strony.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Sesja</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                        >
                            <option value="">Wybierz</option>
                            {sessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name} ({s.startDate} - {s.endDate})
                                </option>
                            ))}
                        </select>
                        {sessions.length === 0 && (
                            <div className="text-xs text-amber-700">Brak sesji do wyboru.</div>
                        )}
                    </label>

                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Sala</div>
                        <select
                            className="w-full h-10 border rounded-lg px-3 bg-white"
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                        >
                            <option value="">Brak</option>
                            {rooms.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.roomNumber}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Data</div>
                        <input
                            type="date"
                            className="w-full h-10 border rounded-lg px-3"
                            value={dateISO}
                            onChange={(e) => setDateISO(e.target.value)}
                        />
                    </label>

                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Start</div>
                        <input
                            type="time"
                            className="w-full h-10 border rounded-lg px-3"
                            value={time}
                            min="08:00"
                            max="20:00"
                            step="900"
                            onChange={(e) => setTime(normalizeTimeToSlot(e.target.value) ?? e.target.value)}
                        />
                    </label>

                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Koniec</div>
                        <input
                            type="time"
                            className="w-full h-10 border rounded-lg px-3"
                            value={endTime}
                            readOnly
                        />
                    </label>
                </div>

                <label className="space-y-1 block">
                    <div className="text-sm text-slate-600">Typ terminu</div>
                    <select
                        className="w-full h-10 border rounded-lg px-3 bg-white"
                        value={termType}
                        onChange={(e) => setTermType(e.target.value as ExamTermType)}
                    >
                        <option value="FirstAttempt">1 termin</option>
                        <option value="Retake">Poprawka</option>
                        <option value="Commission">Komisja</option>
                    </select>
                </label>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg border text-sm text-slate-600"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Anuluj
                    </button>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold disabled:opacity-70"
                        disabled={!canSubmit}
                        onClick={() => {
                            if (!canSubmit) return;
                            void onSave({
                                sessionId,
                                roomId: roomId || null,
                                dateISO,
                                startTime: time,
                                endTime,
                                type: termType,
                            });
                        }}
                    >
                        Zapisz zmiany
                    </button>
                </div>
            </div>
        </div>
    );
}
