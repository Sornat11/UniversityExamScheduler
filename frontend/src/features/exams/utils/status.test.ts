import { describe, expect, it } from "vitest";
import { statusDotClass } from "./status";

describe("statusDotClass", () => {
    it("returns yellow for proposed", () => {
        expect(statusDotClass("ProposedByLecturer")).toBe("bg-yellow-200 border-yellow-300");
    });

    it("returns emerald for approved", () => {
        expect(statusDotClass("Approved")).toBe("bg-emerald-200 border-emerald-300");
    });

    it("returns red for rejected", () => {
        expect(statusDotClass("Rejected")).toBe("bg-red-200 border-red-300");
    });
});
