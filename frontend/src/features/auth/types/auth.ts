export type Role = "Student" | "Lecturer" | "DeanOffice" | "Admin";
export type StudyType = "Stacjonarne" | "Niestacjonarne";

export type AuthStudentGroup = {
    id: string;
    name: string;
    fieldOfStudy: string;
    studyType: StudyType;
    semester: number;
};

export type AuthUser = {
    username: string;
    role: Role | number | string;
    isStarosta?: boolean;
    firstName?: string;
    lastName?: string;
    email?: string;
    isActive?: boolean;
    studentGroups?: AuthStudentGroup[];
};

export type LoginResponse = {
    accessToken: string;
    expiresAtUtc: string;
    user: AuthUser;
};
