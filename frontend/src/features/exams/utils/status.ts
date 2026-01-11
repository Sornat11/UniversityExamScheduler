import type { ExamStatus } from "../data/examStore";

export function statusDotClass(status: ExamStatus) {
    if (status === "Proponowany") return "bg-yellow-200 border-yellow-300";
    if (status === "Czesciowo zatwierdzony") return "bg-blue-200 border-blue-300";
    return "bg-emerald-200 border-emerald-300";
}

