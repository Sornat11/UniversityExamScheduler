import { getStatusCategory, type ExamTermStatus } from "../data/examStore";

export function statusDotClass(status: ExamTermStatus) {
    const category = getStatusCategory(status);
    if (category === "Proponowany") return "bg-yellow-200 border-yellow-300";
    if (category === "Odrzucony") return "bg-red-200 border-red-300";
    return "bg-emerald-200 border-emerald-300";
}
