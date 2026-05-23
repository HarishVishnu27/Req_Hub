import { getAuth } from "../auth/authStore";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export type ApiError = {
  status: number;
  detail?: string; // always safe string for UI
  raw?: unknown;
};

const FRIENDLY_DOWN_MESSAGE =
  "Service is temporarily unavailable. Please try again later.";

function normalizeDetail(raw: any): string | undefined {
  if (!raw) return undefined;

  const detail = raw?.detail;

  if (typeof detail === "string") return detail;

  if (Array.isArray(detail)) {
    const msgs = detail
      .map((d) => {
        if (!d) return null;
        if (typeof d === "string") return d;
        if (typeof d?.msg === "string") return d.msg;
        try {
          return JSON.stringify(d);
        } catch {
          return String(d);
        }
      })
      .filter(Boolean);

    return msgs.length ? msgs.join(" | ") : "Validation error.";
  }

  if (typeof detail === "object") {
    try {
      return JSON.stringify(detail);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function looksLikeHtml(text: string) {
  const t = text.trim().toLowerCase();
  return t.startsWith("<!doctype") || t.startsWith("<html") || t.includes("<body") || t.includes("</html>");
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = getAuth();

  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as any),
  };

  if (auth?.token) headers["Authorization"] = `Bearer ${auth.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch (err) {
    // ✅ Backend down / DNS fail / connection refused / SSL error etc.
    throw { status: 0, detail: FRIENDLY_DOWN_MESSAGE, raw: err } as ApiError;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    // Try parse body; if it's HTML (nginx 502) or empty, show friendly message
    let raw: any = null;

    if (isJson) {
      raw = await res.json().catch(() => null);
      const detail = normalizeDetail(raw) || `Request failed (${res.status}).`;
      throw { status: res.status, detail, raw } as ApiError;
    }

    const text = await res.text().catch(() => "");
    if (!text || looksLikeHtml(text)) {
      // ✅ Nginx/Proxy error page or empty response
      throw { status: res.status, detail: FRIENDLY_DOWN_MESSAGE, raw: text } as ApiError;
    }

    // Non-JSON but not HTML → show a trimmed message
    const safe = text.length > 300 ? text.slice(0, 300) + "..." : text;
    throw { status: res.status, detail: safe, raw: text } as ApiError;
  }

  if (isJson) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}