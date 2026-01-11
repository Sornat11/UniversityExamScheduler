import { Download, ChevronLeft, ChevronRight } from "lucide-react";

type Props = {
    mode: "month" | "week";
    label: string;
    onPrev: () => void;
    onNext: () => void;
    onModeChange: (mode: "month" | "week") => void;
    onExport: () => void;
};

export function ScheduleToolbar({ mode, label, onPrev, onNext, onModeChange, onExport }: Props) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <button
                    className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center"
                    onClick={onPrev}
                    type="button"
                    title="Poprzedni"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-700" />
                </button>

                <div className="min-w-40 text-center font-medium text-slate-800">{label}</div>

                <button
                    className="w-9 h-9 rounded-full hover:bg-neutral-100 flex items-center justify-center"
                    onClick={onNext}
                    type="button"
                    title="Nastepny"
                >
                    <ChevronRight className="w-5 h-5 text-slate-700" />
                </button>
            </div>

            <div className="flex items-center gap-3">
                <div className="inline-flex rounded-xl border bg-white p-1">
                    <button
                        type="button"
                        onClick={() => onModeChange("month")}
                        className={`px-4 py-2 rounded-lg text-sm transition ${
                            mode === "month" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-700"
                        }`}
                    >
                        Miesiac
                    </button>
                    <button
                        type="button"
                        onClick={() => onModeChange("week")}
                        className={`px-4 py-2 rounded-lg text-sm transition ${
                            mode === "week" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "text-slate-700"
                        }`}
                    >
                        Tydzien
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onExport}
                    className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-base font-semibold bg-white text-emerald-700 border-2 border-emerald-600 shadow-sm hover:bg-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 transition"
                >
                    <Download className="w-4 h-4" />
                    Eksportuj
                </button>
            </div>
        </div>
    );
}
