import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export default function RoomsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["rooms"],
        queryFn: async () => {
            const res = await api.GET("/api/Exam"); 
            if (res.error) throw res.error;
            return res.data;
        },
    });

    if (isLoading) return <div>Ładowanie…</div>;
    if (error) return <div>Błąd: {String(error)}</div>;

    return (
        <div style={{ padding: 16 }}>
            <h1>Sale</h1>
            <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
    );
}
