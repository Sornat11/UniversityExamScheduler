import { getStatusCategory, getStatusLabel, type ExamTermStatus } from "../data/examStore";

type Props = {
    status: ExamTermStatus;
};

export function StatusBadge({ status }: Props) {
    const category = getStatusCategory(status);
    const label = getStatusLabel(status);
    const base = "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm";
    const iconBase =
        "inline-flex h-5 min-w-[1.5rem] items-center justify-center rounded-full px-1 text-[10px] font-bold uppercase";
    const labelBase = "min-w-0 text-xs font-medium leading-tight";

    if (category === "Zatwierdzony") {
        return (
            <span className={`${base} border-emerald-200 bg-emerald-50 text-emerald-800`}>
                <span className={`${iconBase} bg-emerald-600 text-white`}>OK</span>
                <span className={labelBase}>{label}</span>
            </span>
        );
    }
    if (category === "Odrzucony") {
        return (
            <span className={`${base} border-rose-200 bg-rose-50 text-rose-800`}>
                <span className={`${iconBase} bg-rose-600 text-white`}>X</span>
                <span className={labelBase}>{label}</span>
            </span>
        );
    }
    return (
        <span className={`${base} border-amber-200 bg-amber-50 text-amber-800`}>
            <span className={`${iconBase} bg-amber-500 text-white`}>!</span>
            <span className={labelBase}>{label}</span>
        </span>
    );
}
