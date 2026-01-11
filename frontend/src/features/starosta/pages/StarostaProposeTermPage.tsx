import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeTimeToSlot, proposeExamTerm } from "../../exams/data/examStore";
import { SendHorizonal } from "lucide-react";

const STAROSTA_SCOPE = {
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
    "Inzynieria oprogramowania",
];

const ROOM_OPTIONS = ["A-101", "A-102", "B-205", "C-301", "D-110"];

export default function StarostaProposeTermPage() {
    const nav = useNavigate();

    const [subject, setSubject] = useState(SUBJECT_OPTIONS[0] ?? "");
    const [room, setRoom] = useState(ROOM_OPTIONS[0] ?? "");
    const [dateISO, setDateISO] = useState(""); // yyyy-mm-dd
    const [time, setTime] = useState(""); // HH:mm
    const [error, setError] = useState<string | null>(null);

    const canSubmit = useMemo(() => {
        return Boolean(subject && room && dateISO);
    }, [subject, room, dateISO]);

    return (
        <div className="space-y-6">
            <div className="bg-white border rounded-2xl p-6 space-y-5">
                <div className="text-slate-900 font-semibold text-xl">Proponowanie terminu</div>

                {/* Przedmiot - SELECT */}
                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Przedmiot</div>
                    <select
                        className="w-full h-11 border rounded-lg px-3 bg-white"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                    >
                        {SUBJECT_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Data + Godzina */}
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
                            min="08:00"
                            max="20:00"
                            step="900"
                            onChange={(e) => setTime(normalizeTimeToSlot(e.target.value) ?? e.target.value)}
                        />
                    </label>
                </div>

                {/* Sala - SELECT */}
                <div className="space-y-1">
                    <div className="text-sm text-slate-600">Sala</div>
                    <select
                        className="w-full h-11 border rounded-lg px-3 bg-white"
                        value={room}
                        onChange={(e) => setRoom(e.target.value)}
                    >
                        {ROOM_OPTIONS.map((r) => (
                            <option key={r} value={r}>
                                {r}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                    <b>Informacja:</b> Propozycja zostanie wyslana do zatwierdzenia przez prowadzacego.
                    Po akceptacji przez obie strony termin uznany jest za zatwierdzony (bez udzialu dziekanatu).
                </div>

                {error && <div className="text-sm text-red-600">{error}</div>}

                <button
                    type="button"
                    disabled={!canSubmit}
                    className="w-full rounded-xl px-4 py-3 inline-flex items-center justify-center gap-2 text-sm font-semibold leading-none bg-emerald-600 text-white border border-emerald-700 shadow-md transition disabled:opacity-70 disabled:bg-emerald-600 disabled:text-white disabled:cursor-not-allowed hover:bg-emerald-700"
                    onClick={() => {
                        if (!canSubmit) return;
                        setError(null);
                        try {
                            proposeExamTerm({
                                title: subject,
                                dateISO,
                                time: normalizeTimeToSlot(time) || undefined,
                                room: room || undefined,

                                // dzieki temu w tabeli nie beda puste Kierunek/Typ/Rok
                                fieldOfStudy: STAROSTA_SCOPE.fieldOfStudy,
                                studyType: STAROSTA_SCOPE.studyType,
                                year: STAROSTA_SCOPE.year,
                                studentUsernames: ["student", "starosta"],
                            });

                            nav("/app/starosta/subjects", { replace: true });
                        } catch (e: unknown) {
                            const message = e instanceof Error ? e.message : "Nie udalo sie zapisac propozycji.";
                            setError(message);
                        }
                    }}
                >
                    <SendHorizonal className="w-4 h-4" />
                    Zaproponuj termin
                </button>
            </div>

            {/* Zakres uprawnien (jak w Figmie) */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <div className="text-emerald-800 font-semibold mb-3">Zakres uprawnien</div>
                <ul className="text-sm text-emerald-800 space-y-1">
                    <li>· Kierunek: <b>{STAROSTA_SCOPE.fieldOfStudy}</b></li>
                    <li>· Typ studiow: <b>{STAROSTA_SCOPE.studyType}</b></li>
                    <li>· Rok: <b>{STAROSTA_SCOPE.year}</b></li>
                </ul>
            </div>
        </div>
    );
}

