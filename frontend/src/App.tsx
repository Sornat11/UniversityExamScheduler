import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./auth/AuthContext";

import StudentShell from "./layout/StudentShell";

import StudentSchedulePage from "./pages/student/StudentSchedulePage";
import StudentSubjectsPage from "./pages/student/StudentSubjectsPage";

import StarostaSubjectsPage from "./pages/student/StarostaSubjectsPage";
import StarostaProposeTermPage from "./pages/student/StarostaProposeTermPage";
import LecturerSubjectsPage from "./pages/lecturer/LecturerSubjectsPage";
import LecturerProposeTermPage from "./pages/lecturer/LecturerProposeTermPage";

function Placeholder({ title }: Readonly<{ title: string }>) {
    return (
        <div className="bg-white border rounded-2xl p-6">
            <div className="text-slate-900 font-semibold">{title}</div>
            <div className="text-sm text-slate-600 mt-2">Widok do zrobienia wg Figmy.</div>
        </div>
    );
}

function Protected({ children }: Readonly<{ children: JSX.Element }>) {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

type AppRole = "Student" | "Lecturer" | "DeanOffice" | "Admin";

function normalizeRole(role: unknown): AppRole | null {
    // Backend enum: Student=0, Lecturer=1, DeanOffice=2, Admin=3
    if (typeof role === "number") {
        return (["Student", "Lecturer", "DeanOffice", "Admin"][role] as AppRole) ?? null;
    }
    if (typeof role === "string") {
        if (role === "Student" || role === "Lecturer" || role === "DeanOffice" || role === "Admin") return role;
    }
    return null;
}

function isStarosta(user: any) {
    return Boolean(user?.isStarosta ?? user?.isStarost ?? user?.is_starosta);
}

function AppRedirect() {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    const role = normalizeRole(user.role);

    if (role === "Student") {
        return isStarosta(user)
            ? <Navigate to="/app/starosta/schedule" replace />
            : <Navigate to="/app/student/schedule" replace />;
    }

    if (role === "Lecturer") return <Navigate to="/app/lecturer/schedule" replace />;
    if (role === "DeanOffice") return <Navigate to="/app/deanoffice/schedule" replace />;
    if (role === "Admin") return <Navigate to="/app/admin" replace />;

    return <Navigate to="/login" replace />;
}

function StudentApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <StudentShell
            userName={user?.username ?? "Student"}
            role="Student"
            onLogout={() => {
                logout();
                navigate("/login", { replace: true });
            }}
        >
            <Routes>
                <Route path="schedule" element={<StudentSchedulePage />} />
                <Route path="subjects" element={<StudentSubjectsPage />} />
                <Route path="*" element={<Navigate to="/app/student/schedule" replace />} />
            </Routes>
        </StudentShell>
    );
}

function StarostaApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <StudentShell
            userName={user?.username ?? "Starosta"}
            role="Starosta"
            onLogout={() => {
                logout();
                navigate("/login", { replace: true });
            }}
        >
            <Routes>
                <Route path="schedule" element={<StudentSchedulePage />} />
                <Route path="subjects" element={<StarostaSubjectsPage />} />
                <Route path="propose" element={<StarostaProposeTermPage />} />
                <Route path="*" element={<Navigate to="/app/starosta/schedule" replace />} />
            </Routes>
        </StudentShell>
    );
}

function LecturerApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <StudentShell
            userName={user?.username ?? "Prowadzący"}
            role="Prowadzący"
            onLogout={() => {
                logout();
                navigate("/login", { replace: true });
            }}
        >
            <Routes>
                <Route path="schedule" element={<StudentSchedulePage />} />
                <Route path="propose" element={<LecturerProposeTermPage />} />
                <Route path="subjects" element={<LecturerSubjectsPage />} />
                <Route path="*" element={<Navigate to="/app/lecturer/schedule" replace />} />
            </Routes>
        </StudentShell>
    );
}

import DeanOfficeSubjectsPage from "./pages/deanoffice/DeanOfficeSubjectsPage";
import DeanOfficePanelPage from "./pages/deanoffice/DeanOfficePanelPage";

function DeanOfficeApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <StudentShell
            userName={user?.username ?? "Dziekanat"}
            role="Dziekanat"
            onLogout={() => { logout(); navigate("/login", { replace: true }); }}
        >
            <Routes>
                <Route path="schedule" element={<StudentSchedulePage />} />
                <Route path="subjects" element={<DeanOfficeSubjectsPage />} />
                <Route path="panel" element={<DeanOfficePanelPage />} />
                <Route path="*" element={<Navigate to="/app/deanoffice/schedule" replace />} />
            </Routes>
        </StudentShell>
    );
}


function AdminApp() {
    return <Placeholder title="Panel admina (Admin)" />;
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route
                path="/app"
                element={
                    <Protected>
                        <AppRedirect />
                    </Protected>
                }
            />

            <Route
                path="/app/student/*"
                element={
                    <Protected>
                        <StudentApp />
                    </Protected>
                }
            />

            <Route
                path="/app/starosta/*"
                element={
                    <Protected>
                        <StarostaApp />
                    </Protected>
                }
            />

            <Route
                path="/app/lecturer/*"
                element={
                    <Protected>
                        <LecturerApp />
                    </Protected>
                }
            />

            <Route
                path="/app/deanoffice/*"
                element={
                    <Protected>
                        <DeanOfficeApp />
                    </Protected>
                }
            />

            <Route
                path="/app/admin"
                element={
                    <Protected>
                        <AdminApp />
                    </Protected>
                }
            />

            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}


