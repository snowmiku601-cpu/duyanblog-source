import "server-only";

import { unlink } from "node:fs/promises";
import path from "node:path";
import { getImageUsage, type UsageRef } from "@/lib/media-usage";
import { removeFromManifest } from "@/lib/media-manifest";

/**
 * Shared media-file removal used by the single DELETE endpoint and the
 * bulk-delete endpoint. Every delete goes through the same two gates:
 *  1. lexical path containment (must start `/images/`, resolve inside
 *     <cwd>/public/images after normalize — no traversal, ever),
 *  2. a server-side usage re-check (exact-path match over articles,
 *     categories, comparison items and code-referenced paths) — a stale
 *     client can never orphan a page's image.
 */

export type PathCheck = { ok: true; target: string } | { ok: false; error: string };

export function validateMediaPath(raw: string): PathCheck {
  const WEB_ROOT = "/images/";
  if (!raw.startsWith(WEB_ROOT) || raw.includes("\0")) {
    return { ok: false, error: "Path must start with /images/." };
  }
  const root = path.join(process.cwd(), "public", "images");
  const target = path.resolve(root, path.normalize(raw.slice(WEB_ROOT.length)));
  if (target !== root && !target.startsWith(root + path.sep)) {
    return { ok: false, error: "Path escapes the media library." };
  }
  return { ok: true, target };
}

export type DeleteOutcome =
  | { ok: true }
  | { ok: false; error: string; usedIn?: UsageRef[] };

/** Check usage, then unlink. Never throws. Pass `usage` to reuse a precomputed map (bulk deletes). */
export async function deleteMediaFile(webPath: string, usage?: Awaited<ReturnType<typeof getImageUsage>>): Promise<DeleteOutcome> {
  const check = validateMediaPath(webPath);
  if (!check.ok) return { ok: false, error: check.error };

  const map = usage ?? (await getImageUsage());
  const refs = map.get(webPath);
  if (refs && refs.length > 0) {
    return {
      ok: false,
      error: "This image is still in use — remove it from the pages below first.",
      usedIn: refs,
    };
  }

  try {
    await unlink(check.target);
    // Keep the dimensions manifest in sync — a missing entry is harmless, a
    // stale one is confusing.
    await removeFromManifest([webPath]);
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === "ENOENT") {
      return { ok: false, error: "That file is already gone." };
    }
    console.error("media delete failed", err);
    return { ok: false, error: "Could not delete the file on disk." };
  }
  return { ok: true };
}
