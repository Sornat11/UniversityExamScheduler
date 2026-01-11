import { format } from "date-fns";
import { pl } from "date-fns/locale";
import type { SessionPeriod } from "../../../exams/data/examStore";

function LegendItem({ label, dotClass }: { label: string; dotClass: string }) {
    return (
        <div className="flex items-center gap-2 text-sm text-slate-600">
            <span className={`w-3 h-3 rounded border ${dotClass}`} />
            {label}
        </div>
    );
}

type Props = {
    sessionPeriod: SessionPeriod | null;
};

export function ScheduleLegend({ sessionPeriod }: Props) {
    return (
        <div className="bg-white border rounded-2xl p-4">
            <div className="flex items-center gap-4">
                <div className="text-sm text-slate-600">Legenda:</div>
                <LegendItem label="Proponowany" dotClass="bg-yellow-200 border-yellow-300" />
                <LegendItem label="Czesciowo zatwierdzony" dotClass="bg-blue-200 border-blue-300" />
                <LegendItem label="Zatwierdzony" dotClass="bg-emerald-200 border-emerald-300" />
                {sessionPeriod && (
                    <LegendItem
                        label={`Okres sesji ${format(new Date(sessionPeriod.startISO + "T00:00:00"), "d.MM", { locale: pl })} - ${format(new Date(sessionPeriod.endISO + "T00:00:00"), "d.MM", { locale: pl })}`}
                        dotClass="bg-amber-100 border-amber-300"
                    />
                )}
            </div>
        </div>
    );
}

