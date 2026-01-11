import createClient from "openapi-fetch";
import type { paths } from "./schema";

const TOKEN_KEY = "ues_token";

export function authHeaders(): HeadersInit | undefined {
    const token = localStorage.getItem(TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

export const api = createClient<paths>({
    baseUrl: "/api",
    fetch: async (input: Request) => {
        const headers = new Headers(input.headers);
        const auth = authHeaders();
        if (auth) {
            const authHeaders = new Headers(auth);
            authHeaders.forEach((value, key) => headers.set(key, value));
        }
        const request = new Request(input, { headers });
        return fetch(request);
    },
});
