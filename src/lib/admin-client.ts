/**
 * Client-side helpers for the /admin area — plain fetch wrapper used by every
 * admin form, plus small text utilities (slugify, date formatting).
 * No server imports here: this module is imported by client components.
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

export async function api<T = Record<string, unknown>>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(path, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let json: Record<string, unknown> = {};
    try {
      json = (await res.json()) as Record<string, unknown>;
    } catch {
      // empty body — fall through
    }
    if (!res.ok) {
      const message = typeof json.error === "string" ? json.error : `Request failed (${res.status})`;
      return { ok: false, error: message };
    }
    return { ok: true, data: json as T };
  } catch {
    return { ok: false, error: "Network error — is the server running?" };
  }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/** Date → value usable by <input type="datetime-local"> */
export function toLocalInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Format a date for tables (e.g. "05 Jan 2025"). */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
