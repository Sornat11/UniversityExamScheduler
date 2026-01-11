import type { ExamStatus } from "../data/examStore";

type Props = {
    status: ExamStatus;
};

export function StatusBadge({ status }: Props) {
    if (status === "Zatwierdzony") {
        return (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                OK Zatwierdzony
            </span>
        );
    }
    if (status === "Czesciowo zatwierdzony") {
        return (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700">
                Czesciowo zatwierdzony
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-700">
            ! Proponowany
        </span>
    );
}

