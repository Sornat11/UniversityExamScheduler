import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ExamTermStatus } from "../data/examStore";
import { StatusBadge } from "./StatusBadge";

describe("StatusBadge", () => {
    const cases: Array<{ status: ExamTermStatus; label: string; prefix: string }> = [
        { status: "Approved", label: "Zatwierdzony", prefix: "OK" },
        { status: "ProposedByLecturer", label: "Proponowany (prowadzacy)", prefix: "!" },
        { status: "Rejected", label: "Odrzucony", prefix: "X" },
    ];

    it.each(cases)("renders label for status: $status", ({ status, label, prefix }) => {
        render(<StatusBadge status={status} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        expect(screen.getByText(prefix)).toBeInTheDocument();
    });
});
