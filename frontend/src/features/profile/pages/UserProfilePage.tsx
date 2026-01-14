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

export default function UserProfilePage() {
    const { user } = useAuth();

    const fullName = useMemo(() => {
        const parts = [user?.firstName, user?.lastName].filter(Boolean);
        return parts.join(" ");
    }, [user?.firstName, user?.lastName]);

    const profileRows = useMemo(
        () => [
            { label: "Uzytkownik", value: user?.username ?? "Brak danych" },
            { label: "Imie i nazwisko", value: fullName || "Brak danych" },
            { label: "Rola", value: formatRole(user?.role) },
            { label: "Funkcja", value: isStarosta(user) ? "Starosta" : "Brak danych" },
        ],
        [fullName, user]
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
