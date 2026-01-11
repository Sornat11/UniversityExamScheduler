import { useEffect, useState } from "react";
import {
    getSessionPeriodSnapshot,
    subscribeSessionPeriod,
    type SessionPeriod,
} from "../data/examStore";

export function useSessionPeriod() {
    const [sessionPeriod, setSessionPeriod] = useState<SessionPeriod | null>(() => getSessionPeriodSnapshot());

    useEffect(() => {
        const unsub = subscribeSessionPeriod(() => setSessionPeriod(getSessionPeriodSnapshot()));
        return () => unsub();
    }, []);

    return sessionPeriod;
}
