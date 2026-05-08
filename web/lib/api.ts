/**
 * Normalize NEXT_PUBLIC_API_BASE into either a usable absolute origin or null.
 * - Falsy / empty / whitespace -> null (no API configured)
 * - In the browser, a value without a protocol that doesn't start with "/" is
 *   treated as misconfigured (would otherwise resolve against the current
 *   Vercel origin and 404 every request).
 */
function resolveApiBase(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE;
  if (!raw) return null;
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) return null;
  return trimmed;
}

const API_BASE = resolveApiBase();

const TOKEN_KEY = "skillful.token";
const USER_KEY = "skillful.user";

export function isApiConfigured(): boolean {
  return API_BASE !== null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function getCachedUser<T = unknown>(): T | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setCachedUser(user: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  if (!API_BASE) {
    throw new ApiError(
      0,
      "API is not configured. Set NEXT_PUBLIC_API_BASE to the public URL of the FastAPI server (e.g. https://your-api.example.com).",
    );
  }
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401 && typeof window !== "undefined") {
    clearAuth();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? JSON.stringify(body);
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, detail);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
