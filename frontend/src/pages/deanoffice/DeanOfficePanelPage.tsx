import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import {
    ensureExamDataLoaded,
    getExamDataSnapshot,
    subscribeExamData,
    type ExamEvent,
    deanFinalApprove,
    deanFinalReject,
    getSessionPeriodSnapshot,
    subscribeSessionPeriod,
    setSessionPeriod,
} from "../student/studentExamData";

function formatDatePL(iso: string) {
    const d = new Date(iso + "T00:00:00");
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
}

export default function DeanOfficePanelPage() {
    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [session, setSession] = useState(getSessionPeriodSnapshot());

    const [startISO, setStartISO] = useState(session?.startISO ?? "");
    const [endISO, setEndISO] = useState(session?.endISO ?? "");

    const [toast, setToast] = useState<string | null>(null);
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2500);
        return () => clearTimeout(t);
    }, [toast]);

    useEffect(() => {
        let alive = true;

        (async () => {
            await ensureExamDataLoaded();
            if (!alive) return;
            setEvents(getExamDataSnapshot());
        })();

        const unsub = subscribeExamData(() => setEvents(getExamDataSnapshot()));
        const unsubSess = subscribeSessionPeriod(() => {
            const s = getSessionPeriodSnapshot();
            setSession(s);
            setStartISO(s?.startISO ?? "");
            setEndISO(s?.endISO ?? "");
        });

        return () => {
            alive = false;
            unsub();
            unsubSess();
        };
    }, []);

    const pendingFinal = useMemo(
        () => events.filter((e) => !e.deanApproved && !!e.approvedByStarosta && !!e.approvedByLecturer),
        [events]
    );

    const finalApproved = useMemo(
        () => events.filter((e) => !!e.deanApproved),
        [events]
    );

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed top-6 right-6 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl px-4 py-3 shadow">
                    ✓ {toast}
                </div>
            )}

            {/* Ustawienia sesji */}
            <div className="bg-white border rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                    <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                    Ustawienia okresu sesji
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Data rozpoczęcia sesji</div>
                        <input className="w-full h-11 border rounded-lg px-3" type="date" value={startISO} onChange={(e) => setStartISO(e.target.value)} />
                    </label>

                    <label className="space-y-1">
                        <div className="text-sm text-slate-600">Data zakończenia sesji</div>
                        <input className="w-full h-11 border rounded-lg px-3" type="date" value={endISO} onChange={(e) => setEndISO(e.target.value)} />
                    </label>
                </div>

                <button
                    type="button"
                    className="
  inline-flex items-center gap-2
  rounded-xl px-5 py-2.5 text-base font-semibold
  bg-white text-emerald-700
  border-2 border-emerald-600
  shadow-sm
  hover:bg-emerald-50
  focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
  transition
"                    onClick={() => {
                        if (!startISO || !endISO) return;
                        setSessionPeriod(startISO, endISO);
                        setToast('Zapisano okres sesji.');
                    }}
                >
                    Zapisz okres sesji
                </button>


                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                    {session
                        ? <>Aktualna sesja: {formatDatePL(session.startISO)} - {formatDatePL(session.endISO)}</>
                        : <>Brak ustawionej sesji.</>}
                </div>
            </div>

            {/* Oczekujące na ostateczne zatwierdzenie */}
            <div className="bg-white border rounded-2xl p-6">
                <div className="text-slate-900 font-semibold mb-4">Egzaminy oczekujące na ostateczne zatwierdzenie</div>

                <div className="overflow-x-auto">
                    <table className="min-w-[920px] w-full">
                        <thead className="bg-neutral-50 border-b">
                        <tr className="text-left text-sm text-slate-600">
                            <th className="px-4 py-3 font-medium">Przedmiot</th>
                            <th className="px-4 py-3 font-medium">Kierunek</th>
                            <th className="px-4 py-3 font-medium">Typ</th>
                            <th className="px-4 py-3 font-medium">Rok</th>
                            <th className="px-4 py-3 font-medium">Data</th>
                            <th className="px-4 py-3 font-medium">Godzina</th>
                            <th className="px-4 py-3 font-medium">Sala</th>
                            <th className="px-4 py-3 font-medium text-right">Akcja</th>
                        </tr>
                        </thead>

                        <tbody>
                        {pendingFinal.length === 0 && (
                            <tr><td className="px-4 py-6 text-sm text-slate-600" colSpan={8}>Brak egzaminów do zatwierdzenia.</td></tr>
                        )}

                        {pendingFinal.map((e) => (
                            <tr key={e.id} className="border-b last:border-b-0">
                                <td className="px-4 py-4 text-sm text-slate-900">{e.title}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.fieldOfStudy ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.studyType ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.year ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{formatDatePL(e.dateISO)}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.time ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.room ?? "—"}</td>
                                <td className="px-4 py-4 text-right">
                                    <div className="inline-flex items-center gap-2">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 text-sm font-semibold"
                                            onClick={() => {
                                                deanFinalApprove(e.id);
                                                setToast("Egzamin został zatwierdzony!");
                                            }}
                                        >
                                            <Check className="w-4 h-4" /> Zatwierdź
                                        </button>

                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-semibold"
                                            onClick={() => {
                                                deanFinalReject(e.id);
                                                setToast("Egzamin został odrzucony!");
                                            }}
                                        >
                                            <X className="w-4 h-4" /> Odrzuć
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Ostatecznie zatwierdzone */}
            <div className="bg-white border rounded-2xl p-6">
                <div className="text-slate-900 font-semibold mb-4">Ostatecznie zatwierdzone egzaminy</div>

                <div className="overflow-x-auto">
                    <table className="min-w-[820px] w-full">
                        <thead className="bg-neutral-50 border-b">
                        <tr className="text-left text-sm text-slate-600">
                            <th className="px-4 py-3 font-medium">Przedmiot</th>
                            <th className="px-4 py-3 font-medium">Kierunek</th>
                            <th className="px-4 py-3 font-medium">Typ</th>
                            <th className="px-4 py-3 font-medium">Rok</th>
                            <th className="px-4 py-3 font-medium">Data</th>
                            <th className="px-4 py-3 font-medium">Godzina</th>
                            <th className="px-4 py-3 font-medium">Sala</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                        </tr>
                        </thead>

                        <tbody>
                        {finalApproved.length === 0 && (
                            <tr><td className="px-4 py-6 text-sm text-slate-600" colSpan={8}>Brak ostatecznie zatwierdzonych egzaminów.</td></tr>
                        )}

                        {finalApproved.map((e) => (
                            <tr key={e.id} className="border-b last:border-b-0">
                                <td className="px-4 py-4 text-sm text-slate-900">{e.title}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.fieldOfStudy ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.studyType ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.year ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{formatDatePL(e.dateISO)}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.time ?? "—"}</td>
                                <td className="px-4 py-4 text-sm text-slate-700">{e.room ?? "—"}</td>
                                <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-emerald-100 text-emerald-700">
                      ✓ Zatwierdzony
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Statystyki */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="bg-white border rounded-2xl p-5">
                        <div className="text-sm text-slate-600">Wszystkie egzaminy</div>
                        <div className="text-2xl font-semibold text-slate-900 mt-1">{events.length}</div>
                    </div>
                    <div className="bg-white border rounded-2xl p-5">
                        <div className="text-sm text-slate-600">Oczekujące</div>
                        <div className="text-2xl font-semibold text-slate-900 mt-1">{pendingFinal.length}</div>
                    </div>
                    <div className="bg-white border rounded-2xl p-5">
                        <div className="text-sm text-slate-600">Zatwierdzone</div>
                        <div className="text-2xl font-semibold text-slate-900 mt-1">{finalApproved.length}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
