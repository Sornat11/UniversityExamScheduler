import { useState } from "react";
import { Plus } from "lucide-react";
import type { ExamSessionDto, ExamTermStatus, ExamTermType, RoomDto } from "../../../api/admin";

type FormState = {
    courseId: string;
    sessionId: string;
    roomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: ExamTermType;
    status: ExamTermStatus;
};

type Props = {
    sessions: ExamSessionDto[];
    rooms: RoomDto[];
    defaultCourseId: string;
    onSave: (payload: FormState) => void;
};

export function TermForm({ sessions, rooms, defaultCourseId, onSave }: Props) {
    const [form, setForm] = useState<FormState>({
        courseId: defaultCourseId,
        sessionId: sessions[0]?.id ?? "",
        roomId: "",
        date: "",
        startTime: "09:00",
        endTime: "10:30",
        type: "FirstAttempt",
        status: "Draft",
    });

    return (
        <div className="border rounded-xl p-4 space-y-3 bg-neutral-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-sm space-y-1">
                    <span className="text-slate-600">Okres sesji</span>
                    <select
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.sessionId}
                        onChange={(e) => setForm((f) => ({ ...f, sessionId: e.target.value }))}
                    >
                        <option value="">Wybierz</option>
                        {sessions.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name} ({s.startDate} - {s.endDate})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm space-y-1">
                    <span className="text-slate-600">Sala</span>
                    <select
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.roomId ?? ""}
                        onChange={(e) => setForm((f) => ({ ...f, roomId: e.target.value }))}
                    >
                        <option value="">Brak</option>
                        {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.roomNumber} ({r.type})
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-sm space-y-1">
                    <span className="text-slate-600">Data</span>
                    <input
                        type="date"
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.date}
                        onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="text-sm space-y-1">
                    <span className="text-slate-600">Start</span>
                    <input
                        type="time"
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.startTime}
                        onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                    />
                </label>
                <label className="text-sm space-y-1">
                    <span className="text-slate-600">Koniec</span>
                    <input
                        type="time"
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.endTime}
                        onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                    />
                </label>
                <label className="text-sm space-y-1">
                    <span className="text-slate-600">Typ</span>
                    <select
                        className="border rounded-lg px-3 py-2 w-full"
                        value={form.type}
                        onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ExamTermType }))}
                    >
                        <option value="FirstAttempt">1 termin</option>
                        <option value="Retake">Poprawka</option>
                        <option value="Commission">Komisja</option>
                    </select>
                </label>
            </div>

            <label className="text-sm space-y-1 block">
                <span className="text-slate-600">Status</span>
                <select
                    className="border rounded-lg px-3 py-2 w-full"
                    value={form.status}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ExamTermStatus }))}
                >
                    <option value="Draft">Szkic</option>
                    <option value="ProposedByLecturer">Propozycja (prowadzacy)</option>
                    <option value="ProposedByStudent">Propozycja (student)</option>
                    <option value="Approved">Zatwierdzony</option>
                    <option value="Finalized">Finalny</option>
                    <option value="Rejected">Odrzucony</option>
                </select>
            </label>

            <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                onClick={() => onSave(form)}
            >
                <Plus className="w-4 h-4" /> Dodaj termin
            </button>
        </div>
    );
}
