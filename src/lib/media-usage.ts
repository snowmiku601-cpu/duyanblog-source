import "server-only";

import { db } from "@/lib/db";

/**
 * Image usage detection — which content rows reference a given /images/… path.
 *
 * Shared by the media library page (badges + delete guard UI) and the delete
 * API (server-side re-check, so a stale client can never delete an image that
 * is still in use).
 *
 * Scanned references:
 * - Article.heroImage
 * - Article.blocks JSON: image blocks (src) and pick blocks (imageUrl)
 * - Category.heroImage
 * - ComparisonItem.imageUrl
 * - CODE_REFERENCED: paths hardcoded in source (the OG default) — deleting
 *   those would break pages that never touch the DB.
 *
 * Matching is exact-path (string equality) — no prefix matching, so
 * /images/a.png never "blocks" /images/a-2.png.
 */

/** Paths referenced from source code — never deletable via the admin. */
const CODE_REFERENCED: Record<string, UsageRef[]> = {
  "/images/og-default.png": [
    { label: "Site default OG image (code)", href: "/admin/settings" },
  ],
};

export type UsageRef = {
  /** Human label, e.g. "Review · Auralis Note 14" */
  label: string;
  /** Admin edit href, e.g. /admin/articles/clx… */
  href: string;
};

export type UsageMap = Map<string, UsageRef[]>;

type Block = { type: string; src?: unknown; imageUrl?: unknown };

function collectBlockImages(blocks: unknown, out: Set<string>): void {
  if (!Array.isArray(blocks)) return;
  for (const raw of blocks) {
    if (!raw || typeof raw !== "object") continue;
    const block = raw as Block;
    if (block.type === "image" && typeof block.src === "string" && block.src.startsWith("/images/")) {
      out.add(block.src);
    }
    if (block.type === "pick" && typeof block.imageUrl === "string" && block.imageUrl.startsWith("/images/")) {
      out.add(block.imageUrl);
    }
  }
}

function add(map: UsageMap, path: string, ref: UsageRef): void {
  const list = map.get(path);
  if (list) list.push(ref);
  else map.set(path, [ref]);
}

/**
 * Build the full path → refs map in a handful of parallel queries.
 * Article count is editorial-scale (tens), so reading title + blocks for all
 * rows is fine; block JSON parsing is guarded and never throws.
 */
export async function getImageUsage(): Promise<UsageMap> {
  const [articles, categories, items] = await Promise.all([
    db.article.findMany({
      select: {
        id: true,
        slug: true,
        type: true,
        title: true,
        status: true,
        heroImage: true,
        blocks: true,
      },
    }),
    db.category.findMany({ select: { id: true, slug: true, name: true, heroImage: true } }),
    db.comparisonItem.findMany({
      select: {
        id: true,
        imageUrl: true,
        comparison: { select: { id: true, slug: true, title: true } },
      },
    }),
  ]);

  const map: UsageMap = new Map();
  for (const [p, refs] of Object.entries(CODE_REFERENCED)) {
    map.set(
      p,
      refs.map((r) => ({ ...r })),
    );
  }

  for (const a of articles) {
    const kind = a.type.charAt(0).toUpperCase() + a.type.slice(1);
    const ref = {
      label: `${kind} · ${a.title}${a.status === "draft" ? " (draft)" : ""}`,
      href: `/admin/articles/${a.id}`,
    };
    if (a.heroImage?.startsWith("/images/")) add(map, a.heroImage, ref);
    try {
      const paths = new Set<string>();
      collectBlockImages(
        typeof a.blocks === "string" ? (JSON.parse(a.blocks) as unknown) : a.blocks,
        paths,
      );
      for (const p of paths) add(map, p, ref);
    } catch {
      // Malformed blocks JSON on some row — skip its blocks, keep the rest.
    }
  }

  for (const c of categories) {
    if (c.heroImage?.startsWith("/images/")) {
      add(map, c.heroImage, {
        label: `Category · ${c.name}`,
        href: `/admin/categories`,
      });
    }
  }

  for (const item of items) {
    if (item.imageUrl?.startsWith("/images/")) {
      add(map, item.imageUrl, {
        label: `Comparison · ${item.comparison.title}`,
        href: `/admin/comparisons/${item.comparison.id}`,
      });
    }
  }

  return map;
}
