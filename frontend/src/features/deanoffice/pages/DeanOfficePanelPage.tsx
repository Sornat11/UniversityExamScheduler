import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BookOpen,
    CalendarRange,
    Check,
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
    deleteExam,
    deleteExamSession,
    searchExamSessions,
    searchExams,
    fetchStudentGroups,
    searchUsers,
    updateExamSession,
    updateUser,
} from "../../../api/admin";
import { setSessionPeriod } from "../../exams/data/examStore";
import { SectionCard } from "../components/SectionCard";
import type {
    ExamDto,
    ExamSessionDto,
    Role,
    StudentGroupDto,
    UserDto,
} from "../../../api/admin";

type RoleOption = "Student" | "Starosta" | "Lecturer" | "DeanOffice" | "Admin";

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

function isStudentRole(option: RoleOption) {
    return option === "Student" || option === "Starosta";
}

// Components defined below...

export default function DeanOfficePanelPage() {
    useAuth();

    const [toast, setToast] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"users" | "sessions" | "exams">("users");

    const [usersResult, setUsersResult] = useState<{ items: UserDto[]; totalCount: number; page: number; pageSize: number } | null>(null);
    const [userQuery, setUserQuery] = useState("");
    const [userRoleFilter, setUserRoleFilter] = useState<RoleOption | "Wszystkie">("Wszystkie");
    const [userActiveFilter, setUserActiveFilter] = useState<"Wszyscy" | "Aktywni" | "Nieaktywni">("Wszyscy");
    const [userPage, setUserPage] = useState(1);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
    const selectedRoleOption = selectedUser ? roleOptionFromUser(selectedUser) : null;
    const selectedStudentGroups = selectedUser?.studentGroups ?? [];
    const selectedIsStudent = selectedRoleOption ? isStudentRole(selectedRoleOption) : false;

    const [sessionsResult, setSessionsResult] = useState<{ items: ExamSessionDto[]; totalCount: number; page: number; pageSize: number } | null>(null);
    const [sessionQuery, setSessionQuery] = useState("");
    const [sessionActiveFilter, setSessionActiveFilter] = useState<"Wszystkie" | "Aktywne" | "Nieaktywne">("Wszystkie");
    const [sessionPage, setSessionPage] = useState(1);
    const [sessionForm, setSessionForm] = useState<Omit<ExamSessionDto, "id">>({ name: "", startDate: "", endDate: "", isActive: true });
    const [sessionEditingId, setSessionEditingId] = useState<string | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(false);

    const [examsResult, setExamsResult] = useState<{ items: ExamDto[]; totalCount: number; page: number; pageSize: number } | null>(null);
    const [examQuery, setExamQuery] = useState("");
    const [examLecturerFilter, setExamLecturerFilter] = useState("");
    const [examGroupFilter, setExamGroupFilter] = useState("");
    const [examPage, setExamPage] = useState(1);
    const [examForm, setExamForm] = useState<Omit<ExamDto, "id">>({ name: "", lecturerId: "", groupId: "" });
    const [loadingExams, setLoadingExams] = useState(false);

    const [groups, setGroups] = useState<StudentGroupDto[]>([]);
    const [people, setPeople] = useState<UserDto[]>([]);

    useEffect(() => {
        const t = toast ? setTimeout(() => setToast(null), 2200) : undefined;
        return () => {
            if (t) clearTimeout(t);
        };
    }, [toast]);


    const lecturerOptions = useMemo(() => people.filter((p) => normalizeRole(p.role) === "Lecturer"), [people]);
    const lecturerLabelById = useMemo(() => {
        const map = new Map<string, string>();
        people.forEach((p) => {
            const first = p.firstName?.trim();
            const last = p.lastName?.trim();
            const label = [first, last].filter(Boolean).join(" ").trim();
            if (label) map.set(p.id, label);
        });
        return map;
    }, [people]);
    const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
    const sessions = sessionsResult?.items ?? [];
    const exams = examsResult?.items ?? [];

    const showError = useCallback((message: string) => {
        setError(message);
        setTimeout(() => setError(null), 2500);
    }, []);

    const loadUsers = useCallback(
        async (page = 1, query = "") => {
            setLoadingUsers(true);
            try {
                const roleFilter = userRoleFilter === "Wszystkie" ? undefined : userRoleFilter === "Starosta" ? "Student" : userRoleFilter;
                const isStarosta = userRoleFilter === "Starosta" ? true : undefined;
                const isActive = userActiveFilter === "Aktywni" ? true : userActiveFilter === "Nieaktywni" ? false : undefined;
                const res = await searchUsers({
                    page,
                    pageSize: 10,
                    search: query.trim() || undefined,
                    role: roleFilter,
                    isActive,
                    isStarosta,
                });
                setUsersResult(res);
                if (!people.length) {
                    setPeople(res.items);
                }
            } catch (e: unknown) {
                showError(getErrorMessage(e, "Nie udalo sie pobrac uzytkownikow."));
            } finally {
                setLoadingUsers(false);
            }
        },
        [people.length, showError, userActiveFilter, userRoleFilter]
    );

    const loadSessions = useCallback(async () => {
        setLoadingSessions(true);
        try {
            const activeFilter =
                sessionActiveFilter === "Aktywne" ? true : sessionActiveFilter === "Nieaktywne" ? false : undefined;
            const res = await searchExamSessions({
                page: sessionPage,
                pageSize: 8,
                search: sessionQuery.trim() || undefined,
                isActive: activeFilter,
            });
            setSessionsResult(res);

            const activeRes = await searchExamSessions({ page: 1, pageSize: 1, isActive: true });
            const active = activeRes.items[0] ?? res.items[0];
            if (active) setSessionPeriod(active.startDate, active.endDate);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac okresow sesji."));
        } finally {
            setLoadingSessions(false);
        }
    }, [sessionActiveFilter, sessionPage, sessionQuery, showError]);

    const loadReferenceData = useCallback(async () => {
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
            const groupsRes = await fetchStudentGroups();
            setGroups(groupsRes);
            setPeople(allUsers);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac slownikow."));
        }
    }, [showError]);

    const loadExams = useCallback(async () => {
        setLoadingExams(true);
        try {
            const res = await searchExams({
                page: examPage,
                pageSize: 8,
                search: examQuery.trim() || undefined,
                lecturerId: examLecturerFilter || undefined,
                groupId: examGroupFilter || undefined,
            });
            setExamsResult(res);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie pobrac przedmiotow."));
        } finally {
            setLoadingExams(false);
        }
    }, [examGroupFilter, examLecturerFilter, examPage, examQuery, showError]);
    useEffect(() => {
        loadUsers(userPage, userQuery);
    }, [loadUsers, userPage, userQuery]);

    useEffect(() => {
        setUserPage(1);
    }, [userQuery, userRoleFilter, userActiveFilter]);

    useEffect(() => {
        loadSessions();
        loadReferenceData();
        loadExams();
    }, [loadSessions, loadReferenceData, loadExams]);

    useEffect(() => {
        setSessionPage(1);
    }, [sessionQuery, sessionActiveFilter]);

    useEffect(() => {
        setExamPage(1);
    }, [examQuery, examLecturerFilter, examGroupFilter]);

    async function handleRoleChange(u: UserDto, option: RoleOption) {
        const nextRole = option === "Starosta" ? "Student" : option;
        try {
            await updateUser(u.id, {
                email: u.email,
                firstName: u.firstName,
                lastName: u.lastName,
                role: nextRole,
                isActive: u.isActive,
                isStarosta: option === "Starosta",
                externalId: ("externalId" in u ? (u as { externalId?: string | null }).externalId ?? null : null),
            });
            setToast("Zapisano role uzytkownika.");
            await loadUsers(userPage, userQuery);
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac roli."));
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

    async function handleSessionEdit(s: ExamSessionDto) {
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
            showError("Uzupelnij nazwe, prowadzacego i kierunek z rokiem.");
            return;
        }
        try {
            await createExam(examForm);
            setToast("Dodano przedmiot.");
            setExamForm({ name: "", lecturerId: "", groupId: "" });
            await loadExams();
        } catch (e: unknown) {
            showError(getErrorMessage(e, "Nie udalo sie zapisac przedmiotu."));
        }
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

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm ${activeTab === "users" ? "bg-emerald-600 text-white" : "bg-white"}`}
                    onClick={() => setActiveTab("users")}
                >
                    Uzytkownicy
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
                <SectionCard title="Uzytkownicy i role" icon={<Users className="w-5 h-5" />}>
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
                        <select
                            className="border rounded-lg px-2 py-2 text-sm"
                            value={userRoleFilter}
                            onChange={(e) => setUserRoleFilter(e.target.value as RoleOption | "Wszystkie")}
                        >
                            <option value="Wszystkie">Wszystkie role</option>
                            <option value="Student">Student</option>
                            <option value="Starosta">Starosta</option>
                            <option value="Lecturer">Prowadzacy</option>
                            <option value="DeanOffice">Dziekanat</option>
                            <option value="Admin">Admin</option>
                        </select>
                        <select
                            className="border rounded-lg px-2 py-2 text-sm"
                            value={userActiveFilter}
                            onChange={(e) => setUserActiveFilter(e.target.value as "Wszyscy" | "Aktywni" | "Nieaktywni")}
                        >
                            <option value="Wszyscy">Wszyscy</option>
                            <option value="Aktywni">Aktywni</option>
                            <option value="Nieaktywni">Nieaktywni</option>
                        </select>
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
                                {(usersResult?.items ?? []).map((u) => {
                                    const opt = roleOptionFromUser(u);
                                    return (
                                        <tr key={u.id} className="border-b last:border-b-0">
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-slate-900">
                                                    {u.firstName} {u.lastName}
                                                </div>
                                            </td>
                                            <td className="px-3 py-3 text-slate-700">{u.email}</td>
                                            <td className="px-3 py-3">
                                                <select
                                                    className="border rounded-lg px-2 py-1 text-sm"
                                                    value={opt}
                                                    onChange={(e) => handleRoleChange(u, e.target.value as RoleOption)}
                                                >
                                                    <option value="Student">Student</option>
                                                    <option value="Starosta">Starosta</option>
                                                    <option value="Lecturer">Prowadzacy</option>
                                                    <option value="DeanOffice">Dziekanat</option>
                                                    <option value="Admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-3 py-3">
                                                {u.isActive ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full text-xs">
                                                        <Check className="w-3 h-3" /> Aktywny
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-500">Nieaktywny</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                <button
                                                    type="button"
                                                    className="text-emerald-600 text-sm hover:underline"
                                                    onClick={() => setSelectedUser(u)}
                                                >
                                                    Szczegoly
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
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

                    {selectedUser && (
                        <div className="border rounded-xl p-4 bg-neutral-50">
                            <div className="text-slate-900 font-semibold mb-1">
                                {selectedUser.firstName} {selectedUser.lastName}
                            </div>
                            <div className="text-sm text-slate-600">Email: {selectedUser.email}</div>
                            <div className="text-sm text-slate-600">
                                Rola: {roleOptionLabel(selectedRoleOption ?? "Student")}
                            </div>
                            <div className="text-sm text-slate-600">
                                Status: {selectedUser.isActive ? "Aktywny" : "Nieaktywny"}
                            </div>
                            {selectedIsStudent && (
                                <div className="text-sm text-slate-600 mt-2">
                                    Studia:
                                    {selectedStudentGroups.length > 0 ? (
                                        <div className="mt-1 space-y-1">
                                            {selectedStudentGroups.map((g) => {
                                                const year = Math.max(1, Math.ceil(g.semester / 2));
                                                return (
                                                    <div key={g.id} className="text-slate-700">
                                                        {g.fieldOfStudy} ({g.studyType}) - Rok {year}, sem. {g.semester} - {g.name}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="text-slate-500 mt-1">Brak przypisanej grupy.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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

                    <div className="flex items-center gap-3 flex-wrap pt-2">
                        <input
                            className="border rounded-lg px-3 py-2 text-sm"
                            placeholder="Szukaj po nazwie"
                            value={sessionQuery}
                            onChange={(e) => setSessionQuery(e.target.value)}
                        />
                        <select
                            className="border rounded-lg px-2 py-2 text-sm"
                            value={sessionActiveFilter}
                            onChange={(e) => setSessionActiveFilter(e.target.value as "Wszystkie" | "Aktywne" | "Nieaktywne")}
                        >
                            <option value="Wszystkie">Wszystkie</option>
                            <option value="Aktywne">Aktywne</option>
                            <option value="Nieaktywne">Nieaktywne</option>
                        </select>
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

                    {sessionsResult && sessionsResult.totalCount > sessionsResult.pageSize && (
                        <div className="flex items-center justify-between pt-3 text-sm">
                            <div>
                                Strona {sessionsResult.page} / {Math.ceil(sessionsResult.totalCount / sessionsResult.pageSize)}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    className="px-3 py-2 border rounded-lg disabled:opacity-50"
                                    disabled={sessionPage <= 1}
                                    onClick={() => setSessionPage((p) => Math.max(1, p - 1))}
                                >
                                    Poprzednia
                                </button>
                                <button
                                    type="button"
                                    className="px-3 py-2 border rounded-lg disabled:opacity-50"
                                    disabled={sessionPage >= Math.ceil(sessionsResult.totalCount / sessionsResult.pageSize)}
                                    onClick={() => setSessionPage((p) => p + 1)}
                                >
                                    Nastepna
                                </button>
                            </div>
                        </div>
                    )}
                </SectionCard>
            )}

            {activeTab === "exams" && (
                <SectionCard title="Przedmioty" icon={<BookOpen className="w-5 h-5" />}>
                    <div className="space-y-4">
                        <div className="text-sm text-slate-700 font-semibold">Dodaj przedmiot</div>
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
                            <span className="text-slate-600">Kierunek i rok</span>
                            <select
                                className="border rounded-lg px-3 py-2 w-full"
                                value={examForm.groupId}
                                onChange={(e) => setExamForm((f) => ({ ...f, groupId: e.target.value }))}
                            >
                                <option value="">Wybierz</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={g.id}>
                                        {g.fieldOfStudy}, rok {Math.max(1, Math.ceil(g.semester / 2))} ({g.name})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm"
                            onClick={handleExamSave}
                        >
                            <Plus className="w-4 h-4" /> Dodaj przedmiot
                        </button>

                        <div className="border-t pt-4">
                            <div className="text-sm font-semibold text-slate-700 mb-2">Przedmioty</div>
                            <div className="flex items-center gap-3 flex-wrap mb-3">
                                <input
                                    className="border rounded-lg px-3 py-2 text-sm"
                                    placeholder="Szukaj po nazwie"
                                    value={examQuery}
                                    onChange={(e) => setExamQuery(e.target.value)}
                                />
                                <select
                                    className="border rounded-lg px-2 py-2 text-sm"
                                    value={examLecturerFilter}
                                    onChange={(e) => setExamLecturerFilter(e.target.value)}
                                >
                                    <option value="">Wszyscy prowadzacy</option>
                                    {lecturerOptions.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.firstName} {l.lastName}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    className="border rounded-lg px-2 py-2 text-sm"
                                    value={examGroupFilter}
                                    onChange={(e) => setExamGroupFilter(e.target.value)}
                                >
                                    <option value="">Wszystkie grupy</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>
                                            {g.fieldOfStudy} - sem. {g.semester} ({g.name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {loadingExams && <Loader2 className="w-4 h-4 animate-spin" />}
                            {!loadingExams && exams.length === 0 && (
                                <div className="text-sm text-slate-600">Brak przedmiotow.</div>
                            )}
                            <div className="space-y-2">
                                {exams.map((ex) => {
                                    const lecturerName = lecturerLabelById.get(ex.lecturerId) ?? "Brak prowadzacego";
                                    const group = groupById.get(ex.groupId);
                                    const year = group ? Math.max(1, Math.ceil(group.semester / 2)) : null;
                                    const groupInfo = group
                                        ? `${group.fieldOfStudy} - Rok ${year}, sem. ${group.semester}`
                                        : "Brak przypisanej grupy";
                                    return (
                                        <div key={ex.id} className="border rounded-lg px-3 py-2 flex items-center justify-between">
                                            <div className="text-left">
                                                <div className="font-semibold text-slate-900">{ex.name}</div>
                                                <div className="text-xs text-slate-600">Prowadzacy: {lecturerName}</div>
                                                <div className="text-xs text-slate-600">{groupInfo}</div>
                                            </div>
                                            <button
                                                type="button"
                                                className="text-red-600"
                                                onClick={() => handleExamDelete(ex.id)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                            {examsResult && examsResult.totalCount > examsResult.pageSize && (
                                <div className="flex items-center justify-between pt-3 text-sm">
                                    <div>
                                        Strona {examsResult.page} / {Math.ceil(examsResult.totalCount / examsResult.pageSize)}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="px-3 py-2 border rounded-lg disabled:opacity-50"
                                            disabled={examPage <= 1}
                                            onClick={() => setExamPage((p) => Math.max(1, p - 1))}
                                        >
                                            Poprzednia
                                        </button>
                                        <button
                                            type="button"
                                            className="px-3 py-2 border rounded-lg disabled:opacity-50"
                                            disabled={examPage >= Math.ceil(examsResult.totalCount / examsResult.pageSize)}
                                            onClick={() => setExamPage((p) => p + 1)}
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
        </div>
    );
}














