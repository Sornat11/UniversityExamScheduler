import { authHeaders } from "./client";
import type { ExamTermStatus, PagedResult } from "./admin";

export type ExamTermDto = {
    id: string;
    courseId: string;
    sessionId: string;
    roomId?: string;
    date: string;
    startTime: string;
    endTime: string;
    type: string;
    status: ExamTermStatus;
    createdBy: string;
    rejectionReason?: string;
};

export type ExamDto = {
    id: string;
    name: string;
    lecturerId: string;
    groupId: string;
};

export type ExamTermType = "FirstAttempt" | "Retake" | "Commission";

export type CreateExamTermPayload = {
    courseId: string;
    sessionId: string;
    roomId?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    type: ExamTermType;
    status?: string;
    createdBy?: string;
    rejectionReason?: string | null;
};

export type ExamEventDto = {
    id: string;
    courseId?: string;
    sessionId?: string;
    roomId?: string | null;
    type?: ExamTermType;
    title: string;
    dateISO: string;
    time?: string;
    endTime?: string;
    room?: string;
    lecturer?: string;
    fieldOfStudy?: string;
    studyType?: string;
    year?: string;
    groupId?: string;
    groupName?: string;
    status: ExamTermStatus;
};

export type ExamEventSearchParams = {
    search?: string;
    courseId?: string;
    sessionId?: string;
    roomId?: string;
    status?: ExamTermStatus;
    type?: ExamTermType;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    pageSize?: number;
};

function appendParam(qs: URLSearchParams, key: string, value: string | number | boolean | null | undefined) {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    qs.append(key, String(value));
}

export type UpdateExamTermPayload = {
    sessionId: string;
    roomId?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    type: ExamTermType;
};

export async function fetchExamTerms(courseId?: string): Promise<ExamTermDto[]> {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    const res = await fetch(`/api/ExamTerm${qs}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`ExamTerm HTTP ${res.status}`);
    return res.json();
}

export async function fetchExams(): Promise<ExamDto[]> {
    const res = await fetch("/api/Exam", { headers: authHeaders() });
    if (!res.ok) throw new Error(`Exam HTTP ${res.status}`);
    return res.json();
}

export async function createExamTerm(payload: CreateExamTermPayload): Promise<ExamTermDto> {
    const res = await fetch("/api/ExamTerm", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm create HTTP ${res.status}`);
    }
    return res.json();
}

export async function approveExamTermByStarosta(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/approve-by-starosta`, {
        method: "POST",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm approve HTTP ${res.status}`);
    }
}

export async function rejectExamTermByStarosta(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/reject-by-starosta`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify({}),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm reject HTTP ${res.status}`);
    }
}

export async function approveExamTermByLecturer(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/approve-by-lecturer`, {
        method: "POST",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm approve HTTP ${res.status}`);
    }
}

export async function rejectExamTermByLecturer(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/reject-by-lecturer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify({}),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm reject HTTP ${res.status}`);
    }
}

export async function updateExamTermByLecturer(id: string, payload: UpdateExamTermPayload): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/edit-by-lecturer`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm update HTTP ${res.status}`);
    }
}

export async function updateExamTermByStarosta(id: string, payload: UpdateExamTermPayload): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/edit-by-starosta`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm update HTTP ${res.status}`);
    }
}

export async function deleteExamTermByLecturer(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/delete-by-lecturer`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm delete HTTP ${res.status}`);
    }
}

export async function deleteExamTermByStarosta(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/delete-by-starosta`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm delete HTTP ${res.status}`);
    }
}

export async function finalApproveExamTerm(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/final-approve`, {
        method: "POST",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm final approve HTTP ${res.status}`);
    }
}

export async function finalRejectExamTerm(id: string): Promise<void> {
    const res = await fetch(`/api/ExamTerm/${id}/final-reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify({}),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm final reject HTTP ${res.status}`);
    }
}

export async function fetchExamEvents(): Promise<ExamEventDto[]> {
    const res = await fetch("/api/exam-events", { headers: authHeaders() });
    if (!res.ok) throw new Error(`ExamEvents HTTP ${res.status}`);
    return res.json();
}

export async function searchExamEvents(params: ExamEventSearchParams): Promise<PagedResult<ExamEventDto>> {
    const {
        search,
        courseId,
        sessionId,
        roomId,
        status,
        type,
        dateFrom,
        dateTo,
        page = 1,
        pageSize = 20,
    } = params;
    const qs = new URLSearchParams();
    appendParam(qs, "page", page);
    appendParam(qs, "pageSize", pageSize);
    appendParam(qs, "search", search);
    appendParam(qs, "courseId", courseId);
    appendParam(qs, "sessionId", sessionId);
    appendParam(qs, "roomId", roomId);
    appendParam(qs, "status", status);
    appendParam(qs, "type", type);
    appendParam(qs, "dateFrom", dateFrom);
    appendParam(qs, "dateTo", dateTo);

    const res = await fetch(`/api/exam-events?${qs.toString()}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`ExamEvents search HTTP ${res.status}`);
    return res.json();
}
