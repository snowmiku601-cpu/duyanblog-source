import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPublicImages } from "@/lib/media";
import { ArticleForm } from "../article-form";

export const metadata = { title: "New article — Admin" };

export default async function NewArticlePage() {
  await requireAdminPage();

  const [categories, authors, media] = await Promise.all([
    db.category.findMany({ orderBy: [{ order: "asc" }, { name: "asc" }], select: { id: true, name: true } }),
    db.author.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    listPublicImages(),
  ]);

  const missing: string[] = [];
  if (categories.length === 0) missing.push("a category");
  if (authors.length === 0) missing.push("an author");

  return (
    <div className="flex flex-col gap-6">
      {missing.length > 0 && (
        <p className="rounded-md border border-ochre/60 bg-accent px-4 py-3 text-sm">
          Heads up: every article needs {missing.join(" and ")}. Create{" "}
          {missing.length === 1 ? "one" : "them"} first in{" "}
          <Link className="underline underline-offset-2" href="/admin/categories">
            Categories
          </Link>{" "}
          /{" "}
          <Link className="underline underline-offset-2" href="/admin/authors">
            Authors
          </Link>
          , or the save will be rejected.
        </p>
      )}
      <ArticleForm
        article={null}
        options={{
          categories,
          authors,
          offers: [], // new article — attach offers after saving (Offers page)
          media,
        }}
      />
    </div>
  );
}
