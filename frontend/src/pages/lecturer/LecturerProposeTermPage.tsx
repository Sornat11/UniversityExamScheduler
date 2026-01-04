import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { proposeExamTerm } from "../student/studentExamData";
import { SendHorizonal } from "lucide-react";

const LECTURER_NAME = "Dr Piotr Wiśniewski";

const SCOPE = {
    fieldOfStudy: "Informatyka",
    studyType: "Stacjonarne",
    year: "3",
};

const SUBJECT_OPTIONS = [
    "Matematyka",
    "Programowanie",
    "Bazy danych",
    "Sieci komputerowe",
    "Systemy operacyjne",
    "Inżynieria oprogramowania",
];

const ROOM_OPTIONS = ["A-101", "A-100", "A-102", "B-205", "C-301"];

export default function LecturerProposeTermPage() {
    const nav = useNavigate();

    const [subject, setSubject] = useState("");
    const [dateISO, setDateISO] = useState(""); // yyyy-mm-dd
    const [time, setTime] = useState(""); // HH:mm
    const [room, setRoom] = useState("");

    const canSubmit = useMemo(() => Boolean(subject && dateISO && room), [subject, dateISO, room]);

    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 space-y-5 max-w-2xl">
                <div className="text-slate-900 font-semibold text-lg">Zaproponuj termin egzaminu</div>

                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Przedmiot</div>
                    <select
                        className="w-full h-11 border rounded-lg px-3 bg-white"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    >
                        <option value="">Wybierz przedmiot</option>
                        {SUBJECT_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Data</div>
                        <input
                            type="date"
                            className="w-full h-11 border rounded-lg px-3"
                            value={dateISO}
                            onChange={(e) => setDateISO(e.target.value)}
                        />
                    </label>

                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Godzina</div>
                        <input
                            type="time"
                            className="w-full h-11 border rounded-lg px-3"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </label>
                </div>

                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Sala</div>
                    <select className="w-full h-11 border rounded-lg px-3 bg-white" value={room} onChange={(e) => setRoom(e.target.value)}>
                        <option value="">Wybierz salę</option>
                        {ROOM_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                    <b>Informacja:</b> Propozycja zostanie wysłana do zatwierdzenia przez <b>starostę</b>.
                    Po zatwierdzeniu przez obie strony, dziekanat dokona ostatecznej akceptacji.
                </div>

                <button
                    type="button"
                    disabled={!canSubmit}
                    className="
    w-full rounded-xl px-4 py-3
    inline-flex items-center justify-center gap-2
    text-sm font-semibold leading-none
    bg-emerald-600! text-white!
    border border-emerald-700 shadow-md transition
    disabled:opacity-70! disabled:bg-emerald-600! disabled:text-white!
    disabled:cursor-not-allowed
    hover:bg-emerald-700!
  "
                
                    onClick={() => {
                        if (!canSubmit) return;

                        proposeExamTerm({
                            title: subject,
                            dateISO,
                            time: time || undefined,
                            room: room || undefined,
                            lecturer: LECTURER_NAME,

                            fieldOfStudy: SCOPE.fieldOfStudy,
                            studyType: SCOPE.studyType,
                            year: SCOPE.year,
                        });

                        nav("/app/lecturer/subjects", { replace: true });
                    }}
                >
                    <SendHorizonal className="w-4 h-4" />
                    Zaproponuj termin
                </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 max-w-2xl">
                <div className="text-emerald-800 font-semibold mb-3">Zakres uprawnień</div>
                <ul className="text-sm text-emerald-800 space-y-1">
                    <li>• Kierunek: <b>{SCOPE.fieldOfStudy}</b></li>
                    <li>• Typ studiów: <b>{SCOPE.studyType}</b></li>
                    <li>• Rok: <b>{SCOPE.year}</b></li>
                </ul>
            </div>
        </div>
    );
}
