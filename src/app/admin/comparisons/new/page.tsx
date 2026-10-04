import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPublicImages } from "@/lib/media";
import { ComparisonEditor } from "../comparison-editor";

export const metadata = { title: "New comparison — Admin" };

export default async function NewComparisonPage() {
  await requireAdminPage();

  const [articles, offers, media] = await Promise.all([
    db.article.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.affiliateOffer.findMany({ orderBy: [{ order: "asc" }, { label: "asc" }], select: { id: true, label: true } }),
    listPublicImages(),
  ]);

  return (
    <ComparisonEditor
      initial={{ id: "", title: "", slug: "", intro: "", articleId: "", items: [] }}
      articles={articles}
      offers={offers}
      media={media}
    />
  );
}
