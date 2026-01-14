import type { ReactElement } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/hooks/useAuth";
import { normalizeRole, isStarosta } from "../features/auth/utils/roles";
import StudentShell from "../shared/layout/StudentShell";
import { PlaceholderCard } from "../shared/components/PlaceholderCard";

import LoginPage from "../features/auth/pages/LoginPage";
import StudentSchedulePage from "../features/student/pages/StudentSchedulePage";
import StudentSubjectsPage from "../features/student/pages/StudentSubjectsPage";
import StarostaSubjectsPage from "../features/starosta/pages/StarostaSubjectsPage";
import StarostaProposeTermPage from "../features/starosta/pages/StarostaProposeTermPage";
import LecturerSubjectsPage from "../features/lecturer/pages/LecturerSubjectsPage";
import LecturerProposeTermPage from "../features/lecturer/pages/LecturerProposeTermPage";
import DeanOfficeSubjectsPage from "../features/deanoffice/pages/DeanOfficeSubjectsPage";
import DeanOfficePanelPage from "../features/deanoffice/pages/DeanOfficePanelPage";
import UserProfilePage from "../features/profile/pages/UserProfilePage";

type ProtectedProps = {
    children: ReactElement;
};

function Protected({ children }: ProtectedProps) {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
}

type RequireRoleProps = {
    allowed: Array<"Student" | "Lecturer" | "DeanOffice" | "Admin">;
    children: ReactElement;
};

function RequireRole({ allowed, children }: RequireRoleProps) {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div className="p-6">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    const role = normalizeRole(user.role);
    if (!role || !allowed.includes(role)) return <Navigate to="/app" replace />;
    return children;
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
    if (role === "DeanOffice") return <Navigate to="/app/deanoffice/subjects" replace />;
    if (role === "Admin") return <Navigate to="/app/admin" replace />;

    return <Navigate to="/login" replace />;
}

function StudentApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (isStarosta(user)) {
        const nextPath = location.pathname.replace("/app/student", "/app/starosta");
        const nextTo = `${nextPath}${location.search}${location.hash}`;
        return <Navigate to={nextTo} replace />;
    }

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
                <Route path="profile" element={<UserProfilePage />} />
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
                <Route path="profile" element={<UserProfilePage />} />
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
            userName={user?.username ?? "Prowadzacy"}
            role="Lecturer"
            onLogout={() => {
                logout();
                navigate("/login", { replace: true });
            }}
        >
            <Routes>
                <Route path="schedule" element={<StudentSchedulePage />} />
                <Route path="propose" element={<LecturerProposeTermPage />} />
                <Route path="subjects" element={<LecturerSubjectsPage />} />
                <Route path="profile" element={<UserProfilePage />} />
                <Route path="*" element={<Navigate to="/app/lecturer/schedule" replace />} />
            </Routes>
        </StudentShell>
    );
}

function DeanOfficeApp() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <StudentShell
            userName={user?.username ?? "Dziekanat"}
            role="DeanOffice"
            onLogout={() => {
                logout();
                navigate("/login", { replace: true });
            }}
        >
            <Routes>
                <Route path="subjects" element={<DeanOfficeSubjectsPage />} />
                <Route path="panel" element={<DeanOfficePanelPage />} />
                <Route path="profile" element={<UserProfilePage />} />
                <Route path="*" element={<Navigate to="/app/deanoffice/subjects" replace />} />
            </Routes>
        </StudentShell>
    );
}

function AdminApp() {
    return <PlaceholderCard title="Panel admina (Admin)" />;
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
                        <RequireRole allowed={["DeanOffice", "Admin"]}>
                            <DeanOfficeApp />
                        </RequireRole>
                    </Protected>
                }
            />

            <Route
                path="/app/admin"
                element={
                    <Protected>
                        <RequireRole allowed={["Admin"]}>
                            <AdminApp />
                        </RequireRole>
                    </Protected>
                }
            />

            <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
    );
}



