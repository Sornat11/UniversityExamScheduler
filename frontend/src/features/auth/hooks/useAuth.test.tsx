import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AuthContext, type AuthState } from "../context/authContext";
import { useAuth } from "./useAuth";

describe("useAuth", () => {
    it("throws when used outside the provider", () => {
        expect(() => renderHook(() => useAuth())).toThrowError(
            "useAuth must be used inside AuthProvider"
        );
    });

    it("returns the context value when provider is present", () => {
        const state: AuthState = {
            token: "token",
            user: { username: "alice", role: "Student" },
            isLoading: false,
            login: vi.fn().mockResolvedValue(undefined),
            logout: vi.fn(),
        };

        const wrapper = ({ children }: { children: ReactNode }) => (
            <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
        );

        const { result } = renderHook(() => useAuth(), { wrapper });

        expect(result.current).toBe(state);
    });
});
