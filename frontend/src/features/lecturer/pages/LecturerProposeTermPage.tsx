import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeTimeToSlot, proposeExamTerm } from "../../exams/data/examStore";
import { SendHorizonal } from "lucide-react";
import {
    fetchExamSessions,
    fetchRooms,
    fetchStudentGroups,
    type RoomDto,
    type StudentGroupDto,
} from "../../../api/admin";
import { fetchExams, type ExamDto } from "../../../api/exams";
import { useAuth } from "../../auth/hooks/useAuth";
import { normalizeRole } from "../../auth/utils/roles";

function addMinutes(time: string, minutes: number) {
    const [h, m] = time.split(":").map((v) => Number(v));
    const total = h * 60 + m + minutes;
    const hh = Math.floor(total / 60) % 24;
    const mm = total % 60;
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export default function LecturerProposeTermPage() {
    const nav = useNavigate();
    const { user } = useAuth();

    const [groups, setGroups] = useState<StudentGroupDto[]>([]);
    const [groupId, setGroupId] = useState("");
    const [groupLoadError, setGroupLoadError] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<ExamDto[]>([]);
    const [subjectId, setSubjectId] = useState("");
    const [subjectLoadError, setSubjectLoadError] = useState<string | null>(null);
    const [dateISO, setDateISO] = useState(""); // yyyy-mm-dd
    const [time, setTime] = useState(""); // HH:mm
    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [roomId, setRoomId] = useState("");
    const [roomLoadError, setRoomLoadError] = useState<string | null>(null);
    const [sessionId, setSessionId] = useState("");
    const [sessionLoadError, setSessionLoadError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadGroups = async () => {
            try {
                const res = await fetchStudentGroups();
                if (!active) return;
                setGroups(res ?? []);
                setGroupId((prev) => prev || res?.[0]?.id || "");
                if (!res || res.length === 0) {
                    setGroupLoadError("Brak grup w API.");
                } else {
                    setGroupLoadError(null);
                }
            } catch {
                if (!active) return;
                setGroups([]);
                setGroupId("");
                setGroupLoadError("Nie udalo sie pobrac grup.");
            }
        };

        loadGroups();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadSubjects = async () => {
            try {
                const res = await fetchExams();
                if (!active) return;
                setSubjects(res ?? []);
                setSubjectId((prev) => prev || res?.[0]?.id || "");
                if (!res || res.length === 0) {
                    setSubjectLoadError("Brak przypisanych przedmiotow.");
                } else {
                    setSubjectLoadError(null);
                }
            } catch {
                if (!active) return;
                setSubjects([]);
                setSubjectId("");
                setSubjectLoadError("Nie udalo sie pobrac przedmiotow.");
            }
        };

        loadSubjects();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadRooms = async () => {
            try {
                const res = await fetchRooms();
                if (!active) return;
                setRooms(res);
                setRoomId((prev) => prev || res[0]?.id || "");
                if (!res || res.length === 0) {
                    setRoomLoadError("Brak sal z API.");
                } else {
                    setRoomLoadError(null);
                }
            } catch {
                if (!active) return;
                setRooms([]);
                setRoomId("");
                setRoomLoadError("Nie udalo sie pobrac sal.");
            }
        };

        loadRooms();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;

        const loadSessions = async () => {
            try {
                const res = await fetchExamSessions();
                if (!active) return;
                const selected = res.find((s) => s.isActive) ?? res[0];
                setSessionId((prev) => prev || selected?.id || "");
                if (!selected) {
                    setSessionLoadError("Brak aktywnej sesji.");
                } else {
                    setSessionLoadError(null);
                }
            } catch {
                if (!active) return;
                setSessionId("");
                setSessionLoadError("Nie udalo sie pobrac sesji.");
            }
        };

        loadSessions();
        return () => {
            active = false;
        };
    }, []);

    const selectedGroup = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
    const role = useMemo(() => normalizeRole(user?.role), [user]);
    const isLecturer = role === "Lecturer";
    const scope = useMemo(() => {
        if (!selectedGroup) return null;
        const year = Math.max(1, Math.ceil(selectedGroup.semester / 2));
        return {
            fieldOfStudy: selectedGroup.fieldOfStudy,
            studyType: selectedGroup.studyType,
            year: String(year),
        };
    }, [selectedGroup]);

    useEffect(() => {
        if (subjects.length === 0) {
            setSubjectId("");
            return;
        }
        setSubjectId((prev) => (subjects.some((s) => s.id === prev) ? prev : subjects[0]?.id ?? ""));
    }, [subjects]);

    const selectedSubject = useMemo(() => subjects.find((s) => s.id === subjectId), [subjects, subjectId]);

    const subjectMessage = useMemo(() => {
        if (subjectLoadError) return subjectLoadError;
        if (isLecturer && subjects.length === 0) return "Brak przypisanych przedmiotow.";
        return null;
    }, [subjectLoadError, isLecturer, subjects.length]);

    const canSubmit = useMemo(
        () => Boolean(isLecturer && selectedSubject && dateISO && time && roomId && sessionId && groupId),
        [isLecturer, selectedSubject, dateISO, time, roomId, sessionId, groupId]
    );

    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 space-y-5 max-w-2xl">
                <div className="text-slate-900 font-semibold text-lg">Zaproponuj termin egzaminu</div>

                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Grupa</div>
                    <select className="w-full h-11 border rounded-lg px-3 bg-white" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                        <option value="">Wybierz grupe</option>
                        {groups.map((g) => (
                            <option key={g.id} value={g.id}>
                                {g.name}
                            </option>
                        ))}
                    </select>
                    {groupLoadError && <div className="text-xs text-amber-700">{groupLoadError}</div>}
                </div>

                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Przedmiot</div>
                    <select
                        className="w-full h-11 border rounded-lg px-3 bg-white"
                        disabled={subjects.length === 0}
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                    >
                        <option value="">Wybierz przedmiot</option>
                        {subjects.map((s) => (
                            <option key={s.id} value={s.id}>
                                {s.name}
                            </option>
                        ))}
                    </select>
                    {subjectMessage && <div className="text-xs text-amber-700">{subjectMessage}</div>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Data</div>
                        <input
                            type="date"
                            className="w-full h-11 border rounded-lg px-3"
                            value={dateISO}
                            onChange={(e) => setDateISO(e.target.value)}
                        />
                    </label>

                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Godzina</div>
                        <input
                            type="time"
                            className="w-full h-11 border rounded-lg px-3"
                            value={time}
                            min="08:00"
                            max="20:00"
                            step="900"
                            onChange={(e) => setTime(normalizeTimeToSlot(e.target.value) ?? e.target.value)}
                        />
                    </label>
                </div>

                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Sala</div>
                    <select
                        className="w-full h-11 border rounded-lg px-3 bg-white"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    >
                        <option value="">Wybierz sale</option>
                        {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                                {r.roomNumber}
                            </option>
                        ))}
                    </select>
                    {roomLoadError && <div className="text-xs text-amber-700">{roomLoadError}</div>}
                </div>

                {sessionLoadError && <div className="text-xs text-amber-700">{sessionLoadError}</div>}

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                    <b>Informacja:</b> Propozycja zostanie wyslana do zatwierdzenia przez <b>staroste</b>.
                    Po akceptacji przez obie strony termin uznany jest za zatwierdzony (bez udzialu dziekanatu).
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                    type="button"
                    disabled={!canSubmit}
                    className="w-full rounded-xl px-4 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold leading-none bg-emerald-600 text-white border border-emerald-700 shadow-md transition disabled:opacity-70 disabled:bg-emerald-600 disabled:text-white disabled:cursor-not-allowed hover:bg-emerald-700"
                    onClick={async () => {
                        if (!canSubmit) return;

                        setError(null);
                        if (!selectedSubject) {
                            setError("Brak wybranego przedmiotu.");
                            return;
                        }
                        try {
                            const startSlot = normalizeTimeToSlot(time) ?? time;
                            const endSlot = startSlot ? addMinutes(startSlot, 90) : "";

                            await proposeExamTerm({
                                title: selectedSubject.name,
                                dateISO,
                                time: normalizeTimeToSlot(time) || undefined,
                                courseId: selectedSubject.id,
                                sessionId,
                                roomId,
                                termType: "FirstAttempt",
                                startTime: startSlot || undefined,
                                endTime: endSlot || undefined,
                            });

                            nav("/app/lecturer/subjects", { replace: true });
                        } catch (e: unknown) {
                            const message = e instanceof Error ? e.message : "Nie udalo sie zapisac propozycji.";
                            setError(message);
                        }
                    }}
                >
                    <SendHorizonal className="w-4 h-4" />
                    Zaproponuj termin
                </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 max-w-2xl">
                <div className="text-emerald-800 font-semibold mb-3">Zakres uprawnien</div>
                <ul className="text-sm text-emerald-800 space-y-1">
                    <li>· Kierunek: <b>{scope?.fieldOfStudy ?? "-"}</b></li>
                    <li>· Typ studiow: <b>{scope?.studyType ?? "-"}</b></li>
                    <li>· Rok: <b>{scope?.year ?? "-"}</b></li>
                </ul>
            </div>
        </div>
    );
}


