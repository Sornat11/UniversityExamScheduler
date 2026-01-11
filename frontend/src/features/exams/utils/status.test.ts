import { describe, expect, it } from "vitest";
import { statusDotClass } from "./status";

describe("statusDotClass", () => {
    it("returns yellow for proposed", () => {
        expect(statusDotClass("Proponowany")).toBe("bg-yellow-200 border-yellow-300");
    });

    it("returns blue for partially approved", () => {
        expect(statusDotClass("Czesciowo zatwierdzony")).toBe("bg-blue-200 border-blue-300");
    });

    it("returns emerald for approved", () => {
        expect(statusDotClass("Zatwierdzony")).toBe("bg-emerald-200 border-emerald-300");
    });
});
