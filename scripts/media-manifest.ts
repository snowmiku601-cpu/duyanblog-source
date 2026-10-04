/**
 * Backfill the image-dimensions manifest for every file under public/images.
 *
 *   npm run media:manifest
 *
 * Reads each image with sharp (metadata only — no re-encode) and writes
 * public/images/.media-manifest.json. Safe to re-run: it refreshes all
 * entries. Files sharp can't decode (rare SVGs without intrinsic size) are
 * skipped with a note.
 */
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public", "images");
const IMAGE_RE = /\.(png|jpe?g|webp|avif|gif|svg)$/i;
const OUT = path.join(ROOT, ".media-manifest.json");

type Manifest = Record<string, { width: number; height: number }>;

async function walk(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(abs)));
    else if (IMAGE_RE.test(entry.name)) files.push(abs);
  }
  return files;
}

async function main() {
  let manifest: Manifest = {};
  try {
    manifest = JSON.parse(await readFile(OUT, "utf8")) as Manifest;
  } catch {
    manifest = {};
  }

  const files = await walk(ROOT);
  let recorded = 0;
  let skipped = 0;
  for (const abs of files) {
    const webPath = `/images/${path.relative(ROOT, abs).split(path.sep).join("/")}`;
    try {
      const meta = await sharp(abs).metadata();
      if (meta.width && meta.height) {
        manifest[webPath] = { width: meta.width, height: meta.height };
        recorded += 1;
      } else {
        skipped += 1;
        console.log(`skip (no intrinsic size): ${webPath}`);
      }
    } catch {
      skipped += 1;
      console.log(`skip (undecodable): ${webPath}`);
    }
  }

  await writeFile(OUT, JSON.stringify(manifest, null, 2), "utf8");
  const total = await stat(OUT);
  console.log(`manifest written: ${recorded} entries (${skipped} skipped), ${total.size} bytes → ${OUT}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
