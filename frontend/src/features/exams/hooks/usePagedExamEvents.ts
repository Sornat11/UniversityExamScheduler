import { useEffect, useMemo, useState } from "react";
import { searchExamEvents, type ExamEventDto, type ExamEventSearchParams } from "../../../api/exams";
import type { PagedResult } from "../../../api/admin";

type State = {
    data: PagedResult<ExamEventDto> | null;
    loading: boolean;
    error: string | null;
};

export function usePagedExamEvents(params: ExamEventSearchParams) {
    const [state, setState] = useState<State>({ data: null, loading: false, error: null });
    const [reloadToken, setReloadToken] = useState(0);

    const key = useMemo(() => JSON.stringify(params), [params]);

    useEffect(() => {
        let alive = true;
        setState((s) => ({ ...s, loading: true, error: null }));

        (async () => {
            try {
                const data = await searchExamEvents(params);
                if (!alive) return;
                setState({ data, loading: false, error: null });
            } catch (e: unknown) {
                if (!alive) return;
                const message = e instanceof Error ? e.message : "Blad pobierania danych";
                setState({ data: null, loading: false, error: message });
            }
        })();

        return () => {
            alive = false;
        };
    }, [key, reloadToken]);

    const refresh = () => setReloadToken((v) => v + 1);

    return { ...state, refresh };
}
