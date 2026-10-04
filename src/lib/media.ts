import { readdir } from "node:fs/promises";
import path from "node:path";

const IMAGE_RE = /\.(png|jpe?g|webp|avif|gif|svg)$/i;

/**
 * List public image paths (e.g. "/images/hero.png") for admin pickers.
 * Walks public/images recursively; returns sorted web paths. Failures
 * (missing dir) resolve to an empty list — the datalist is a convenience,
 * never a dependency.
 */
export async function listPublicImages(): Promise<string[]> {
  const root = path.join(process.cwd(), "public", "images");
  const out: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
      } else if (IMAGE_RE.test(entry.name)) {
        // Web path is always /images/<relative-to-public/images>.
        out.push(`/images/${path.relative(root, abs).split(path.sep).join("/")}`);
      }
    }
  }

  await walk(root);
  return out.sort();
}
