import { useEffect, useState } from "react";
import {
    ensureExamDataLoaded,
    getExamDataSnapshot,
    subscribeExamData,
    type ExamEvent,
} from "../data/examStore";

export function useExamEvents() {
    const [events, setEvents] = useState<ExamEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let alive = true;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                await ensureExamDataLoaded();
                if (!alive) return;
                setEvents(getExamDataSnapshot());
            } catch (e: unknown) {
                if (!alive) return;
                const message = e instanceof Error ? e.message : "Blad pobierania danych";
                setError(message);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        const unsub = subscribeExamData(() => setEvents(getExamDataSnapshot()));
        return () => {
            alive = false;
            unsub();
        };
    }, []);

    return { events, loading, error };
}
