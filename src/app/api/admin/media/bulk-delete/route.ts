import { NextResponse } from "next/server";
import { z } from "zod";
import { guardAdmin, parseBody } from "@/lib/admin-api";
import { deleteMediaFile } from "@/lib/media-delete";
import { getImageUsage } from "@/lib/media-usage";

/**
 * POST /api/admin/media/bulk-delete — remove several unused uploads in one
 * call (the media page's "delete all unused" affordance).
 *
 * Body: { paths: ["/images/…", …] } — capped at 100 per call. Every path
 * goes through the exact same gates as the single DELETE (containment +
 * server-side usage re-check), so in-use or invalid paths are skipped, not
 * fatal: the response reports per-path outcomes and the UI toasts a summary.
 */
const bodySchema = z.object({
  paths: z.array(z.string().trim().min(1).max(500)).min(1).max(100),
});

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const parsed = await parseBody(request, bodySchema);
  if (parsed.response) return parsed.response;
  const { paths } = parsed.data;

  const deleted: string[] = [];
  const skipped: Array<{ path: string; reason: string }> = [];

  // One usage snapshot for the whole batch — every delete in this call is
  // guarded against the same view of the DB.
  const usage = await getImageUsage();
  for (const p of paths) {
    const result = await deleteMediaFile(p, usage);
    if (result.ok) {
      deleted.push(p);
    } else {
      skipped.push({
        path: p,
        reason: result.usedIn
          ? `In use by ${result.usedIn.length} page${result.usedIn.length === 1 ? "" : "s"}.`
          : result.error,
      });
    }
  }

  return NextResponse.json({ ok: true, deleted, skipped });
}
