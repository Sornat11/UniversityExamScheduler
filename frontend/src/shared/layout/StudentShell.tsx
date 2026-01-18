import { type ReactNode, useMemo } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { CalendarDays, BookOpen, PlusCircle, LogOut, UserCircle } from "lucide-react";
import { cx } from "../utils/cx";

type Props = {
    userName: string;
    role: string; // przyjmujemy string, bo backend może zwracać "DeanOffice" / "Dziekanat" / "Lecturer" itd.
    onLogout: () => void;
    children: ReactNode;
};

function NavItem({
    to,
    icon,
    label,
                 }: {
    to: string;
    icon: ReactNode;
    label: string;
}) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                cx(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition",
                    isActive
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "text-slate-700 hover:bg-neutral-100"
                )
            }
            end
        >
            <span className="w-5 h-5">{icon}</span>
            <span>{label}</span>
        </NavLink>
    );
}

function prettyRole(role: string) {
    const r = role.toLowerCase();
    if (r === "student") return "Student";
    if (r === "starosta") return "Starosta";
    if (r === "lecturer" || r === "prowadzacy" || r === "prowadzący") return "Prowadzący";
    if (r === "deanoffice" || r === "dziekanat") return "Dziekanat";
    if (r === "admin") return "Admin";
    return role;
}

export default function StudentShell({ userName, role, onLogout, children }: Props) {
    const location = useLocation();

    const roleKey = String(role ?? "").trim().toLowerCase();

    const isStarosta = roleKey === "starosta";
    const isLecturer = roleKey === "lecturer" || roleKey === "prowadzacy" || roleKey === "prowadzący";
    const isDeanOffice = roleKey === "deanoffice" || roleKey === "dziekanat";

    // ✅ najważniejsze: poprawny base dla każdej roli
    const base = useMemo(() => {
        if (isDeanOffice) return "/app/deanoffice";
        if (isStarosta) return "/app/starosta";
        if (isLecturer) return "/app/lecturer";
        return "/app/student";
    }, [isDeanOffice, isStarosta, isLecturer]);

    const profilePath = `${base}/profile`;

    const pageTitle = useMemo(() => {
        const p = location.pathname;
        if (p.includes("/schedule")) return "Harmonogram egzaminów";
        if (p.includes("/subjects")) return "Lista przedmiotów";
        if (p.includes("/propose")) return "Proponowanie terminu";
        if (p.includes("/panel")) return "Panel dziekanatu";
        if (p.includes("/profile")) return "Panel uzytkownika";
        return "Panel";
    }, [location.pathname]);

    return (
        <div className="min-h-screen bg-neutral-50">
            <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
                <header className="bg-white border rounded-2xl px-4 py-3 w-full flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                    <NavLink
                        to={profilePath}
                        end
                        className={({ isActive }) =>
                            cx(
                                "inline-flex items-center gap-3 rounded-xl border px-3 py-2 transition",
                                isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-slate-200 text-slate-700 hover:bg-neutral-100"
                            )
                        }
                    >
                        <UserCircle className="w-5 h-5" />
                        <div className="text-left">
                            <div className="text-sm font-semibold">Panel uzytkownika</div>
                        </div>
                    </NavLink>
                </header>
                <div className="grid w-full grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
                    {/* SIDEBAR */}
                    <aside className="bg-white border rounded-2xl p-4 h-fit lg:sticky lg:top-6">
                        <div className="px-2 pb-4 border-b">
                            <div className="text-emerald-700 font-semibold text-lg">System Egzaminacyjny</div>
                            <div className="text-sm text-slate-600 mt-1">
                                {userName} <span className="mx-1">•</span>{" "}
                                <span className="font-medium">{prettyRole(role)}</span>
                            </div>
                        </div>

                        <nav className="mt-4 space-y-2">
                            {!isDeanOffice && (
                                <NavItem
                                    to={`${base}/schedule`}
                                    icon={<CalendarDays className="w-5 h-5" />}
                                    label="Harmonogram"
                                />
                            )}

                            {/* dziekanat: przedmioty + panel */}
                            {isDeanOffice ? (
                                <>
                                    <NavItem
                                        to={`${base}/subjects`}
                                        icon={<BookOpen className="w-5 h-5" />}
                                        label="Przedmioty"
                                    />
                                    <NavItem
                                        to={`${base}/panel`}
                                        icon={<PlusCircle className="w-5 h-5" />}
                                        label="Panel dziekanatu"
                                    />
                                </>
                            ) : (
                                <>
                                    {/* starosta/prowadzący: proponowanie */}
                                    {(isStarosta || isLecturer) && (
                                        <NavItem
                                            to={`${base}/propose`}
                                            icon={<PlusCircle className="w-5 h-5" />}
                                            label="Proponowanie terminu"
                                        />
                                    )}

                                    {/* student/starosta/prowadzący */}
                                    <NavItem
                                        to={`${base}/subjects`}
                                        icon={<BookOpen className="w-5 h-5" />}
                                        label="Przedmioty"
                                    />
                                </>
                            )}
                        </nav>

                        <div className="mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onLogout}
                                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-neutral-100 transition"
                            >
                                <LogOut className="w-4 h-4" />
                                Wyloguj
                            </button>
                        </div>
                    </aside>

                    {/* MAIN */}
                    <main className="bg-white border rounded-2xl p-6 min-w-0">
                        <div className="mb-5">
                            <div className="text-slate-900 font-semibold text-xl">{pageTitle}</div>
                        </div>
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
}
