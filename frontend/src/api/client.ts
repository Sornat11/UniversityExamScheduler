import createClient from "openapi-fetch";
import type { paths } from "./schema";

const TOKEN_KEY = "ues_token";

export function authHeaders() {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export const api = createClient<paths>({
    baseUrl: "/api",
    fetch: async (url, options) => {
        const headers = { ...(options?.headers ?? {}), ...(authHeaders() ?? {}) };
        return fetch(url, { ...options, headers });
    },
});
