export function formatTimeRange(start?: string | null, end?: string | null, fallback = "-") {
    const startValue = typeof start === "string" ? start.trim() : "";
    const endValue = typeof end === "string" ? end.trim() : "";

    if (startValue && endValue) return `${startValue} - ${endValue}`;
    if (startValue) return startValue;
    if (endValue) return endValue;
    return fallback;
}
