import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import StudentShell from "./StudentShell";

function renderShell({
    role,
    route,
    userName = "Alice",
    onLogout = vi.fn(),
}: {
    role: string;
    route: string;
    userName?: string;
    onLogout?: () => void;
}) {
    return {
        onLogout,
        ...render(
            <MemoryRouter initialEntries={[route]}>
                <StudentShell role={role} userName={userName} onLogout={onLogout}>
                    <div>Content</div>
                </StudentShell>
            </MemoryRouter>
        ),
    };
}

describe("StudentShell", () => {
    it("renders student navigation and triggers logout", async () => {
        const user = userEvent.setup();
        const { onLogout } = renderShell({ role: "Student", route: "/app/student/profile" });

        expect(screen.getByText("Harmonogram")).toBeInTheDocument();
        expect(screen.getByText("Egzaminy")).toBeInTheDocument();
        expect(screen.queryByText("Proponowanie terminu")).not.toBeInTheDocument();
        expect(screen.queryByText("Panel dziekanatu")).not.toBeInTheDocument();

        const profileLink = screen.getByRole("link", { name: "Panel uzytkownika" });
        expect(profileLink).toHaveAttribute("href", "/app/student/profile");

        await user.click(screen.getByRole("button", { name: "Wyloguj" }));
        expect(onLogout).toHaveBeenCalledTimes(1);
    });

    it("renders dean office navigation and correct profile base", () => {
        renderShell({ role: "DeanOffice", route: "/app/deanoffice/subjects", userName: "Dziekanat" });

        expect(screen.getByText("Egzaminy")).toBeInTheDocument();
        expect(screen.getByText("Panel dziekanatu")).toBeInTheDocument();
        expect(screen.queryByText("Harmonogram")).not.toBeInTheDocument();
        expect(screen.queryByText("Proponowanie terminu")).not.toBeInTheDocument();

        const profileLink = screen.getByRole("link", { name: "Panel uzytkownika" });
        expect(profileLink).toHaveAttribute("href", "/app/deanoffice/profile");
        expect(screen.getAllByText("Dziekanat").length).toBeGreaterThan(0);
    });

    it("shows propose option for lecturer", () => {
        renderShell({ role: "Lecturer", route: "/app/lecturer/schedule" });

        expect(screen.getByText("Harmonogram")).toBeInTheDocument();
        expect(screen.getByText("Proponowanie terminu")).toBeInTheDocument();
        expect(screen.getByText("Egzaminy")).toBeInTheDocument();

        const profileLink = screen.getByRole("link", { name: "Panel uzytkownika" });
        expect(profileLink).toHaveAttribute("href", "/app/lecturer/profile");
    });
});
