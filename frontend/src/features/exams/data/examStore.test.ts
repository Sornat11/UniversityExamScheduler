import { describe, expect, it } from "vitest";
import {
    exportExamDataToCSVString,
    getStatusCategory,
    getStatusLabel,
    getVisibleExamEvents,
    normalizeTimeToSlot,
    type ExamEvent,
} from "./examStore";

describe("normalizeTimeToSlot", () => {
    it("clamps to working hours and rounds to 15-minute slots", () => {
        expect(normalizeTimeToSlot("07:40")).toBe("08:00");
        expect(normalizeTimeToSlot("08:07")).toBe("08:00");
        expect(normalizeTimeToSlot("08:08")).toBe("08:15");
        expect(normalizeTimeToSlot("19:59")).toBe("20:00");
        expect(normalizeTimeToSlot("20:10")).toBe("20:00");
    });

    it("pads hour and returns undefined for invalid input", () => {
        expect(normalizeTimeToSlot("9:00")).toBe("09:00");
        expect(normalizeTimeToSlot("bad")).toBeUndefined();
        expect(normalizeTimeToSlot()).toBeUndefined();
    });
});

describe("status helpers", () => {
    it("maps status categories and labels", () => {
        expect(getStatusCategory("Approved")).toBe("Zatwierdzony");
        expect(getStatusCategory("Rejected")).toBe("Odrzucony");
        expect(getStatusCategory("ProposedByLecturer")).toBe("Proponowany");
        expect(getStatusLabel("Finalized")).toBe("Zatwierdzony (finalny)");
        expect(getStatusLabel("Draft")).toBe("Szkic");
        expect(getStatusLabel("Conflict")).toBe("Konflikt");
    });
});

describe("getVisibleExamEvents", () => {
    const baseEvent: ExamEvent = {
        id: "e1",
        title: "Math",
        dateISO: "2025-01-10",
        status: "Approved",
    };

    it("filters by session period when provided", () => {
        const events = [
            { ...baseEvent, id: "e1", dateISO: "2025-01-10" },
            { ...baseEvent, id: "e2", dateISO: "2025-02-02" },
        ];
        const session = { startISO: "2025-01-01", endISO: "2025-01-31" };

        expect(getVisibleExamEvents(events, null, session).map((e) => e.id)).toEqual(["e1"]);
    });

    it("filters lecturer events by username and full name", () => {
        const events = [
            { ...baseEvent, id: "e1", lecturerUsername: "alice" },
            { ...baseEvent, id: "e2", lecturerUsername: "bob" },
            { ...baseEvent, id: "e3", lecturer: "Dr Alice Smith" },
        ];
        const user = { username: "Alice", role: "Lecturer", firstName: "Alice", lastName: "Smith" };

        expect(getVisibleExamEvents(events, user, null).map((e) => e.id)).toEqual(["e1", "e3"]);
    });

    it("filters student events by username when student scope exists", () => {
        const events = [
            { ...baseEvent, id: "e1", studentUsernames: ["sara", "tom"] },
            { ...baseEvent, id: "e2", studentUsernames: ["tom"] },
        ];
        const user = { username: "Sara", role: "Student" };

        expect(getVisibleExamEvents(events, user, null).map((e) => e.id)).toEqual(["e1"]);
    });
});

describe("exportExamDataToCSVString", () => {
    it("escapes values with commas or quotes and adds flags", () => {
        const rows: ExamEvent[] = [
            {
                id: "e1",
                title: 'Math, "Intro"',
                dateISO: "2025-01-10",
                time: "09:00",
                room: "A1",
                fieldOfStudy: "CS",
                studyType: "FT",
                year: "1",
                lecturer: 'Dr "X"',
                status: "Approved",
                approvedByStarosta: true,
                approvedByLecturer: false,
                deanApproved: true,
            },
        ];

        const csv = exportExamDataToCSVString(rows);
        const [header, line] = csv.split("\n");

        expect(header).toBe(
            "Przedmiot,Kierunek,Typ,Rok,Prowadzacy,Data,Godzina,Sala,Status,StarostaOK,ProwadzacyOK,DziekanatOK"
        );
        expect(line).toContain('"Math, ""Intro"""');
        expect(line).toContain('"Dr ""X"""');
        expect(line).toContain("Zatwierdzony");
        expect(line.endsWith(",1,0,1")).toBe(true);
    });
});
