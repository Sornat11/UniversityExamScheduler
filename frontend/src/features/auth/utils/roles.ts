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

export function isStarosta(user: AuthUser | null): boolean {
    if (!user) return false;
    const flags = user as AuthUser & {
        isStarosta?: boolean;
        isStarost?: boolean;
        is_starosta?: boolean;
    };
    const raw = flags.isStarosta ?? flags.isStarost ?? flags.is_starosta;
    return Boolean(raw);
}
