import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { isSameOrigin, requireAdminApi, type AdminUser } from "@/lib/auth";

/**
 * Shared plumbing for /api/admin route handlers:
 * - guardAdmin(): same-origin + session check, returns a ready 401/403 on failure
 * - parseBody(): JSON parse + Zod validation with a readable message
 * - prismaErrorMessage(): friendly copy for constraint violations
 */

export type Guard = { user: AdminUser; response?: undefined } | { user?: undefined; response: NextResponse };

export async function guardAdmin(request: Request): Promise<Guard> {
  if (!isSameOrigin(request)) {
    return { response: NextResponse.json({ error: "Invalid origin" }, { status: 403 }) };
  }
  const auth = await requireAdminApi();
  if ("response" in auth) return { response: auth.response };
  return { user: auth.user };
}

export async function parseBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<{ data: z.output<S>; response?: undefined } | { data?: undefined; response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return { response: NextResponse.json({ error: "Invalid request body" }, { status: 400 }) };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const where = issue?.path.length ? `${issue.path.join(".")}: ` : "";
    return {
      response: NextResponse.json(
        { error: `${where}${issue?.message ?? "Invalid input"}` },
        { status: 400 }
      ),
    };
  }
  return { data: parsed.data };
}

/** Map Prisma known error codes to admin-friendly copy. */
export function prismaErrorMessage(err: unknown, fallback = "Something went wrong — try again."): string {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002") return "That slug is already in use — pick another.";
    if (code === "P2003") return "Cannot delete: other records still reference it.";
    if (code === "P2025") return "Record not found — it may have been deleted already.";
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

export const slugField = z
  .string()
  .trim()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single dashes");

export const idField = z.string().trim().min(1).max(64);

export const optionalTextField = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v));

/** datetime-local string ("2025-01-05T10:30") or null → Date | null */
export const optionalDateField = z
  .union([z.string(), z.null()])
  .optional()
  .transform((v) => {
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  });
