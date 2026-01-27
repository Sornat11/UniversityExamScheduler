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

function appendParam(qs: URLSearchParams, key: string, value: string | number | boolean | null | undefined) {
    if (value === undefined || value === null) return;
    if (typeof value === "string" && value.trim() === "") return;
    qs.append(key, String(value));
}

export async function searchUsers(params: {
    search?: string;
    role?: Role;
    isActive?: boolean;
    isStarosta?: boolean;
    page?: number;
    pageSize?: number;
}): Promise<PagedResult<UserDto>> {
    const { search, role, isActive, isStarosta, page = 1, pageSize = 20 } = params;
    const qs = new URLSearchParams();
    appendParam(qs, "page", page);
    appendParam(qs, "pageSize", pageSize);
    appendParam(qs, "search", search);
    appendParam(qs, "role", role);
    appendParam(qs, "isActive", isActive);
    appendParam(qs, "isStarosta", isStarosta);

    const res = await fetch(`/api/User?${qs.toString()}`, {
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`User search HTTP ${res.status}`);
    return res.json();
}

export async function createUser(payload: {
    email: string;
    firstName: string;
    lastName: string;
    role: Role | number;
    isActive: boolean;
    isStarosta: boolean;
    externalId?: string | null;
}): Promise<UserDto> {
    const res = await fetch("/api/User", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `User create HTTP ${res.status}`);
    }
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

export async function deleteUser(id: string) {
    const res = await fetch(`/api/User/${id}`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`User delete HTTP ${res.status}`);
}

export async function fetchExamSessions(): Promise<ExamSessionDto[]> {
    const res = await fetch("/api/ExamSession", { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`ExamSession HTTP ${res.status}`);
    return res.json();
}

export async function searchExamSessions(params: {
    search?: string;
    isActive?: boolean;
    startFrom?: string;
    startTo?: string;
    endFrom?: string;
    endTo?: string;
    page?: number;
    pageSize?: number;
}): Promise<PagedResult<ExamSessionDto>> {
    const { search, isActive, startFrom, startTo, endFrom, endTo, page = 1, pageSize = 20 } = params;
    const qs = new URLSearchParams();
    appendParam(qs, "page", page);
    appendParam(qs, "pageSize", pageSize);
    appendParam(qs, "search", search);
    appendParam(qs, "isActive", isActive);
    appendParam(qs, "startFrom", startFrom);
    appendParam(qs, "startTo", startTo);
    appendParam(qs, "endFrom", endFrom);
    appendParam(qs, "endTo", endTo);

    const res = await fetch(`/api/ExamSession?${qs.toString()}`, {
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`ExamSession search HTTP ${res.status}`);
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

export async function searchExams(params: {
    search?: string;
    lecturerId?: string;
    groupId?: string;
    page?: number;
    pageSize?: number;
}): Promise<PagedResult<ExamDto>> {
    const { search, lecturerId, groupId, page = 1, pageSize = 20 } = params;
    const qs = new URLSearchParams();
    appendParam(qs, "page", page);
    appendParam(qs, "pageSize", pageSize);
    appendParam(qs, "search", search);
    appendParam(qs, "lecturerId", lecturerId);
    appendParam(qs, "groupId", groupId);

    const res = await fetch(`/api/Exam?${qs.toString()}`, {
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`Exam search HTTP ${res.status}`);
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

export async function searchStudentGroups(params: {
    name?: string;
    search?: string;
    fieldOfStudy?: string;
    studyType?: StudentGroupDto["studyType"];
    semester?: number;
    starostaId?: string;
    page?: number;
    pageSize?: number;
}): Promise<PagedResult<StudentGroupDto>> {
    const { name, search, fieldOfStudy, studyType, semester, starostaId, page = 1, pageSize = 20 } = params;
    const qs = new URLSearchParams();
    appendParam(qs, "page", page);
    appendParam(qs, "pageSize", pageSize);
    appendParam(qs, "name", name);
    appendParam(qs, "search", search);
    appendParam(qs, "fieldOfStudy", fieldOfStudy);
    appendParam(qs, "studyType", studyType);
    appendParam(qs, "semester", semester);
    appendParam(qs, "starostaId", starostaId);

    const res = await fetch(`/api/StudentGroup?${qs.toString()}`, {
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`StudentGroup search HTTP ${res.status}`);
    return res.json();
}

export async function createStudentGroup(payload: Omit<StudentGroupDto, "id">): Promise<StudentGroupDto> {
    const res = await fetch("/api/StudentGroup", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `StudentGroup create HTTP ${res.status}`);
    }
    return res.json();
}

export async function updateStudentGroup(id: string, payload: Omit<StudentGroupDto, "id">): Promise<StudentGroupDto> {
    const res = await fetch(`/api/StudentGroup/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `StudentGroup update HTTP ${res.status}`);
    }
    return res.json();
}

export async function deleteStudentGroup(id: string) {
    const res = await fetch(`/api/StudentGroup/${id}`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`StudentGroup delete HTTP ${res.status}`);
}

export async function fetchRooms(): Promise<RoomDto[]> {
    const res = await fetch("/api/Room", { headers: { ...(authHeaders() ?? {}) } });
    if (!res.ok) throw new Error(`Room HTTP ${res.status}`);
    return res.json();
}

export async function searchRooms(params: {
    search?: string;
    roomNumber?: string;
    type?: RoomDto["type"];
    isAvailable?: boolean;
    minCapacity?: number;
    maxCapacity?: number;
    page?: number;
    pageSize?: number;
}): Promise<PagedResult<RoomDto>> {
    const { search, roomNumber, type, isAvailable, minCapacity, maxCapacity, page = 1, pageSize = 20 } = params;
    const qs = new URLSearchParams();
    appendParam(qs, "page", page);
    appendParam(qs, "pageSize", pageSize);
    appendParam(qs, "search", search);
    appendParam(qs, "roomNumber", roomNumber);
    appendParam(qs, "type", type);
    appendParam(qs, "isAvailable", isAvailable);
    appendParam(qs, "minCapacity", minCapacity);
    appendParam(qs, "maxCapacity", maxCapacity);

    const res = await fetch(`/api/Room?${qs.toString()}`, {
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`Room search HTTP ${res.status}`);
    return res.json();
}

export async function createRoom(payload: Omit<RoomDto, "id">): Promise<RoomDto> {
    const res = await fetch("/api/Room", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Room create HTTP ${res.status}`);
    }
    return res.json();
}

export async function updateRoom(id: string, payload: Omit<RoomDto, "id">): Promise<RoomDto> {
    const res = await fetch(`/api/Room/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeaders() ?? {}) },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Room update HTTP ${res.status}`);
    }
    return res.json();
}

export async function deleteRoom(id: string) {
    const res = await fetch(`/api/Room/${id}`, {
        method: "DELETE",
        headers: { ...(authHeaders() ?? {}) },
    });
    if (!res.ok) throw new Error(`Room delete HTTP ${res.status}`);
}
