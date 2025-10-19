export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem("accessToken") ||
    window.localStorage.getItem("jwt") ||
    window.localStorage.getItem("token") ||
    null
  );
}

export type ApiFetchOptions = {
  adminOverride?: boolean;
};

export function apiFetch(input: string, init: RequestInit = {}, opts: ApiFetchOptions = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (opts.adminOverride) headers.set('x-admin', '1');
  return fetch(input, { ...init, headers, credentials: init.credentials ?? "include", cache: init.cache ?? "no-store" });
}

// Backward-compatible helper name
export function apiFetchLocal(input: string, init: RequestInit = {}): Promise<Response> {
  return apiFetch(input, init);
}
