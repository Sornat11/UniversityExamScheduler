import { createContext } from "react";
import type { AuthUser } from "../types/auth";

export type AuthState = {
    token: string | null;
    user: AuthUser | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);
