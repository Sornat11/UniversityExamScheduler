import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type User = { username: string; role: number; isStarost: boolean };
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

export function AuthProvider({ children }: Readonly<{ children: React.ReactNode }>) {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Hydrate user z tokenu
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
            } catch {
                localStorage.removeItem(TOKEN_KEY);
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
                console.log(res);
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
                setToken(data.accessToken);
                setUser(data.user);
            },

            logout: () => {
                localStorage.removeItem(TOKEN_KEY);
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
