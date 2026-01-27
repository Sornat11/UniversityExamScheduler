import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CalendarRange,
    Loader2,
    Plus,
    RefreshCw,
    Save,
    Search,
    Trash2,
    Users,
} from "lucide-react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
    createExam,
    createExamSession,
    createRoom,
    createStudentGroup,
    createUser,
    deleteExam,
    deleteExamSession,
    deleteRoom,
    deleteStudentGroup,
    deleteUser,
    fetchExamSessions,
    fetchExams,
    fetchRooms,
    fetchStudentGroups,
    searchUsers,
    updateExam,
    updateExamSession,
    updateRoom,
    updateStudentGroup,
    updateUser,
} from "../../../api/admin";
import { setSessionPeriod } from "../../exams/data/examStore";
import { SectionCard } from "../../deanoffice/components/SectionCard";
import type {
    ExamDto,
    ExamSessionDto,
    Role,
    RoomDto,
    StudentGroupDto,
    UserDto,
} from "../../../api/admin";

type RoleOption = "Student" | "Starosta" | "Lecturer" | "DeanOffice" | "Admin";

type UserFormState = {
    email: string;
    firstName: string;
    lastName: string;
    roleOption: RoleOption;
    isActive: boolean;
};

function normalizeRole(role: Role | number | string | undefined): Role | null {
    if (typeof role === "number") {
        return (["Student", "Lecturer", "DeanOffice", "Admin"][role] as Role) ?? null;
    }
    if (role === "Student" || role === "Lecturer" || role === "DeanOffice" || role === "Admin") return role;
    return null;
}

function roleOptionFromUser(u: UserDto): RoleOption {
    const role = normalizeRole(u.role);
    if (role === "Student" && u.isStarosta) return "Starosta";
    return role ?? "Student";
}

function roleOptionLabel(o: RoleOption) {
    if (o === "DeanOffice") return "Dziekanat";
    if (o === "Lecturer") return "Prowadzacy";
    if (o === "Starosta") return "Starosta";
    return o;
}

function getErrorMessage(error: unknown, fallback: string) {
    if (error instanceof Error) return error.message;
    return fallback;
}

function roomTypeLabel(type: RoomDto["type"]) {
    if (type === "Lecture") return "Wykladowa";
    if (type === "Lab") return "Laboratoryjna";
    if (type === "Computer") return "Komputerowa";
    return type;
}

export default function AdminPanelPage() {
    useAuth();

    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"users" | "rooms" | "groups" | "sessions" | "exams">("users");

    const [usersResult, setUsersResult] = useState<{ items: UserDto[]; totalCount: number; page: number; pageSize: number } | null>(null);
    const [userQuery, setUserQuery] = useState("");
    const [userPage, setUserPage] = useState(1);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [userForm, setUserForm] = useState<UserFormState>({
        email: "",
        firstName: "",
        lastName: "",
        roleOption: "Student",
        isActive: true,
    });
    const [userEditingId, setUserEditingId] = useState<string | null>(null);

    const [people, setPeople] = useState<UserDto[]>([]);

    const [rooms, setRooms] = useState<RoomDto[]>([]);
    const [roomForm, setRoomForm] = useState<Omit<RoomDto, "id">>({
        roomNumber: "",
        capacity: 30,
        type: "Lecture",
        isAvailable: true,
    });
    const [roomEditingId, setRoomEditingId] = useState<string | null>(null);
    const [loadingRooms, setLoadingRooms] = useState(false);

    const [groups, setGroups] = useState<StudentGroupDto[]>([]);
    const [groupForm, setGroupForm] = useState<Omit<StudentGroupDto, "id">>({
        name: "",
        fieldOfStudy: "",
        studyType: "Stacjonarne",
        semester: 1,
        starostaId: "",
    });
    const [groupEditingId, setGroupEditingId] = useState<string | null>(null);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [sessions, setSessions] = useState<ExamSessionDto[]>([]);
    const [sessionForm, setSessionForm] = useState<Omit<ExamSessionDto, "id">>({
        name: "",
        startDate: "",
        endDate: "",
        isActive: true,
    });
    const [sessionEditingId, setSessionEditingId] = useState<string | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const [exams, setExams] = useState<ExamDto[]>([]);
    const [examForm, setExamForm] = useState<Omit<ExamDto, "id">>({ name: "", lecturerId: "", groupId: "" });
    const [examEditingId, setExamEditingId] = useState<string | null>(null);
    const [loadingExams, setLoadingExams] = useState(false);

    useEffect(() => {
        const t = toast ? setTimeout(() => setToast(null), 2200) : undefined;
        return () => {
            if (t) clearTimeout(t);
        };
    }, [toast]);

    const lecturerOptions = useMemo(
        () => people.filter((p) => normalizeRole(p.role) === "Lecturer"),
        [people]
    );

    const studentOptions = useMemo(
        () => people.filter((p) => normalizeRole(p.role) === "Student"),
        [people]
    );

    const userLabelById = useMemo(() => {
        const map = new Map<string, string>();
        people.forEach((p) => {
            const label = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
            if (label) map.set(p.id, label);
        });
        return map;
    }, [people]);

    const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);

    const showError = useCallback((message: string) => {
        setError(message);
        setTimeout(() => setError(null), 2500);
    }, []);

    const loadUsers = useCallback(
        async (page = 1, query = "") => {
            setLoadingUsers(true);
            try {
                const res = await searchUsers({ page, pageSize: 10, search: query.trim() || undefined });
                setUsersResult(res);
            } catch (e: unknown) {
                showError(getErrorMessage(e, "Nie udalo sie pobrac uzytkownikow."));
            } finally {
                setLoadingUsers(false);
            }
        },
        [showError]
    );

    const loadAllUsers = useCallback(async () => {
        try {
            const pageSize = 100;
            const firstPage = await searchUsers({ page: 1, pageSize });
            const totalPages = Math.ceil(firstPage.totalCount / firstPage.pageSize);
            const otherPages =
                totalPages > 1
                    ? await Promise.all(
                          Array.from({ length: totalPages - 1 }, (_, idx) =>
                              searchUsers({ page: idx + 2, pageSize })
                          )
                      )
                    : [];
            const allUsers = [firstPage, ...otherPages].flatMap((res) => res.items);
            setPeople(allUsers);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac slownikow uzytkownikow."));
        }
    }, [showError]);

    const loadRooms = useCallback(async () => {
        setLoadingRooms(true);
        try {
            const res = await fetchRooms();
            setRooms(res);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac sal."));
        } finally {
            setLoadingRooms(false);
        }
    }, [showError]);

    const loadGroups = useCallback(async () => {
        setLoadingGroups(true);
        try {
            const res = await fetchStudentGroups();
            setGroups(res);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac grup."));
        } finally {
            setLoadingGroups(false);
        }
    }, [showError]);

    const loadSessions = useCallback(async () => {
        setLoadingSessions(true);
        try {
            const res = await fetchExamSessions();
            setSessions(res);
            const active = res
                .filter((s) => s.isActive)
                .sort((a, b) => b.startDate.localeCompare(a.startDate))[0];
            if (active) setSessionPeriod(active.startDate, active.endDate);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac okresow sesji."));
        } finally {
            setLoadingSessions(false);
        }
    }, [showError]);

    const loadExams = useCallback(async () => {
        setLoadingExams(true);
        try {
            const res = await fetchExams();
            setExams(res);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac przedmiotow."));
        } finally {
            setLoadingExams(false);
        }
    }, [showError]);

    useEffect(() => {
        loadUsers(userPage, userQuery);
    }, [loadUsers, userPage, userQuery]);

    useEffect(() => {
        loadAllUsers();
        loadRooms();
        loadGroups();
        loadSessions();
        loadExams();
    }, [loadAllUsers, loadRooms, loadGroups, loadSessions, loadExams]);

    async function handleUserSave() {
        if (!userForm.email || !userForm.firstName || !userForm.lastName) {
            showError("Uzupelnij email, imie i nazwisko.");
            return;
        }

        const role = userForm.roleOption === "Starosta" ? "Student" : userForm.roleOption;
        const payload = {
            email: userForm.email.trim(),
            firstName: userForm.firstName.trim(),
            lastName: userForm.lastName.trim(),
            role,
            isActive: userForm.isActive,
            isStarosta: userForm.roleOption === "Starosta",
        };

        try {
            if (userEditingId) {
                await updateUser(userEditingId, payload);
                setToast("Zaktualizowano uzytkownika.");
            } else {
                await createUser(payload);
                setToast("Dodano uzytkownika.");
            }
            setUserForm({ email: "", firstName: "", lastName: "", roleOption: "Student", isActive: true });
            setUserEditingId(null);
            await loadUsers(userPage, userQuery);
            await loadAllUsers();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac uzytkownika."));
        }
    }

    function handleUserEdit(u: UserDto) {
        setUserForm({
            email: u.email,
            firstName: u.firstName,
            lastName: u.lastName,
            roleOption: roleOptionFromUser(u),
            isActive: u.isActive,
        });
        setUserEditingId(u.id);
    }

    async function handleUserDelete(u: UserDto) {
        if (!window.confirm("Usunac uzytkownika?")) return;
        try {
            await deleteUser(u.id);
            setToast("Usunieto uzytkownika.");
            await loadUsers(userPage, userQuery);
            await loadAllUsers();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie usunac uzytkownika."));
        }
    }

    async function handleRoomSave() {
        if (!roomForm.roomNumber.trim() || roomForm.capacity <= 0) {
            showError("Uzupelnij numer sali i pojemnosc.");
            return;
        }
        try {
            if (roomEditingId) {
                await updateRoom(roomEditingId, roomForm);
                setToast("Zaktualizowano sale.");
            } else {
                await createRoom(roomForm);
                setToast("Dodano sale.");
            }
            setRoomForm({ roomNumber: "", capacity: 30, type: "Lecture", isAvailable: true });
            setRoomEditingId(null);
            await loadRooms();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac sali."));
        }
    }

    function handleRoomEdit(room: RoomDto) {
        setRoomForm({
            roomNumber: room.roomNumber,
            capacity: room.capacity,
            type: room.type,
            isAvailable: room.isAvailable,
        });
        setRoomEditingId(room.id);
    }

    async function handleRoomDelete(roomId: string) {
        if (!window.confirm("Usunac sale?")) return;
        try {
            await deleteRoom(roomId);
            setToast("Usunieto sale.");
            await loadRooms();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie usunac sali."));
        }
    }

    async function handleGroupSave() {
        if (!groupForm.name.trim() || !groupForm.fieldOfStudy.trim() || !groupForm.starostaId) {
            showError("Uzupelnij nazwe, kierunek oraz staroste.");
            return;
        }
        if (groupForm.semester < 1) {
            showError("Semestr musi byc >= 1.");
            return;
        }
        try {
            if (groupEditingId) {
                await updateStudentGroup(groupEditingId, groupForm);
                setToast("Zaktualizowano grupe.");
            } else {
                await createStudentGroup(groupForm);
                setToast("Dodano grupe.");
            }
            setGroupForm({
                name: "",
                fieldOfStudy: "",
                studyType: "Stacjonarne",
                semester: 1,
                starostaId: "",
            });
            setGroupEditingId(null);
            await loadGroups();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac grupy."));
        }
    }

    function handleGroupEdit(group: StudentGroupDto) {
        setGroupForm({
            name: group.name,
            fieldOfStudy: group.fieldOfStudy,
            studyType: group.studyType,
            semester: group.semester,
            starostaId: group.starostaId,
        });
        setGroupEditingId(group.id);
    }

    async function handleGroupDelete(groupId: string) {
        if (!window.confirm("Usunac grupe?")) return;
        try {
            await deleteStudentGroup(groupId);
            setToast("Usunieto grupe.");
            await loadGroups();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie usunac grupy."));
        }
    }

    async function handleSessionSave() {
        const payload = { ...sessionForm };
        try {
            if (!payload.name || !payload.startDate || !payload.endDate) {
                showError("Uzupelnij nazwe oraz daty sesji.");
                return;
            }
            if (payload.startDate > payload.endDate) {
                showError("Data poczatkowa nie moze byc po dacie koncowej.");
                return;
            }
            if (sessionEditingId) {
                await updateExamSession(sessionEditingId, payload);
                setToast("Zaktualizowano okres sesji.");
            } else {
                await createExamSession(payload);
                setToast("Dodano okres sesji.");
            }
            setSessionForm({ name: "", startDate: "", endDate: "", isActive: true });
            setSessionEditingId(null);
            await loadSessions();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac okresu sesji."));
        }
    }

    function handleSessionEdit(s: ExamSessionDto) {
        setSessionForm({ name: s.name, startDate: s.startDate, endDate: s.endDate, isActive: s.isActive });
        setSessionEditingId(s.id);
    }

    async function handleSessionDelete(id: string) {
        if (!window.confirm("Usunac okres sesji?")) return;
        try {
            await deleteExamSession(id);
            setToast("Usunieto okres sesji.");
            await loadSessions();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie usunac okresu sesji."));
        }
    }

    async function handleExamSave() {
        if (!examForm.name || !examForm.lecturerId || !examForm.groupId) {
            showError("Uzupelnij nazwe, prowadzacego i grupe.");
            return;
        }
        try {
            if (examEditingId) {
                await updateExam(examEditingId, examForm);
                setToast("Zaktualizowano przedmiot.");
            } else {
                await createExam(examForm);
                setToast("Dodano przedmiot.");
            }
            setExamForm({ name: "", lecturerId: "", groupId: "" });
            setExamEditingId(null);
            await loadExams();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac przedmiotu."));
        }
    }

    function handleExamEdit(exam: ExamDto) {
        setExamForm({ name: exam.name, lecturerId: exam.lecturerId, groupId: exam.groupId });
        setExamEditingId(exam.id);
    }

    async function handleExamDelete(id: string) {
        if (!window.confirm("Usunac przedmiot?")) return;
        try {
            await deleteExam(id);
            setToast("Usunieto przedmiot.");
            await loadExams();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie usunac przedmiotu."));
        }
    }

    return (
        <div className="space-y-5">
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 shadow">
                    {toast}
                </div>
            )}
            {error && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 shadow inline-flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm ${activeTab === "users" ? "bg-emerald-600 text-white" : "bg-white"}`}
                    onClick={() => setActiveTab("users")}
                >
                    Uzytkownicy
                </button>
                <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm ${activeTab === "rooms" ? "bg-emerald-600 text-white" : "bg-white"}`}
                    onClick={() => setActiveTab("rooms")}
                >
                    Sale
                </button>
                <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm ${activeTab === "groups" ? "bg-emerald-600 text-white" : "bg-white"}`}
                    onClick={() => setActiveTab("groups")}
                >
                    Grupy
                </button>
                <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm ${activeTab === "sessions" ? "bg-emerald-600 text-white" : "bg-white"}`}
                    onClick={() => setActiveTab("sessions")}
                >
                    Okresy sesji
                </button>
                <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm ${activeTab === "exams" ? "bg-emerald-600 text-white" : "bg-white"}`}
                    onClick={() => setActiveTab("exams")}
                >
                    Przedmioty
                </button>
            </div>

            {activeTab === "users" && (
                <SectionCard title="Uzytkownicy" icon={<Users className="w-5 h-5" />}>
                    <div className="space-y-4">
                        <div className="text-sm font-semibold text-slate-700">Dodaj / edytuj uzytkownika</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Email</span>
                                <input
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={userForm.email}
                                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Rola</span>
                                <select
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={userForm.roleOption}
                                    onChange={(e) => setUserForm((f) => ({ ...f, roleOption: e.target.value as RoleOption }))}
                                >
                                    <option value="Student">Student</option>
                                    <option value="Starosta">Starosta</option>
                                    <option value="Lecturer">Prowadzacy</option>
                                    <option value="DeanOffice">Dziekanat</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Imie</span>
                                <input
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={userForm.firstName}
                                    onChange={(e) => setUserForm((f) => ({ ...f, firstName: e.target.value }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Nazwisko</span>
                                <input
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={userForm.lastName}
                                    onChange={(e) => setUserForm((f) => ({ ...f, lastName: e.target.value }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Status</span>
                                <select
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={userForm.isActive ? "yes" : "no"}
                                    onChange={(e) => setUserForm((f) => ({ ...f, isActive: e.target.value === "yes" }))}
                                >
                                    <option value="yes">Aktywny</option>
                                    <option value="no">Nieaktywny</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                                onClick={handleUserSave}
                            >
                                <Save className="w-4 h-4" /> {userEditingId ? "Zapisz zmiany" : "Dodaj"}
                            </button>
                            {userEditingId && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                                    onClick={() => {
                                        setUserEditingId(null);
                                        setUserForm({
                                            email: "",
                                            firstName: "",
                                            lastName: "",
                                            roleOption: "Student",
                                            isActive: true,
                                        });
                                    }}
                                >
                                    Anuluj
                                </button>
                            )}
                        </div>

                        <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        className="pl-9 pr-3 py-2 border rounded-lg text-sm"
                                        placeholder="Szukaj po imieniu, nazwisku, emailu"
                                        value={userQuery}
                                        onChange={(e) => setUserQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && loadUsers(1, e.currentTarget.value)}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-3 py-2 border rounded-lg text-sm"
                                    onClick={() => loadUsers(1, userQuery)}
                                >
                                    <RefreshCw className="w-4 h-4" /> Odswiez
                                </button>
                            </div>

                            <div className="w-full">
                                <table className="w-full text-sm">
                                    <thead className="bg-neutral-50 border-b">
                                        <tr className="text-left text-slate-600">
                                            <th className="px-3 py-2">Uzytkownik</th>
                                            <th className="px-3 py-2">Email</th>
                                            <th className="px-3 py-2">Rola</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2 text-right">Akcje</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loadingUsers && (
                                            <tr>
                                                <td className="px-3 py-4 text-slate-600" colSpan={5}>
                                                    <div className="inline-flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Ladowanie...
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                        {!loadingUsers && usersResult?.items.length === 0 && (
                                            <tr>
                                                <td className="px-3 py-4 text-slate-600" colSpan={5}>
                                                    Brak uzytkownikow.
                                                </td>
                                            </tr>
                                        )}
                                        {(usersResult?.items ?? []).map((u) => (
                                            <tr key={u.id} className="border-b last:border-b-0">
                                                <td className="px-3 py-3">
                                                    <div className="font-semibold text-slate-900">
                                                        {u.firstName} {u.lastName}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-slate-700">{u.email}</td>
                                                <td className="px-3 py-3 text-slate-700">
                                                    {roleOptionLabel(roleOptionFromUser(u))}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {u.isActive ? (
                                                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-xs">
                                                            Aktywny
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-500">Nieaktywny</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-right space-x-2">
                                                    <button
                                                        type="button"
                                                        className="text-emerald-600 text-sm hover:underline"
                                                        onClick={() => handleUserEdit(u)}
                                                    >
                                                        Edytuj
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="text-red-600 text-sm hover:underline"
                                                        onClick={() => handleUserDelete(u)}
                                                    >
                                                        Usun
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {usersResult && usersResult.totalCount > usersResult.pageSize && (
                                <div className="flex items-center justify-between pt-3 text-sm">
                                    <div>
                                        Strona {usersResult.page} / {Math.ceil(usersResult.totalCount / usersResult.pageSize)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="px-3 py-2 border rounded-lg disabled:opacity-50"
                                            disabled={userPage <= 1}
                                            onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                                        >
                                            Poprzednia
                                        </button>
                                        <button
                                            type="button"
                                            className="px-3 py-2 border rounded-lg disabled:opacity-50"
                                            disabled={userPage >= Math.ceil(usersResult.totalCount / usersResult.pageSize)}
                                            onClick={() => setUserPage((p) => p + 1)}
                                        >
                                            Nastepna
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            )}

            {activeTab === "rooms" && (
                <SectionCard title="Sale" icon={<Plus className="w-5 h-5" />}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Numer sali</span>
                                <input
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={roomForm.roomNumber}
                                    onChange={(e) => setRoomForm((f) => ({ ...f, roomNumber: e.target.value }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Pojemnosc</span>
                                <input
                                    type="number"
                                    min={1}
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={roomForm.capacity}
                                    onChange={(e) => setRoomForm((f) => ({ ...f, capacity: Number(e.target.value) }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Typ sali</span>
                                <select
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={roomForm.type}
                                    onChange={(e) => setRoomForm((f) => ({ ...f, type: e.target.value as RoomDto["type"] }))}
                                >
                                    <option value="Lecture">Wykladowa</option>
                                    <option value="Lab">Laboratoryjna</option>
                                    <option value="Computer">Komputerowa</option>
                                </select>
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Dostepna</span>
                                <select
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={roomForm.isAvailable ? "yes" : "no"}
                                    onChange={(e) => setRoomForm((f) => ({ ...f, isAvailable: e.target.value === "yes" }))}
                                >
                                    <option value="yes">Tak</option>
                                    <option value="no">Nie</option>
                                </select>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                                onClick={handleRoomSave}
                            >
                                <Save className="w-4 h-4" /> {roomEditingId ? "Zapisz zmiany" : "Dodaj"}
                            </button>
                            {roomEditingId && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                                    onClick={() => {
                                        setRoomEditingId(null);
                                        setRoomForm({ roomNumber: "", capacity: 30, type: "Lecture", isAvailable: true });
                                    }}
                                >
                                    Anuluj
                                </button>
                            )}
                        </div>

                        <div className="w-full">
                            <table className="w-full text-sm mt-3">
                                <thead className="bg-neutral-50 border-b">
                                    <tr className="text-left text-slate-600">
                                        <th className="px-3 py-2">Sala</th>
                                        <th className="px-3 py-2">Pojemnosc</th>
                                        <th className="px-3 py-2">Typ</th>
                                        <th className="px-3 py-2">Dostepna</th>
                                        <th className="px-3 py-2 text-right">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingRooms && (
                                        <tr>
                                            <td className="px-3 py-3" colSpan={5}>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </td>
                                        </tr>
                                    )}
                                    {!loadingRooms && rooms.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-3" colSpan={5}>
                                                Brak sal.
                                            </td>
                                        </tr>
                                    )}
                                    {rooms.map((room) => (
                                        <tr key={room.id} className="border-b last:border-b-0">
                                            <td className="px-3 py-3 font-semibold">{room.roomNumber}</td>
                                            <td className="px-3 py-3">{room.capacity}</td>
                                            <td className="px-3 py-3">{roomTypeLabel(room.type)}</td>
                                            <td className="px-3 py-3">{room.isAvailable ? "Tak" : "Nie"}</td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    className="text-emerald-600 text-sm mr-3"
                                                    onClick={() => handleRoomEdit(room)}
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-red-600"
                                                    onClick={() => handleRoomDelete(room.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </SectionCard>
            )}

            {activeTab === "groups" && (
                <SectionCard title="Grupy studenckie" icon={<Users className="w-5 h-5" />}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Nazwa grupy</span>
                                <input
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={groupForm.name}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, name: e.target.value }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Kierunek</span>
                                <input
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={groupForm.fieldOfStudy}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, fieldOfStudy: e.target.value }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Tryb studiow</span>
                                <select
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={groupForm.studyType}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, studyType: e.target.value as StudentGroupDto["studyType"] }))}
                                >
                                    <option value="Stacjonarne">Stacjonarne</option>
                                    <option value="Niestacjonarne">Niestacjonarne</option>
                                </select>
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Semestr</span>
                                <input
                                    type="number"
                                    min={1}
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={groupForm.semester}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, semester: Number(e.target.value) }))}
                                />
                            </label>
                            <label className="text-sm space-y-1">
                                <span className="text-slate-600">Starosta</span>
                                <select
                                    className="border rounded-lg px-3 py-2 w-full"
                                    value={groupForm.starostaId}
                                    onChange={(e) => setGroupForm((f) => ({ ...f, starostaId: e.target.value }))}
                                >
                                    <option value="">Wybierz</option>
                                    {studentOptions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.firstName} {s.lastName}{s.isStarosta ? " (starosta)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                                onClick={handleGroupSave}
                            >
                                <Save className="w-4 h-4" /> {groupEditingId ? "Zapisz zmiany" : "Dodaj"}
                            </button>
                            {groupEditingId && (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                                    onClick={() => {
                                        setGroupEditingId(null);
                                        setGroupForm({
                                            name: "",
                                            fieldOfStudy: "",
                                            studyType: "Stacjonarne",
                                            semester: 1,
                                            starostaId: "",
                                        });
                                    }}
                                >
                                    Anuluj
                                </button>
                            )}
                        </div>

                        <div className="w-full">
                            <table className="w-full text-sm mt-3">
                                <thead className="bg-neutral-50 border-b">
                                    <tr className="text-left text-slate-600">
                                        <th className="px-3 py-2">Grupa</th>
                                        <th className="px-3 py-2">Kierunek</th>
                                        <th className="px-3 py-2">Semestr</th>
                                        <th className="px-3 py-2">Starosta</th>
                                        <th className="px-3 py-2 text-right">Akcje</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loadingGroups && (
                                        <tr>
                                            <td className="px-3 py-3" colSpan={5}>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            </td>
                                        </tr>
                                    )}
                                    {!loadingGroups && groups.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-3" colSpan={5}>
                                                Brak grup.
                                            </td>
                                        </tr>
                                    )}
                                    {groups.map((g) => (
                                        <tr key={g.id} className="border-b last:border-b-0">
                                            <td className="px-3 py-3 font-semibold">{g.name}</td>
                                            <td className="px-3 py-3">{g.fieldOfStudy}</td>
                                            <td className="px-3 py-3">{g.semester}</td>
                                            <td className="px-3 py-3">
                                                {userLabelById.get(g.starostaId) ?? "Brak"}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    className="text-emerald-600 text-sm mr-3"
                                                    onClick={() => handleGroupEdit(g)}
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-red-600"
                                                    onClick={() => handleGroupDelete(g.id)}
                                                >
                                                    <Trash2 className="w-4 h-4 inline" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </SectionCard>
            )}

            {activeTab === "sessions" && (
                <SectionCard title="Okresy sesji" icon={<CalendarRange className="w-5 h-5" />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="text-sm space-y-1">
                            <span className="text-slate-600">Nazwa</span>
                            <input
                                className="border rounded-lg px-3 py-2 w-full"
                                value={sessionForm.name}
                                onChange={(e) => setSessionForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-slate-600">Aktywna</span>
                            <select
                                className="border rounded-lg px-3 py-2 w-full"
                                value={sessionForm.isActive ? "yes" : "no"}
                                onChange={(e) => setSessionForm((f) => ({ ...f, isActive: e.target.value === "yes" }))}
                            >
                                <option value="yes">Tak</option>
                                <option value="no">Nie</option>
                            </select>
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-slate-600">Start</span>
                            <input
                                type="date"
                                className="border rounded-lg px-3 py-2 w-full"
                                value={sessionForm.startDate}
                                onChange={(e) => setSessionForm((f) => ({ ...f, startDate: e.target.value }))}
                            />
                        </label>
                        <label className="text-sm space-y-1">
                            <span className="text-slate-600">Koniec</span>
                            <input
                                type="date"
                                className="border rounded-lg px-3 py-2 w-full"
                                value={sessionForm.endDate}
                                onChange={(e) => setSessionForm((f) => ({ ...f, endDate: e.target.value }))}
                            />
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                            onClick={handleSessionSave}
                        >
                            <Save className="w-4 h-4" /> {sessionEditingId ? "Zapisz zmiany" : "Dodaj"}
                        </button>
                        {sessionEditingId && (
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                                onClick={() => {
                                    setSessionEditingId(null);
                                    setSessionForm({ name: "", startDate: "", endDate: "", isActive: true });
                                }}
                            >
                                Anuluj
                            </button>
                        )}
                    </div>

                    <div className="w-full">
                        <table className="w-full text-sm mt-3">
                            <thead className="bg-neutral-50 border-b">
                                <tr className="text-left text-slate-600">
                                    <th className="px-3 py-2">Nazwa</th>
                                    <th className="px-3 py-2">Daty</th>
                                    <th className="px-3 py-2">Aktywna</th>
                                    <th className="px-3 py-2 text-right">Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingSessions && (
                                    <tr>
                                        <td className="px-3 py-3" colSpan={4}>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        </td>
                                    </tr>
                                )}
                                {!loadingSessions && sessions.length === 0 && (
                                    <tr>
                                        <td className="px-3 py-3" colSpan={4}>
                                            Brak okresow sesji.
                                        </td>
                                    </tr>
                                )}
                                {sessions.map((s) => (
                                    <tr key={s.id} className="border-b last:border-b-0">
                                        <td className="px-3 py-3 font-semibold">{s.name}</td>
                                        <td className="px-3 py-3">
                                            {s.startDate} - {s.endDate}
                                        </td>
                                        <td className="px-3 py-3">{s.isActive ? "Tak" : "Nie"}</td>
                                        <td className="px-3 py-3 text-right">
                                            <button
                                                type="button"
                                                className="text-emerald-600 text-sm mr-3"
                                                onClick={() => handleSessionEdit(s)}
                                            >
                                                Edytuj
                                            </button>
                                            <button
                                                type="button"
                                                className="text-red-600"
                                                onClick={() => handleSessionDelete(s.id)}
                                            >
                                                <Trash2 className="w-4 h-4 inline" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </SectionCard>
            )}

            {activeTab === "exams" && (
                <SectionCard title="Przedmioty" icon={<BookOpen className="w-5 h-5" />}>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-700 font-semibold">Dodaj / edytuj przedmiot</div>
                        <label className="text-sm space-y-1 block">
                            <span className="text-slate-600">Nazwa</span>
                            <input
                                className="border rounded-lg px-3 py-2 w-full"
                                value={examForm.name}
                                onChange={(e) => setExamForm((f) => ({ ...f, name: e.target.value }))}
                            />
                        </label>
                        <label className="text-sm space-y-1 block">
                            <span className="text-slate-600">Prowadzacy</span>
                            <select
                                className="border rounded-lg px-3 py-2 w-full"
                                value={examForm.lecturerId}
                                onChange={(e) => setExamForm((f) => ({ ...f, lecturerId: e.target.value }))}
                            >
                                <option value="">Wybierz</option>
                                {lecturerOptions.map((l) => (
                                    <option key={l.id} value={l.id}>
                                        {l.firstName} {l.lastName}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-sm space-y-1 block">
                            <span className="text-slate-600">Grupa</span>
                            <select
                                className="border rounded-lg px-3 py-2 w-full"
                                value={examForm.groupId}
                                onChange={(e) => setExamForm((f) => ({ ...f, groupId: e.target.value }))}
                            >
                                <option value="">Wybierz</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.fieldOfStudy}, sem. {g.semester} ({g.name})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                            onClick={handleExamSave}
                        >
                            <Plus className="w-4 h-4" /> {examEditingId ? "Zapisz zmiany" : "Dodaj przedmiot"}
                        </button>
                        {examEditingId && (
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-sm"
                                onClick={() => {
                                    setExamEditingId(null);
                                    setExamForm({ name: "", lecturerId: "", groupId: "" });
                                }}
                            >
                                Anuluj
                            </button>
                        )}

                        <div className="border-t pt-4">
                            <div className="text-sm font-semibold text-slate-700 mb-2">Przedmioty</div>
                            {loadingExams && <Loader2 className="w-4 h-4 animate-spin" />}
                            {!loadingExams && exams.length === 0 && (
                                <div className="text-sm text-slate-600">Brak przedmiotow.</div>
                            )}
                            <div className="space-y-2">
                                {exams.map((ex) => {
                                    const lecturerName = userLabelById.get(ex.lecturerId) ?? "Brak prowadzacego";
                                    const group = groupById.get(ex.groupId);
                                    const groupInfo = group
                                        ? `${group.fieldOfStudy} - Sem. ${group.semester}`
                                        : "Brak przypisanej grupy";
                                    return (
                                        <div key={ex.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-900">{ex.name}</div>
                                                <div className="text-xs text-slate-600">Prowadzacy: {lecturerName}</div>
                                                <div className="text-xs text-slate-600">{groupInfo}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="text-emerald-600 text-sm"
                                                    onClick={() => handleExamEdit(ex)}
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    type="button"
                                                    className="text-red-600"
                                                    onClick={() => handleExamDelete(ex.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </SectionCard>
            )}
        </div>
    );
}
