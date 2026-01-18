import { useMemo } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { isStarosta, normalizeRole } from "../../auth/utils/roles";

function formatRole(role: unknown) {
    const normalized = normalizeRole(role);
    const raw = normalized ?? (typeof role === "string" ? role : null);
    if (!raw) return "Brak danych";
    if (raw === "DeanOffice") return "Dziekanat";
    if (raw === "Lecturer") return "Prowadzacy";
    return raw;
}

function formatValue(value: string | number | null | undefined) {
    if (value === null || value === undefined || value === "") return "Brak danych";
    return String(value);
}

function formatYesNo(value: boolean | undefined) {
    if (value === true) return "Tak";
    if (value === false) return "Nie";
    return "Brak danych";
}

function semesterToYear(semester?: number | null) {
    if (!semester || semester <= 0) return null;
    return Math.max(1, Math.ceil(semester / 2));
}

export default function UserProfilePage() {
    const { user } = useAuth();
    const studentGroups = user?.studentGroups ?? [];
    const primaryGroup = studentGroups[0];
    const studyField = primaryGroup?.fieldOfStudy;
    const studyType = primaryGroup?.studyType;
    const year = semesterToYear(primaryGroup?.semester);
    const groupNames = studentGroups.map((group) => group.name).filter(Boolean).join(", ");

    const profileRows = useMemo(
        () => [
            { label: "Uzytkownik", value: user?.username ?? "Brak danych" },
            { label: "Imie", value: formatValue(user?.firstName) },
            { label: "Nazwisko", value: formatValue(user?.lastName) },
            { label: "Rola", value: formatRole(user?.role) },
            { label: "Email", value: formatValue(user?.email) },
            { label: "Studia", value: formatValue(studyField) },
            { label: "Rok studiow", value: year ? String(year) : "Brak danych" },
            { label: "Tryb studiow", value: formatValue(studyType) },
            { label: "Aktywny", value: formatYesNo(user?.isActive) },
            { label: "Grupa", value: groupNames || "Brak danych" },
            { label: "Funkcja", value: isStarosta(user) ? "Starosta" : "Brak danych" },
        ],
        [groupNames, studyField, studyType, user, year]
    );

    return (
        <div className="space-y-4">
            <div className="text-sm font-semibold text-slate-700">Podstawowe informacje</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profileRows.map((row) => (
                    <div key={row.label} className="rounded-xl border bg-neutral-50 px-4 py-3">
                        <div className="text-xs uppercase tracking-wide text-slate-500">{row.label}</div>
                        <div className="mt-1 text-sm font-semibold text-slate-900">{row.value}</div>
                    </div>
                ))}
            </div>
            <div className="text-xs text-slate-500">
                Dane profilu pobierane sa z sesji logowania.
            </div>
        </div>
    );
}
