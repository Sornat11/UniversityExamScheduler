import type { AuthUser, Role } from "../types/auth";

const ROLES: Role[] = ["Student", "Lecturer", "DeanOffice", "Admin"];

export function normalizeRole(role: unknown): Role | null {
    if (typeof role === "number") {
        return ROLES[role] ?? null;
    }
    if (typeof role === "string" && ROLES.includes(role as Role)) {
        return role as Role;
    }
    return null;
}

function getStarostaFromToken(): boolean | null {
    if (typeof window === "undefined") return null;
    if (typeof window.atob !== "function") return null;

    const rawToken = window.localStorage?.getItem("ues_token");
    if (!rawToken) return null;

    const parts = rawToken.split(".");
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4;
    const padded = pad === 0 ? normalized : normalized.padEnd(normalized.length + (4 - pad), "=");

    try {
        const payload = JSON.parse(window.atob(padded)) as Record<string, unknown>;
        const raw = payload.is_starosta ?? payload.isStarosta;
        if (typeof raw === "string") return raw.trim().toLowerCase() === "true";
        if (typeof raw === "number") return raw === 1;
        if (typeof raw === "boolean") return raw;
        return null;
    } catch {
        return null;
    }
}

export function isStarosta(user: AuthUser | null): boolean {
    if (!user) return false;
    const flags = user as AuthUser & {
        isStarosta?: unknown;
        IsStarosta?: unknown;
        isStarost?: unknown;
        is_starosta?: unknown;
    };
    const raw = flags.isStarosta ?? flags.IsStarosta ?? flags.isStarost ?? flags.is_starosta;
    if (typeof raw === "string") return raw.trim().toLowerCase() === "true";
    if (typeof raw === "number") return raw === 1;
    if (typeof raw === "boolean") return raw;

    const username = typeof user.username === "string" ? user.username.trim().toLowerCase() : "";
    if (username === "starosta") return true;

    const role = typeof user.role === "string" ? user.role.trim().toLowerCase() : "";
    if (role === "starosta") return true;

    return getStarostaFromToken() === true;
}
