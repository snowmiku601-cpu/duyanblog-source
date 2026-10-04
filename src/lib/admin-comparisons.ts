import "server-only";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { slugField, optionalTextField } from "@/lib/admin-api";
import { comparisonAttributeSchema } from "@/lib/comparison";
import { revalidateLists } from "@/lib/admin-revalidate";
import { revalidateArticleBy } from "@/lib/admin-articles";

/** Shared comparison payload + revalidation for /api/admin/comparisons routes. */

export const comparisonItemSchema = z.object({
  name: z.string().trim().min(1).max(140),
  url: optionalTextField(300),
  imageUrl: optionalTextField(500),
  score: z
    .union([z.number().min(0).max(10), z.null()])
    .optional()
    .transform((v) => v ?? null),
  summary: optionalTextField(1_200),
  attributes: z.array(comparisonAttributeSchema).max(20).default([]),
  pros: z.array(z.string().max(300)).max(8).default([]),
  cons: z.array(z.string().max(300)).max(8).default([]),
  offerId: optionalTextField(64),
  order: z.number().int().min(-999).max(999).default(0),
});

export const comparisonSchema = z.object({
  title: z.string().trim().min(1).max(200),
  slug: slugField,
  intro: optionalTextField(1_000),
  articleId: optionalTextField(64),
  items: z.array(comparisonItemSchema).max(12),
});

export type ComparisonPayload = z.infer<typeof comparisonSchema>;

/** Persist items wholesale (delete + recreate) inside a transaction. */
export async function replaceItems(comparisonId: string, items: ComparisonPayload["items"]): Promise<void> {
  await db.$transaction(async (tx) => {
    await tx.comparisonItem.deleteMany({ where: { comparisonId } });
    if (items.length > 0) {
      await tx.comparisonItem.createMany({
        data: items.map((item, i) => ({
          comparisonId,
          name: item.name,
          url: item.url,
          imageUrl: item.imageUrl,
          score: item.score,
          summary: item.summary,
          attributes: JSON.stringify(item.attributes),
          pros: JSON.stringify(item.pros),
          cons: JSON.stringify(item.cons),
          offerId: item.offerId,
          order: item.order ?? i,
        })),
      });
    }
  });
}

/** Bust the compare list, the comparison page itself + the linked article. */
export async function revalidateComparison(articleId: string | null, slug?: string): Promise<void> {
  revalidateLists();
  if (slug) revalidatePath(`/compare/${slug}`);
  if (articleId) {
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { slug: true, type: true, categoryId: true },
    });
    if (article) await revalidateArticleBy(article.categoryId, article.slug, article.type);
  }
}
