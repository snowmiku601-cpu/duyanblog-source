import "server-only";

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * A tiny sidecar manifest for image dimensions, so the admin can show
 * "1920 × 1080" without decoding files on every page load.
 *
 - Stored at `public/images/.media-manifest.json` — a dotfile, so
 * listPublicImages() (which only matches image extensions) never lists it.
 * - Written at upload time (sharp metadata) and by the backfill script
 *   (`npm run media:manifest`). Missing/corrupt entries are simply absent —
 *   the UI treats dimensions as optional metadata, never a dependency.
 */

export type Dimensions = { width: number; height: number };
export type Manifest = Record<string, Dimensions>;

const MANIFEST_PATH = path.join(process.cwd(), "public", "images", ".media-manifest.json");

export async function readManifest(): Promise<Manifest> {
  try {
    const raw = await readFile(MANIFEST_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as Manifest;
  } catch {
    return {};
  }
}

export async function recordDimensions(webPath: string, dims: Dimensions): Promise<void> {
  try {
    const manifest = await readManifest();
    manifest[webPath] = dims;
    await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  } catch (err) {
    // Metadata is a nicety — never fail an upload over it.
    console.warn("[media] could not update the dimensions manifest", err);
  }
}

export async function removeFromManifest(webPaths: string[]): Promise<void> {
  try {
    const manifest = await readManifest();
    let changed = false;
    for (const p of webPaths) {
      if (p in manifest) {
        delete manifest[p];
        changed = true;
      }
    }
    if (changed) await writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), "utf8");
  } catch (err) {
    console.warn("[media] could not clean the dimensions manifest", err);
  }
}
