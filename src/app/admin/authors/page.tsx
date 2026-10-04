import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthorsClient } from "./authors-client";

export const metadata = { title: "Authors — Admin" };

export default async function AdminAuthorsPage() {
  await requireAdminPage();

  const rows = await db.author.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return (
    <AuthorsClient
      rows={rows.map((a) => ({
        id: a.id,
        slug: a.slug,
        name: a.name,
        role: a.role,
        bio: a.bio,
        avatarUrl: a.avatarUrl ?? "",
        focusAreas: JSON.parse(a.focusAreas || "[]") as string[],
        articleCount: a._count.articles,
      }))}
    />
  );
}
