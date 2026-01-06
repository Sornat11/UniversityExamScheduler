import { useQuery } from "@tanstack/react-query";
import { authHeaders } from "../api/client";

type ExamDto = {
    id: string;
    name: string;
    lecturerId: string;
    groupId: string;
};

export default function ExamsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["exams"],
        queryFn: async () => {
            const res = await fetch("/api/Exam", { headers: { ...(authHeaders() ?? {}) } });
            if (!res.ok) throw new Error(`Exam HTTP ${res.status}`);
            return (await res.json()) as ExamDto[];
        },
    });

    if (isLoading) return <div>Loading…</div>;
    if (error) return <div>Error: {String(error)}</div>;

    return (
        <div style={{ padding: 16 }}>
            <h1>Egzaminy</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
