// auth.ts
export type DecodedJwt = {
  sub?: string;
  id?: string;
  userId?: string;
  role?: string | string[];
  roles?: string[] | { name?: string }[];
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
  [key: string]: any;
};

// Frontend normalized user roles
export type UserRole =
  | "employee"
  | "department_head"
  | "manager"
  | "commissioner"
  | "admin"
  | "finance"
  | "ads_admin"
  | "ads_editor"
  | "ads_viewer"
  | "driver"
  | "maintenance_team"
  | "women_social_inclusion"
  | "ethics_anti_corruption";

// Backend roles enum
export enum BackendUserRole {
  ADMIN = "ADMIN",
  SUPPORT_AGENT = "SUPPORT_AGENT",
  Department_Head = "Department_Head",
  Commissioner = "Commissioner",
  END_USER = "END_USER",
  Driver = "Driver",
  Maintenance_Team = "Maintenance_Team",
  // Some databases/tokens may contain a misspelling; support both just in case
  Maintenace_Team = "Maintenace_Team",
  Finance_Department = "Finance_Department",
  Announcement_Creator = "Announcement_Creator",
  Fleet_Manager = "Fleet_Manager",
  Team_Leader = "Team_Leader",
   Women_Social_Inclusion = "Women_Social_Inclusion",
   Ethics_Anti_Corruption = "Ethics_Anti_Corruption",
}

// Map backend roles to frontend normalized roles
const backendToFrontendRoleMap: Record<BackendUserRole, UserRole> = {
  [BackendUserRole.ADMIN]: "admin",
  [BackendUserRole.SUPPORT_AGENT]: "employee",
  [BackendUserRole.Department_Head]: "department_head",
  [BackendUserRole.Commissioner]: "commissioner",
  [BackendUserRole.END_USER]: "employee",
  [BackendUserRole.Driver]: "driver",
  [BackendUserRole.Maintenance_Team]: "maintenance_team",
  [BackendUserRole.Maintenace_Team]: "maintenance_team",
  [BackendUserRole.Finance_Department]: "finance",
  [BackendUserRole.Announcement_Creator]: "ads_editor",
  [BackendUserRole.Fleet_Manager]: "manager",
  [BackendUserRole.Team_Leader]: "manager",
  [BackendUserRole.Women_Social_Inclusion]: "women_social_inclusion",
  [BackendUserRole.Ethics_Anti_Corruption]: "ethics_anti_corruption",
};

// Read token from browser storage
function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token") ||
    null
  );
}

// Decode JWT
export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof window !== "undefined"
        ? atob(payload)
        : Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Normalize backend role string
function normalizeBackendRole(role: string): UserRole | null {
  if (!role) return null;
  const key = role as BackendUserRole;
  return backendToFrontendRoleMap[key] || null;
}

// Normalize legacy role strings
function normalizeRoleString(r: string): UserRole | null {
  const s = r.toLowerCase();
  if (/(^|\W)(employee)(\W|$)/.test(s)) return "employee";
  if (/(^|\W)(dept|department[_-]?head|head)(\W|$)/.test(s)) return "department_head";
  if (/(^|\W)(manager)(\W|$)/.test(s)) return "manager";
  if (/(^|\W)(team[_-]?lead(er)?)(\W|$)/.test(s)) return "manager";
  if (/(^|\W)(gm|general[_-]?manager)(\W|$)/.test(s)) return "commissioner";
  if (/(^|\W)(admin|administrator)(\W|$)/.test(s)) return "admin";
  if (/(^|\W)(finance|finance[_-]?dept|finance[_-]?department)(\W|$)/.test(s)) return "finance";
  if (/(^|\W)(women[_-]?social[_-]?inclusion|women\s+social\s+inclusion)(\W|$)/.test(s)) return "women_social_inclusion";
  if (/(^|\W)(ethics|anti[_-]?corruption|ethics\s*&?\s*anti[- ]corruption)(\W|$)/.test(s)) return "ethics_anti_corruption";
  if (/(^|\W)(ads[_-]?admin|advert(isement)?s?[_-]?admin|communications[_-]?admin)(\W|$)/.test(s))
    return "ads_admin";
  if (/(^|\W)(ads[_-]?editor|advert(isement)?s?[_-]?editor|content[_-]?editor|communications)(\W|$)/.test(s))
    return "ads_editor";
  if (/(^|\W)(ads[_-]?viewer|advert(isement)?s?[_-]?viewer)(\W|$)/.test(s)) return "ads_viewer";
  // Maintenance team (handle common spellings and formats)
  if (/(^|\W)mainten(a|e)nance[_-]?team(\W|$)/.test(s)) return "maintenance_team";
  return null;
}

// Get all user roles from token
export function getCurrentUserRoles(): UserRole[] {
  const token = readToken();
  if (!token) return [];
  const decoded = decodeJwt(token);
  if (!decoded) return [];

  const candidates: string[] = [];

  if (typeof decoded.role === "string") candidates.push(decoded.role);
  if (Array.isArray(decoded.role)) candidates.push(...decoded.role);

  if (Array.isArray(decoded.roles)) {
    for (const r of decoded.roles) {
      if (typeof r === "string") candidates.push(r);
      else if (r && typeof r.name === "string") candidates.push(r.name);
    }
  }

  if (decoded.realm_access?.roles) candidates.push(...decoded.realm_access.roles);
  if (decoded.resource_access) {
    for (const v of Object.values(decoded.resource_access)) {
      if (Array.isArray(v?.roles)) candidates.push(...v.roles);
    }
  }

  const mapped = new Set<UserRole>();
  for (const c of candidates) {
    const frontendRole = normalizeRoleString(String(c)) || normalizeBackendRole(String(c));
    if (frontendRole) mapped.add(frontendRole);
  }

  return mapped.size ? Array.from(mapped) : ["employee"];
}

// Get primary role (highest priority)
export function getCurrentUserPrimaryRole(): UserRole {
  const all = getCurrentUserRoles();
  if (all.includes("admin")) return "admin";
  if (all.includes("commissioner")) return "commissioner";
  if (all.includes("manager")) return "manager";
  if (all.includes("finance")) return "finance";
  // Ethics & Anti-Corruption: treat as a high-priority oversight role
  if (all.includes("ethics_anti_corruption")) return "ethics_anti_corruption";
  // Treat women_social_inclusion like a specialized department head role.
  if (all.includes("women_social_inclusion")) return "women_social_inclusion";
  if (all.includes("department_head")) return "department_head";
  if (all.includes("driver")) return "driver";
  if (all.includes("maintenance_team")) return "maintenance_team";
  return "employee";
}

// Get current user ID
export function getCurrentUserId(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return (decoded.id as string) || (decoded.userId as string) || (decoded.sub as string) || null;
}

export function getCurrentUserEmail(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  return (decoded.email as string) || (decoded.preferred_username as string) || null;
}

// Clear tokens
export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("jwt");
    window.localStorage.removeItem("token");
  } catch {}
}

// Sign out
export function signOut(redirectTo: string = "/chat") {
  if (typeof window === "undefined") return;
  clearAuthTokens();
  try {
    window.localStorage.setItem("auth:signout", String(Date.now()));
  } catch {}
  window.location.href = redirectTo;
}