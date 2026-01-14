import { describe, expect, it } from "vitest";
import type { AuthUser } from "../types/auth";
import { isStarosta, normalizeRole } from "./roles";

describe("normalizeRole", () => {
    it("maps numeric roles to names", () => {
        expect(normalizeRole(0)).toBe("Student");
        expect(normalizeRole(1)).toBe("Lecturer");
        expect(normalizeRole(2)).toBe("DeanOffice");
        expect(normalizeRole(3)).toBe("Admin");
    });

    it("returns null for out-of-range numeric role", () => {
        expect(normalizeRole(4)).toBeNull();
        expect(normalizeRole(-1)).toBeNull();
    });

    it("accepts valid role strings", () => {
        expect(normalizeRole("Student")).toBe("Student");
        expect(normalizeRole("Lecturer")).toBe("Lecturer");
    });

    it("rejects invalid role strings", () => {
        expect(normalizeRole("Unknown")).toBeNull();
        expect(normalizeRole("")).toBeNull();
    });
});

describe("isStarosta", () => {
    const baseUser: AuthUser = { username: "alice", role: "Student" };

    it("returns false when user is null", () => {
        expect(isStarosta(null)).toBe(false);
    });

    it("detects starosta flags from multiple property names", () => {
        const camel = { ...baseUser, isStarosta: true };
        const legacy = { ...baseUser, isStarost: true } as AuthUser & { isStarost?: boolean };
        const snake = { ...baseUser, is_starosta: true } as AuthUser & { is_starosta?: boolean };
        const pascal = { ...baseUser, IsStarosta: true } as AuthUser & { IsStarosta?: boolean };

        expect(isStarosta(camel)).toBe(true);
        expect(isStarosta(legacy)).toBe(true);
        expect(isStarosta(snake)).toBe(true);
        expect(isStarosta(pascal)).toBe(true);
    });

    it("returns false for falsy flags", () => {
        expect(isStarosta({ ...baseUser, isStarosta: false })).toBe(false);
    });

    it("parses string flags safely", () => {
        const truthy = { ...baseUser, isStarosta: "true" } as AuthUser & { isStarosta?: string };
        const falsy = { ...baseUser, isStarosta: "false" } as AuthUser & { isStarosta?: string };

        expect(isStarosta(truthy)).toBe(true);
        expect(isStarosta(falsy)).toBe(false);
    });

    it("falls back to demo username", () => {
        expect(isStarosta({ ...baseUser, username: "starosta" })).toBe(true);
        expect(isStarosta({ ...baseUser, username: "STAROSTA" })).toBe(true);
    });
});
