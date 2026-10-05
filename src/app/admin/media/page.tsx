import { stat } from "node:fs/promises";
import path from "node:path";
import { requireAdminPage } from "@/lib/auth";
import { listPublicImages } from "@/lib/media";
import { getImageUsage } from "@/lib/media-usage";
import { readManifest } from "@/lib/media-manifest";
import { mediaPersistent } from "@/lib/settings";
import { MediaClient, type MediaItem } from "./media-client";

export const metadata = { title: "Media library — Admin" };

/**
 * Media library — every file under public/images with its on-disk stats and
 * the content that references it. The usage map is what powers the "in use"
 * badges and the delete guard (the API re-checks server-side).
 */
export default async function AdminMediaPage() {
  await requireAdminPage();

  const [paths, usage, manifest] = await Promise.all([listPublicImages(), getImageUsage(), readManifest()]);

  const root = path.join(process.cwd(), "public", "images");
  const items: MediaItem[] = await Promise.all(
    paths.map(async (webPath) => {
      const rel = webPath.replace(/^\/images\//, "");
      try {
        const s = await stat(path.join(root, rel));
        return {
          path: webPath,
          bytes: s.size,
          modified: s.mtime.toISOString(),
          usedIn: usage.get(webPath) ?? [],
          dimensions: manifest[webPath] ?? null,
        };
      } catch {
        // Listed but unreadable (deleted between list and stat) — still show it.
        return { path: webPath, bytes: 0, modified: "", usedIn: usage.get(webPath) ?? [], dimensions: null };
      }
    }),
  );

  return <MediaClient items={items} canUpload={mediaPersistent()} />;
}
