import "server-only";

import { z } from "zod";
import { db } from "@/lib/db";
import { idField, optionalTextField } from "@/lib/admin-api";
import { revalidateLists } from "@/lib/admin-revalidate";
import { revalidateArticleBy } from "@/lib/admin-articles";

/** Shared offer payload + revalidation for the /api/admin/offers routes. */

export const offerSchema = z.object({
  merchantId: idField,
  articleId: optionalTextField(64),
  label: z.string().trim().min(1).max(200),
  url: z.string().trim().min(9).max(1_000).startsWith("https://", "URL must start with https://"),
  price: optionalTextField(60),
  note: optionalTextField(400),
  badge: optionalTextField(60),
  isDeal: z.boolean().default(false),
  dealText: optionalTextField(120),
  active: z.boolean().default(true),
  order: z.number().int().min(-999).max(999).default(0),
});

export type OfferPayload = z.infer<typeof offerSchema>;

/** Bust the deals page + the linked article (if any). */
export async function revalidateOffer(articleId: string | null): Promise<void> {
  revalidateLists();
  if (articleId) {
    const article = await db.article.findUnique({
      where: { id: articleId },
      select: { slug: true, type: true, categoryId: true },
    });
    if (article) await revalidateArticleBy(article.categoryId, article.slug, article.type);
  }
}
