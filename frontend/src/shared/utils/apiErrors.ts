type ApiProblemDetails = {
    title?: unknown;
    detail?: unknown;
    message?: unknown;
    errors?: Record<string, unknown>;
};

const ERROR_TRANSLATIONS: Record<string, string> = {
    "Exam term date cannot be in the past.": "Data terminu nie moze byc w przeszlosci.",
    "Exam term date must be within the exam session range.": "Data terminu musi miescic sie w zakresie sesji.",
    "Start time must be before end time.": "Godzina rozpoczecia musi byc przed godzina zakonczenia.",
    "Exam term conflicts with existing schedule.": "Wybrany termin koliduje z istniejacym terminem.",
    "Exam term conflicts with existing schedule (room).": "Wybrany termin koliduje z sala.",
    "Exam term conflicts with existing schedule (group).": "Wybrany termin koliduje z grupa.",
    "Exam term conflicts with existing schedule (lecturer).": "Wybrany termin koliduje z prowadzacym.",
    "Exam term conflicts with existing schedule (room, group).": "Wybrany termin koliduje z sala i grupa.",
    "Exam term conflicts with existing schedule (room, lecturer).": "Wybrany termin koliduje z sala i prowadzacym.",
    "Exam term conflicts with existing schedule (group, lecturer).": "Wybrany termin koliduje z grupa i prowadzacym.",
    "Exam term conflicts with existing schedule (room, group, lecturer).": "Wybrany termin koliduje z sala, grupa i prowadzacym.",
    "Exam duration must be 90 minutes.": "Egzamin musi trwac 1.5 godziny.",
};

function coerceString(value: unknown): string | null {
    return typeof value === "string" && value.trim() ? value.trim() : null;
}

function translateMessage(message: string): string {
    return ERROR_TRANSLATIONS[message] ?? message;
}

function extractErrorMessage(raw: string): string | null {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("<")) return null;

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            const parsed: unknown = JSON.parse(trimmed);
            if (typeof parsed === "string") return parsed;
            if (Array.isArray(parsed)) {
                for (const item of parsed) {
                    const asString = coerceString(item);
                    if (asString) return asString;
                }
            }
            if (parsed && typeof parsed === "object") {
                const payload = parsed as ApiProblemDetails;
                const detail = coerceString(payload.detail);
                if (detail) return detail;
                const message = coerceString(payload.message);
                if (message) return message;
                const errors = payload.errors;
                if (errors && typeof errors === "object") {
                    for (const value of Object.values(errors)) {
                        if (Array.isArray(value)) {
                            for (const item of value) {
                                const asString = coerceString(item);
                                if (asString) return asString;
                            }
                        } else {
                            const asString = coerceString(value);
                            if (asString) return asString;
                        }
                    }
                }
                const title = coerceString(payload.title);
                if (title) return title;
            }
        } catch {
            // Fall through to raw message.
        }
    }

    return trimmed;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error) {
        const extracted = extractErrorMessage(error.message);
        return translateMessage(extracted ?? fallback);
    }
    if (typeof error === "string") {
        const extracted = extractErrorMessage(error);
        return translateMessage(extracted ?? fallback);
    }
    return fallback;
}
