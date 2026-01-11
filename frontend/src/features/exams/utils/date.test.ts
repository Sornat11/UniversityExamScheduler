import { describe, expect, it } from "vitest";
import { formatDatePLFromISO } from "./date";

describe("formatDatePLFromISO", () => {
    it("formats ISO date into dd.mm.yyyy", () => {
        expect(formatDatePLFromISO("2025-01-09")).toBe("09.01.2025");
    });

    it("keeps double-digit day and month", () => {
        expect(formatDatePLFromISO("2025-12-31")).toBe("31.12.2025");
    });
});
