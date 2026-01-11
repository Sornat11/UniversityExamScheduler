import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ExamStatus } from "../data/examStore";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
    const cases: Array<{ status: ExamStatus; label: string }> = [
        { status: "Zatwierdzony", label: "OK Zatwierdzony" },
        { status: "Czesciowo zatwierdzony", label: "Czesciowo zatwierdzony" },
        { status: "Proponowany", label: "! Proponowany" },
    ];

    it.each(cases)("renders label for status: $status", ({ status, label }) => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
    });
});
