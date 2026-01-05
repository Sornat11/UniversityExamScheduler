const tokenKey = "ues_token"; // jeśli masz inny, zmień

function authHeaders() {
    const token = localStorage.getItem(tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ExamTermDto = {
    id: string;
    courseId: string;      
    startAt: string;      
    room?: string; 
    status: string;
};

export type ExamDto = {
    id: string;
    name: string;        
    lecturerName?: string; 
};

export async function fetchExamTerms(): Promise<ExamTermDto[]> {
    const res = await fetch("/api/ExamTerm", { headers: { ...authHeaders() } }); // :contentReference[oaicite:2]{index=2}
    if (!res.ok) throw new Error(`ExamTerm HTTP ${res.status}`);
    return res.json();
}

export async function fetchExams(): Promise<ExamDto[]> {
    const res = await fetch("/api/Exam", { headers: { ...authHeaders() } }); // :contentReference[oaicite:3]{index=3}
    if (!res.ok) throw new Error(`Exam HTTP ${res.status}`);
    return res.json();
}
