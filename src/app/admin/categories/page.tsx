import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoriesClient } from "./categories-client";

export const metadata = { title: "Categories — Admin" };

export default async function AdminCategoriesPage() {
  await requireAdminPage();

  const rows = await db.category.findMany({
    orderBy: [{ order: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });

  return (
    <CategoriesClient
      rows={rows.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        heroImage: c.heroImage ?? "",
        accent: c.accent,
        order: c.order,
        articleCount: c._count.articles,
      }))}
    />
  );
}
