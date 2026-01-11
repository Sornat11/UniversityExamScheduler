export type Role = "Student" | "Lecturer" | "DeanOffice" | "Admin";

export type AuthUser = {
    username: string;
    role: Role | number | string;
    isStarosta?: boolean;
    firstName?: string;
    lastName?: string;
};

export type LoginResponse = {
    accessToken: string;
    expiresAtUtc: string;
    user: AuthUser;
};
