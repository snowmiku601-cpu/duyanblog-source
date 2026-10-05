import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { guardAdmin } from "@/lib/admin-api";
import { slugify } from "@/lib/admin-client";
import { mediaPersistent } from "@/lib/settings";
import { deleteMediaFile } from "@/lib/media-delete";
import { recordDimensions } from "@/lib/media-manifest";
import { extFromName, validateMediaUpload } from "@/lib/media-validation";

/**
 * POST /api/admin/media — upload one image into public/images.
 *
 * Design decisions:
 * - multipart/form-data with a single `file` field (+ optional `folder`,
 *   a single safe slug segment like "picks", never a traversal vector).
 * - Extension whitelist + byte-signature sniff — the bytes must match the
 *   extension (guards the exact JPEG-as-.png class of bug that breaks the
 *   Next.js image optimizer with 400s). The byte signature is authoritative;
 *   a client-supplied MIME can never compensate for invalid bytes.
 * - Size cap 5 MB (Next's optimizer re-encodes large sources on the fly;
 *   keeping sources modest keeps the cache warm and pages fast).
 * - The on-disk filename is slugified; collisions get -2/-3/… suffixes
 *   instead of overwrites (uploads are never destructive).
 *
 * NOTE (production): files are written to <cwd>/public/images of the running
 * process. On a Hostinger VPS (non-containerised Node) that persists; in a
 * rebuild-from-scratch pipeline, media should move to object storage. This is
 * documented in ARCHITECTURE.md §10.
 */

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  // Production media-persistence gate (Correction 15): without
  // MEDIA_PERSISTENT=true this environment cannot guarantee uploads survive
  // the next deployment, so the CMS refuses to write — editorial media stays
  // Git-managed in production. Dev is unaffected.
  if (!mediaPersistent()) {
    return NextResponse.json(
      {
        error:
          "Media uploads are disabled in this environment — MEDIA_PERSISTENT is not set, so uploaded files would not survive a rebuild. Manage media through the repo (Git) instead, or set MEDIA_PERSISTENT=true on a deployment that persists the app directory.",
      },
      { status: 403 },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected a multipart form upload." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file — attach one image under `file`." }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `Too large — the cap is 5 MB (got ${(file.size / 1024 / 1024).toFixed(1)} MB).` },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // The byte signature is authoritative (media-validation.ts) — the reported
  // MIME / Content-Type is client-controlled and must never compensate for
  // invalid bytes. We require: supported extension, matching byte signature,
  // and (when a MIME is present) an agreeing MIME.
  const validation = validateMediaUpload(file.name, file.type, bytes);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const declared = validation.ext;

  // Optional single folder segment, strictly validated.
  const rawFolder = form.get("folder");
  const folder =
    typeof rawFolder === "string" && /^[a-z0-9][a-z0-9-]{0,40}$/i.test(rawFolder.trim())
      ? rawFolder.trim().toLowerCase()
      : "";

  // Slug the on-disk name; keep it predictable and URL-safe.
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "image";
  const dir = path.join(process.cwd(), "public", "images", folder);
  const webDir = `/images${folder ? `/${folder}` : ""}`;

  let filename = `${base}.${declared}`;
  for (let n = 2; n < 100; n++) {
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, filename), bytes, { flag: "wx" });
      const webPath = `${webDir}/${filename}`;
      // Dimensions sidecar (best-effort — an SVG with no intrinsic size or a
      // sharp hiccup just leaves the entry absent, never fails the upload).
      try {
        const meta = await sharp(bytes).metadata();
        if (meta.width && meta.height) {
          await recordDimensions(webPath, { width: meta.width, height: meta.height });
        }
      } catch {
        // ignore — optional metadata
      }
      return NextResponse.json({ ok: true, path: webPath });
    } catch (err) {
      // EEXIST → try the next suffix; anything else is a real failure.
      if ((err as NodeJS.ErrnoException)?.code !== "EEXIST") {
        console.error("media upload failed", err);
        return NextResponse.json({ error: "Could not write the file to the media library." }, { status: 500 });
      }
      filename = `${base}-${n}.${declared}`;
    }
  }
  return NextResponse.json({ error: "Too many files with that name — rename it and try again." }, { status: 400 });
}

/**
 * DELETE /api/admin/media?path=/images/<name> — remove an unused upload.
 * The actual rules (path containment + server-side usage re-check) live in
 * src/lib/media-delete.ts so the bulk endpoint shares them exactly.
 */
export async function DELETE(request: Request) {
  const guard = await guardAdmin(request);
  if (guard.response) return guard.response;

  const raw = new URL(request.url).searchParams.get("path") ?? "";
  const result = await deleteMediaFile(raw);
  if (!result.ok) {
    const status = result.error.startsWith("Path must") || result.error.startsWith("Path escapes")
      ? 400
      : result.error === "That file is already gone."
        ? 404
        : result.usedIn
          ? 409
          : 500;
    return NextResponse.json({ error: result.error, usedIn: result.usedIn }, { status });
  }
  return NextResponse.json({ ok: true });
}
