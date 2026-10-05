import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { guardAdmin } from "@/lib/admin-api";
import { slugify } from "@/lib/admin-client";
import { mediaPersistent } from "@/lib/settings";
import { deleteMediaFile } from "@/lib/media-delete";
import { recordDimensions } from "@/lib/media-manifest";

/**
 * POST /api/admin/media — upload one image into public/images.
 *
 * Design decisions:
 * - multipart/form-data with a single `file` field (+ optional `folder`,
 *   a single safe slug segment like "picks", never a traversal vector).
 * - Extension whitelist + byte-signature sniff — the bytes must match the
 *   extension (guards the exact JPEG-as-.png class of bug that breaks the
 *   Next.js image optimizer with 400s).
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

/** File signatures for the formats we accept (checked against real bytes). */
const SIGNATURES: Array<{ ext: string; test: (b: Uint8Array) => boolean }> = [
  { ext: "png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { ext: "jpg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    ext: "webp",
    test: (b) =>
      b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50,
  },
  {
    ext: "avif",
    test: (b) =>
      b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70 && b[8] === 0x61 && b[9] === 0x76 && b[10] === 0x69 && b[11] === 0x66,
  },
];

/** Raster-only formats (SVG removed: stored-XSS vector; GIF removed: no demonstrated need). */
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

function extFromName(name: string): string {
  const m = /\.(png|jpe?g|webp|avif)$/i.exec(name);
  if (!m) return "";
  return m[1].toLowerCase().replace("jpeg", "jpg");
}

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

  const declared = extFromName(file.name);
  if (!declared) {
    return NextResponse.json(
      { error: "Unsupported file type — use .png, .jpg, .webp or .avif." },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  // Byte signature must confirm the declared type (or the reported MIME must) —
  // mismatched files break the image optimizer, so we refuse them at the door.
  const sig = SIGNATURES.find((s) => s.ext === declared);
  const mimeOk = Boolean(file.type) && EXT_BY_MIME[file.type]?.toLowerCase() === declared;
  if (!sig || !(sig.test(bytes) || mimeOk)) {
    return NextResponse.json(
      {
        error: `The bytes don't match .${declared} — the file may be misnamed or corrupt. Re-export it as a real .${declared} and try again.`,
      },
      { status: 400 },
    );
  }

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
