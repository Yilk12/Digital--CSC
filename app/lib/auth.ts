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

function readToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token") ||
    null
  );
}

export function decodeJwt(token: string): DecodedJwt | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = typeof window !== "undefined" ? atob(payload) : Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string | null {
  const token = readToken();
  if (!token) return null;
  const decoded = decodeJwt(token);
  if (!decoded) return null;
  // Prefer explicit fields, fallback to subject
  return (decoded.id as string) || (decoded.userId as string) || (decoded.sub as string) || null;
}

export type UserRole =
  | "employee"
  | "department_head"
  | "manager"
  | "gm"
  | "admin"
  | "finance"
  | "hr"
  | "ads_admin"
  | "ads_editor"
  | "ads_viewer";

function normalizeRoleString(r: string): UserRole | null {
  const s = r.toLowerCase();
  if (/(^|\W)(employee)(\W|$)/.test(s)) return "employee";
  if (/(^|\W)(dept|department[_-]?head|head)(\W|$)/.test(s)) return "department_head";
  if (/(^|\W)(manager)(\W|$)/.test(s)) return "manager";
  if (/(^|\W)(gm|general[_-]?manager)(\W|$)/.test(s)) return "gm";
  if (/(^|\W)(admin|administrator)(\W|$)/.test(s)) return "admin";
  if (/(^|\W)(finance|finance[_-]?dept|finance[_-]?department)(\W|$)/.test(s)) return "finance";
  if (/(^|\W)(hr|human[_-]?resources)(\W|$)/.test(s)) return "hr";
  if (/(^|\W)(ads[_-]?admin|advert(isement)?s?[_-]?admin|communications[_-]?admin)(\W|$)/.test(s)) return "ads_admin";
  if (/(^|\W)(ads[_-]?editor|advert(isement)?s?[_-]?editor|content[_-]?editor|communications)(\W|$)/.test(s)) return "ads_editor";
  if (/(^|\W)(ads[_-]?viewer|advert(isement)?s?[_-]?viewer)(\W|$)/.test(s)) return "ads_viewer";
  return null;
}

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
    const m = normalizeRoleString(String(c));
    if (m) mapped.add(m);
  }

  // Default to employee if nothing is present
  return mapped.size ? Array.from(mapped) : ["employee"];
}

export function getCurrentUserPrimaryRole(): UserRole {
  const all = getCurrentUserRoles();
  // Priority: admin > gm > manager > department_head > employee
  // Include finance as same level as manager by default
  if (all.includes("admin")) return "admin";
  if (all.includes("gm")) return "gm";
  if (all.includes("manager")) return "manager";
  if (all.includes("finance")) return "finance";
  if (all.includes("department_head")) return "department_head";
  return "employee";
}

// Clear all known auth tokens from storage
export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem("accessToken");
    window.localStorage.removeItem("jwt");
    window.localStorage.removeItem("token");
  } catch {
    // ignore
  }
}

// Sign out and return to /chat; guest session will be created automatically by chat page
export function signOut(redirectTo: string = "/chat") {
  if (typeof window === "undefined") return;
  clearAuthTokens();
  // Notify other tabs
  try { window.localStorage.setItem("auth:signout", String(Date.now())); } catch {}
  // Redirect to trigger guest bootstrap
  window.location.href = redirectTo;
}
