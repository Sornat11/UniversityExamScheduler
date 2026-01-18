import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ScheduleToolbar } from "./ScheduleToolbar";

describe("ScheduleToolbar", () => {
    it("fires navigation, mode, and export actions", async () => {
        const user = userEvent.setup();
        const onPrev = vi.fn();
        const onNext = vi.fn();
        const onModeChange = vi.fn();
        const onExport = vi.fn();

        render(
            <ScheduleToolbar
                mode="month"
                label="January 2025"
                onPrev={onPrev}
                onNext={onNext}
                onModeChange={onModeChange}
                onExport={onExport}
            />
        );

        expect(screen.getByText("January 2025")).toBeInTheDocument();

        await user.click(screen.getByTitle("Poprzedni"));
        await user.click(screen.getByTitle("Nastepny"));
        await user.click(screen.getByRole("button", { name: "Tydzien" }));
        await user.click(screen.getByRole("button", { name: "Miesiac" }));
        await user.click(screen.getByRole("button", { name: "Eksportuj" }));

        expect(onPrev).toHaveBeenCalledTimes(1);
        expect(onNext).toHaveBeenCalledTimes(1);
        expect(onModeChange).toHaveBeenNthCalledWith(1, "week");
        expect(onModeChange).toHaveBeenNthCalledWith(2, "month");
        expect(onExport).toHaveBeenCalledTimes(1);
    });
});
