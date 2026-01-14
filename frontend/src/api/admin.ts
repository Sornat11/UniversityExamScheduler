import { authHeaders } from "./client";

export type Role = "Student" | "Lecturer" | "DeanOffice" | "Admin";

export type PagedResult<T> = {
    items: T[];
    totalCount: number;
    page: number;
    pageSize: number;
};

export type UserDto = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: Role | number;
    isStarosta: boolean;
    isActive: boolean;
    studentGroups?: UserStudentGroupDto[];
};

export type UserStudentGroupDto = {
    id: string;
    name: string;
    fieldOfStudy: string;
    studyType: "Stacjonarne" | "Niestacjonarne";
    semester: number;
};

export type ExamSessionDto = {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
};

export type ExamDto = {
    id: string;
    name: string;
    lecturerId: string;
    groupId: string;
};

export type ExamTermType = "FirstAttempt" | "Retake" | "Commission";
export type ExamTermStatus =
    | "Draft"
    | "ProposedByLecturer"
    | "ProposedByStudent"
    | "Conflict"
    | "Approved"
    | "Finalized"
    | "Rejected";

export type ExamTermDto = {
    id: string;
    courseId: string;
    sessionId: string;
    roomId?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    type: ExamTermType;
    status: ExamTermStatus;
    createdBy: string;
    rejectionReason?: string | null;
};

export type StudentGroupDto = {
    id: string;
    name: string;
    fieldOfStudy: string;
    studyType: "Stacjonarne" | "Niestacjonarne";
    semester: number;
    starostaId: string;
};

export type RoomDto = {
    id: string;
    roomNumber: string;
    capacity: number;
    type: "Lecture" | "Lab" | "Computer";
    isAvailable: boolean;
};

export async function searchUsers(params: { search?: string; page?: number; pageSize?: number }): Promise<PagedResult<UserDto>> {
    const { search, page = 1, pageSize = 20 } = params;
    const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) qs.append("search", search);

    const res = await fetch(`/api/User?${qs.toString()}`, {
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`User search HTTP ${res.status}`);
    return res.json();
}

export async function updateUser(
    id: string,
    payload: {
        email: string;
        firstName: string;
        lastName: string;
        role: Role | number;
        isActive: boolean;
        isStarosta: boolean;
        externalId?: string | null;
    }
) {
    const res = await fetch(`/api/User/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `User update HTTP ${res.status}`);
    }
    return res.json() as Promise<UserDto>;
}

export async function fetchExamSessions(): Promise<ExamSessionDto[]> {
    const res = await fetch("/api/ExamSession", { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`ExamSession HTTP ${res.status}`);
    return res.json();
}

export async function createExamSession(payload: Omit<ExamSessionDto, "id">): Promise<ExamSessionDto> {
    const res = await fetch("/api/ExamSession", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamSession create HTTP ${res.status}`);
    }
    return res.json();
}

export async function updateExamSession(id: string, payload: Omit<ExamSessionDto, "id">): Promise<ExamSessionDto> {
    const res = await fetch(`/api/ExamSession/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamSession update HTTP ${res.status}`);
    }
    return res.json();
}

export async function deleteExamSession(id: string) {
    const res = await fetch(`/api/ExamSession/${id}`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`ExamSession delete HTTP ${res.status}`);
}

export async function fetchExams(): Promise<ExamDto[]> {
    const res = await fetch("/api/Exam", { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`Exam HTTP ${res.status}`);
    return res.json();
}

export async function createExam(payload: Omit<ExamDto, "id">): Promise<ExamDto> {
    const res = await fetch("/api/Exam", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Exam create HTTP ${res.status}`);
    }
    return res.json();
}

export async function updateExam(id: string, payload: Omit<ExamDto, "id">): Promise<ExamDto> {
    const res = await fetch(`/api/Exam/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Exam update HTTP ${res.status}`);
    }
    return res.json();
}

export async function deleteExam(id: string) {
    const res = await fetch(`/api/Exam/${id}`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`Exam delete HTTP ${res.status}`);
}

export async function fetchExamTerms(courseId?: string): Promise<ExamTermDto[]> {
    const qs = courseId ? `?courseId=${encodeURIComponent(courseId)}` : "";
    const res = await fetch(`/api/ExamTerm${qs}`, { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`ExamTerm HTTP ${res.status}`);
    return res.json();
}

export async function createExamTerm(payload: Omit<ExamTermDto, "id">): Promise<ExamTermDto> {
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

export async function updateExamTerm(id: string, payload: Omit<ExamTermDto, "id">): Promise<ExamTermDto> {
    const res = await fetch(`/api/ExamTerm/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `ExamTerm update HTTP ${res.status}`);
    }
    return res.json();
}

export async function deleteExamTerm(id: string) {
    const res = await fetch(`/api/ExamTerm/${id}`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`ExamTerm delete HTTP ${res.status}`);
}

export async function fetchStudentGroups(): Promise<StudentGroupDto[]> {
    const res = await fetch("/api/StudentGroup", { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`StudentGroup HTTP ${res.status}`);
    return res.json();
}

export async function fetchRooms(): Promise<RoomDto[]> {
    const res = await fetch("/api/Room", { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`Room HTTP ${res.status}`);
    return res.json();
}
