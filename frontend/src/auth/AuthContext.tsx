import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "Student" | "Lecturer" | "DeanOffice" | "Admin";
type User = { username: string; role: Role | number; isStarosta: boolean; firstName?: string; lastName?: string };
type LoginResponse = { accessToken: string; expiresAtUtc: string; user: User };

type AuthState = {
    token: string | null;
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
};

const AuthCtx = createContext<AuthState | null>(null);
const TOKEN_KEY = "ues_token";
const USER_KEY = "ues_user";

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(() => {
        const raw = localStorage.getItem(USER_KEY);
        if (!raw) return null;
        try {
            return JSON.parse(raw) as User;
        } catch {
            return null;
        }
    });
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate user from stored token
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
                const me = (await res.json()) as User;
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

    return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthCtx);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
