import "server-only";

import { z } from "zod";
import { db } from "@/lib/db";
import { slugField, idField, optionalTextField, optionalDateField } from "@/lib/admin-api";
import { serializeBlocks } from "@/lib/content-schema";
import { revalidateForArticle } from "@/lib/admin-revalidate";

/**
 * Shared article payload + helpers for POST/PUT /api/admin/articles routes.
 * (Route files may only export HTTP handlers, so the shared logic lives here.)
 */

export const articlePayloadSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugField,
  type: z.enum(["review", "roundup", "versus", "guide", "editorial"]),
  status: z.enum(["draft", "published"]),
  deck: z.string().trim().min(1).max(600),
  tldr: optionalTextField(1_200),
  heroImage: optionalTextField(500),
  heroAlt: optionalTextField(400),
  heroCredit: optionalTextField(120),
  categoryId: idField,
  authorId: idField,
  reviewerId: optionalTextField(64),
  readingMinutes: z
    .union([z.number().int().min(0).max(600), z.null()])
    .optional()
    .transform((v) => v ?? null),
  featured: z.boolean(),
  publishedAt: optionalDateField,
  lastReviewedAt: optionalDateField,
  tags: z.array(z.string().trim().min(1).max(40)).max(24),
  blocks: z.unknown(),
  scores: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(80),
        score: z.number().min(0).max(10),
        weight: z.number().int().min(1).max(10).default(1),
        note: optionalTextField(300),
      })
    )
    .max(20),
  sources: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(200),
        url: optionalTextField(500),
      })
    )
    .max(50),
});

export type ArticlePayload = z.infer<typeof articlePayloadSchema>;

/** Validate the blocks JSON through the shared content schema. */
export function validateBlocks(blocks: unknown): { json: string } | { error: string } {
  try {
    return { json: serializeBlocks(blocks ?? []) };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const issue = err.issues[0];
      const where = issue?.path.join(".") || "blocks";
      return { error: `Invalid block (${where}): ${issue?.message ?? "schema mismatch"}` };
    }
    return { error: "Blocks contain an invalid entry." };
  }
}

/**
 * Rough reading time (200 wpm, clamped 1–600) computed from every prose string
 * in the blocks. Used when the admin leaves "reading minutes" empty so the
 * field stays honest as the copy changes — no manual recounts.
 */
export function estimateReadingMinutes(blocks: unknown): number {
  let words = 0;
  const skipKeys = new Set(["url", "href", "src", "alt", "credit", "id", "image"]);
  const visit = (node: unknown): void => {
    if (typeof node === "string") {
      words += node.split(/\s+/).filter(Boolean).length;
      return;
    }
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (node !== null && typeof node === "object") {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        if (skipKeys.has(key)) continue;
        visit(value);
      }
    }
  };
  visit(blocks);
  return Math.max(1, Math.min(600, Math.round(words / 200)));
}

/** Tag names → connect-or-create Tag ids. */
export async function resolveTagIds(names: string[]): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names) {
    const slug =
      name
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60) || "tag";
    const tag = await db.tag.upsert({ where: { slug }, create: { slug, name }, update: {} });
    if (!ids.includes(tag.id)) ids.push(tag.id);
  }
  return ids;
}

/** Revalidation after any article mutation. */
export async function revalidateArticleBy(categoryId: string, slug: string, type: string): Promise<void> {
  const category = await db.category.findUnique({ where: { id: categoryId }, select: { slug: true } });
  revalidateForArticle(slug, type, category?.slug ?? null);
}
