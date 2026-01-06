const tokenKey = "ues_token";

function authHeaders() {
    const token = localStorage.getItem(tokenKey);
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export type ExamTermDto = {
    id: string;
    courseId: string;
    sessionId: string;
    roomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: string;
    createdBy: string;
    rejectionReason?: string;
};

export type ExamDto = {
    id: string;
    name: string;
    lecturerId: string;
    groupId: string;
};

export async function fetchExamTerms(courseId?: string): Promise<ExamTermDto[]> {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    const res = await fetch(`/api/ExamTerm${qs}`, { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`ExamTerm HTTP ${res.status}`);
    return res.json();
}

export async function fetchExams(): Promise<ExamDto[]> {
    const res = await fetch("/api/Exam", { headers: { ...authHeaders() } });
    if (!res.ok) throw new Error(`Exam HTTP ${res.status}`);
    return res.json();
}
