export type UserRole =
  | "ADMIN"
  | "AGENT"
  | "SUPPORT_AGENT"
  | "STAFF_MANAGER"
  | "GENERAL_DIRECTOR"
  | "END_USER";

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  userType: "INTERNAL" | "EXTERNAL";
  department?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
};
