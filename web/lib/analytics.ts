const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8000";

const SESSION_KEY = "skillful.session";
const TOKEN_KEY = "skillful.token";

const FLUSH_DEBOUNCE_MS = 500;
const BATCH_LIMIT = 50;

export type EventProps = Record<string, unknown>;

type QueuedEvent = {
  name: string;
  path: string;
  session_id: string;
  properties: EventProps;
};

const queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = window.sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function currentPath(): string {
  if (typeof window === "undefined") return "";
  return window.location.pathname + window.location.search;
}

function ensureListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;
  // sendBeacon-style flush before the page unloads or hides
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush(false);
  }, FLUSH_DEBOUNCE_MS);
}

function flush(unloading: boolean): void {
  if (typeof window === "undefined") return;
  if (queue.length === 0) return;
  const batch = queue.splice(0, queue.length);
  const body = JSON.stringify({ events: batch });
  const url = `${API_BASE}/events`;
  const token = window.localStorage.getItem(TOKEN_KEY);

  // Anonymous events on unload: prefer sendBeacon for reliability.
  // Beacon can't set Authorization, so for logged-in users we always use fetch.
  if (unloading && !token && typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon(url, blob)) return;
  }

  void fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
    keepalive: true,
  }).catch(() => {
    // Analytics must never break the app.
  });
}

export function track(name: string, properties: EventProps = {}): void {
  if (typeof window === "undefined") return;
  ensureListeners();
  queue.push({
    name,
    path: currentPath(),
    session_id: getSessionId(),
    properties,
  });
  if (queue.length >= BATCH_LIMIT) {
    flush(false);
  } else {
    scheduleFlush();
  }
}

export function pageView(extra: EventProps = {}): void {
  track("page_view", extra);
}
