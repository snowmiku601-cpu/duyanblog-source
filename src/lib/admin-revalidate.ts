import "server-only";

import { revalidatePath } from "next/cache";
import { articleTypePaths, type ArticleType } from "@/lib/site";

/**
 * Cache-busting helpers called by /api/admin mutation routes.
 * revalidatePath works only for pages the app actually renders — the dynamic
 * /sitemap.xml and /feed.xml routes are not cached, so nothing to bust there.
 */

/** All public listing pages + home. */
export function revalidateLists(): void {
  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/best");
  revalidatePath("/compare");
  revalidatePath("/guides");
  revalidatePath("/articles");
  revalidatePath("/deals");
  revalidatePath("/authors");
  revalidatePath("/search");
}

/**
 * Full bust after an article mutation: lists + the article's canonical page
 * + its category hub.
 */
export function revalidateForArticle(slug?: string | null, type?: string | null, categorySlug?: string | null): void {
  revalidateLists();
  if (slug) {
    const prefix = articleTypePaths[type as ArticleType] ?? "/articles";
    revalidatePath(`${prefix}/${slug}`);
  }
  if (categorySlug) revalidatePath(`/${categorySlug}`);
}

/** Category / author / merchant changes affect article pages → broad bust. */
export function revalidateEverything(): void {
  revalidatePath("/", "layout");
}

/** Site settings (ads_enabled, demo_mode …) are read across the site. */
export function revalidateSettings(): void {
  revalidatePath("/", "layout");
}
