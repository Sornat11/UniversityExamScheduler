import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { AuthUser, LoginResponse } from "../types/auth";
import { AuthContext, type AuthState } from "./authContext";

const TOKEN_KEY = "ues_token";
const USER_KEY = "ues_user";

type Props = {
    children: ReactNode;
};

export function AuthProvider({ children }: Props) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<AuthUser | null>(() => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as AuthUser;
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
                setUser(me);
                localStorage.setItem(USER_KEY, JSON.stringify(me));
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

                localStorage.setItem(TOKEN_KEY, data.accessToken);
                localStorage.setItem(USER_KEY, JSON.stringify(data.user));
                setToken(data.accessToken);
                setUser(data.user);
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
