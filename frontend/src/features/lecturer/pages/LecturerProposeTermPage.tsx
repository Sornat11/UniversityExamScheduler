import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeTimeToSlot, proposeExamTerm } from "../../exams/data/examStore";
import { SendHorizonal } from "lucide-react";
import { fetchStudentGroups, type StudentGroupDto } from "../../../api/admin";
import { fetchExams, type ExamDto } from "../../../api/exams";
import { useAuth } from "../../auth/hooks/useAuth";
import { useExamEvents } from "../../exams/hooks/useExamEvents";
import { normalizeRole } from "../../auth/utils/roles";

const LECTURER_NAME = "Dr Piotr Wisniewski";

const SCOPE = {
    fieldOfStudy: "Informatyka",
    studyType: "Stacjonarne",
    year: "3",
};

const GROUP_FALLBACK: StudentGroupDto[] = [
    {
        id: "grp_inf_3_sta",
        name: "INF-3-STA",
        fieldOfStudy: "Informatyka",
        studyType: "Stacjonarne",
        semester: 5,
        starostaId: "",
    },
    {
        id: "grp_inf_3_nie",
        name: "INF-3-NIE",
        fieldOfStudy: "Informatyka",
        studyType: "Niestacjonarne",
        semester: 5,
        starostaId: "",
    },
];

const SUBJECT_FALLBACK: ExamDto[] = [
    { id: "subj_math", name: "Matematyka", lecturerId: "", groupId: "" },
    { id: "subj_prog", name: "Programowanie", lecturerId: "", groupId: "" },
];

const ROOM_OPTIONS = ["A-101", "A-100", "A-102", "B-205", "C-301"];

export default function LecturerProposeTermPage() {
    const nav = useNavigate();
    const { user } = useAuth();
    const { events } = useExamEvents();

    const [groups, setGroups] = useState<StudentGroupDto[]>(GROUP_FALLBACK);
    const [groupId, setGroupId] = useState("");
    const [groupLoadError, setGroupLoadError] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<ExamDto[]>([]);
    const [subjectId, setSubjectId] = useState("");
    const [subjectLoadError, setSubjectLoadError] = useState<string | null>(null);
    const [dateISO, setDateISO] = useState(""); // yyyy-mm-dd
    const [time, setTime] = useState(""); // HH:mm
    const [room, setRoom] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadGroups = async () => {
            try {
                const res = await fetchStudentGroups();
                if (!active) return;
                const next = res && res.length > 0 ? res : GROUP_FALLBACK;
                setGroups(next);
                setGroupId((prev) => prev || next[0]?.id || "");
                if (!res || res.length === 0) {
                    setGroupLoadError("Brak grup z API. Uzywam listy domyslnej.");
                }
            } catch {
                if (!active) return;
                setGroups(GROUP_FALLBACK);
                setGroupId((prev) => prev || GROUP_FALLBACK[0]?.id || "");
                setGroupLoadError("Nie udalo sie pobrac grup. Uzywam listy domyslnej.");
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
                setSubjects(SUBJECT_FALLBACK);
                setSubjectId((prev) => prev || SUBJECT_FALLBACK[0]?.id || "");
                setSubjectLoadError("Nie udalo sie pobrac przedmiotow. Uzywam listy domyslnej.");
            }
        };

        loadSubjects();
        return () => {
            active = false;
        };
    }, []);

    const selectedGroup = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
    const role = useMemo(() => normalizeRole(user?.role), [user]);
    const isLecturer = role === "Lecturer";
    const scope = useMemo(() => {
        if (!selectedGroup) return SCOPE;
        const year = Math.max(1, Math.ceil(selectedGroup.semester / 2));
        return {
            fieldOfStudy: selectedGroup.fieldOfStudy,
            studyType: selectedGroup.studyType,
            year: String(year),
        };
    }, [selectedGroup]);

    const lecturerName = useMemo(() => {
        const firstName = user?.firstName?.trim();
        const lastName = user?.lastName?.trim();
        const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
        return fullName ? `Dr ${fullName}` : LECTURER_NAME;
    }, [user]);
    const lecturerUsername = useMemo(() => user?.username?.trim() || "prowadzacy", [user]);
    const normalizedLecturerUsername = useMemo(() => lecturerUsername.trim().toLowerCase(), [lecturerUsername]);

    const assignedSubjectNames = useMemo(() => {
        if (!isLecturer || !normalizedLecturerUsername) return [];
        const names = new Set<string>();
        for (const e of events) {
            const username = e.lecturerUsername?.trim().toLowerCase();
            if (!username || username !== normalizedLecturerUsername) continue;
            if (e.title) names.add(e.title);
        }
        return Array.from(names).sort((a, b) => a.localeCompare(b));
    }, [events, isLecturer, normalizedLecturerUsername]);

    const availableSubjects = useMemo(() => {
        if (subjects.length > 0) return subjects;
        if (assignedSubjectNames.length === 0) return [];
        return assignedSubjectNames.map((name) => ({ id: name, name, lecturerId: "", groupId: "" }));
    }, [subjects, assignedSubjectNames]);

    useEffect(() => {
        if (availableSubjects.length === 0) {
            setSubjectId("");
            return;
        }
        setSubjectId((prev) => (availableSubjects.some((s) => s.id === prev) ? prev : availableSubjects[0]?.id ?? ""));
    }, [availableSubjects]);

    const selectedSubject = useMemo(() => availableSubjects.find((s) => s.id === subjectId), [availableSubjects, subjectId]);

    const subjectMessage = useMemo(() => {
        if (subjectLoadError) return subjectLoadError;
        if (isLecturer && availableSubjects.length === 0) return "Brak przypisanych przedmiotow.";
        return null;
    }, [subjectLoadError, isLecturer, availableSubjects.length]);

    const canSubmit = useMemo(
        () => Boolean(isLecturer && selectedSubject && dateISO && room && groupId),
        [isLecturer, selectedSubject, dateISO, room, groupId]
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
                        disabled={availableSubjects.length === 0}
                        value={subjectId}
                        onChange={(e) => setSubjectId(e.target.value)}
                    >
                        <option value="">Wybierz przedmiot</option>
                        {availableSubjects.map((s) => (
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
                    <select className="w-full h-11 border rounded-lg px-3 bg-white" value={room} onChange={(e) => setRoom(e.target.value)}>
                        <option value="">Wybierz sale</option>
                        {ROOM_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                    <b>Informacja:</b> Propozycja zostanie wyslana do zatwierdzenia przez <b>staroste</b>.
                    Po akceptacji przez obie strony termin uznany jest za zatwierdzony (bez udzialu dziekanatu).
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                    type="button"
                    disabled={!canSubmit}
                    className="w-full rounded-xl px-4 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold leading-none bg-emerald-600 text-white border border-emerald-700 shadow-md transition disabled:opacity-70 disabled:bg-emerald-600 disabled:text-white disabled:cursor-not-allowed hover:bg-emerald-700"
                    onClick={() => {
                        if (!canSubmit) return;

                        setError(null);
                        if (!selectedSubject) {
                            setError("Brak wybranego przedmiotu.");
                            return;
                        }
                        try {
                            proposeExamTerm({
                                title: selectedSubject.name,
                                dateISO,
                                time: normalizeTimeToSlot(time) || undefined,
                                room: room || undefined,
                                lecturer: lecturerName,
                                lecturerUsername,
                                proposer: "Lecturer",

                                groupId,
                                groupName: selectedGroup?.name,
                                fieldOfStudy: scope.fieldOfStudy,
                                studyType: scope.studyType,
                                year: scope.year,
                                studentUsernames: ["student", "starosta"],
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
                    <li>· Kierunek: <b>{scope.fieldOfStudy}</b></li>
                    <li>· Typ studiow: <b>{scope.studyType}</b></li>
                    <li>· Rok: <b>{scope.year}</b></li>
                </ul>
            </div>
        </div>
    );
}

