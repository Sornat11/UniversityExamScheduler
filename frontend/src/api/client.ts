import createClient from "openapi-fetch";
import type { paths } from "./schema";

export const api = createClient<paths>({
    // jeśli używasz Vite proxy, baseUrl może być pusty:
    baseUrl: "/api/Exam",
});
