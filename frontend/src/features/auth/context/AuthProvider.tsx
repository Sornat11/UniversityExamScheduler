import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, LoginResponse } from "../types/auth";
import { isStarosta } from "../utils/roles";
import { AuthContext, type AuthState } from "./authContext";

const TOKEN_KEY = "ues_token";
const USER_KEY = "ues_user";

type Props = {
    children: ReactNode;
};

function decodeJwtPayload(token: string | null): Record<string, unknown> | null {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = normalized.length % 4;
    const padded = pad === 0 ? normalized : normalized.padEnd(normalized.length + (4 - pad), "=");

    try {
        return JSON.parse(atob(padded)) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function getStarostaFromToken(token: string | null): boolean | null {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;

    const raw = payload.is_starosta ?? payload.isStarosta;
    if (typeof raw === "boolean") return raw;
    if (typeof raw === "string") return raw.trim().toLowerCase() === "true";
    return null;
}

function normalizeAuthUser(raw: AuthUser | null, token: string | null): AuthUser | null {
    if (!raw) return null;
    const tokenFlag = getStarostaFromToken(token);
    const starosta = isStarosta(raw) || tokenFlag === true;
    return { ...raw, isStarosta: starosta };
}

export function AuthProvider({ children }: Props) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<AuthUser | null>(() => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw) as AuthUser;
            return normalizeAuthUser(parsed, localStorage.getItem(TOKEN_KEY));
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }
            try {
                const res = await fetch("/api/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Unauthorized");
                const me = (await res.json()) as AuthUser;
                const normalized = normalizeAuthUser(me, token);
                setUser(normalized);
                localStorage.setItem(USER_KEY, JSON.stringify(normalized));
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setToken(null);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        run();
    }, [token]);

    const value = useMemo<AuthState>(
        () => ({
            token,
            user,
            isLoading,
            login: async (username, password) => {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password }),
                });

                const raw = await res.text();
                if (!res.ok) {
                    try {
                        const j = JSON.parse(raw);
                        throw new Error(j.message ?? `HTTP ${res.status}`);
                    } catch {
                        throw new Error(raw || `HTTP ${res.status}`);
                    }
                }

                const data = JSON.parse(raw) as LoginResponse;
                const normalized = normalizeAuthUser(data.user, data.accessToken);

                localStorage.setItem(TOKEN_KEY, data.accessToken);
                localStorage.setItem(USER_KEY, JSON.stringify(normalized));
                setToken(data.accessToken);
                setUser(normalized);
            },

            logout: () => {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
                setToken(null);
                setUser(null);
            },
        }),
        [token, user, isLoading]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
