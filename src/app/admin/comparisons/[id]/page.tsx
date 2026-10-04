import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseAttributes, parseStringList } from "@/lib/comparison";
import { listPublicImages } from "@/lib/media";
import { ComparisonEditor, type ComparisonEditorItem } from "../comparison-editor";

export const metadata = { title: "Edit comparison — Admin" };

export default async function EditComparisonPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;

  const [comparison, articles, offers, media] = await Promise.all([
    db.comparison.findUnique({ where: { id }, include: { items: { orderBy: { order: "asc" } } } }),
    db.article.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
    db.affiliateOffer.findMany({ orderBy: [{ order: "asc" }, { label: "asc" }], select: { id: true, label: true } }),
    listPublicImages(),
  ]);

  if (!comparison) notFound();

  const items: ComparisonEditorItem[] = comparison.items.map((item) => ({
    name: item.name,
    url: item.url ?? "",
    imageUrl: item.imageUrl ?? "",
    score: item.score == null ? "" : String(item.score),
    summary: item.summary ?? "",
    offerId: item.offerId ?? "",
    order: String(item.order),
    // Pretty-print stored JSON so the textareas stay human-editable.
    attributes: JSON.stringify(parseAttributes(item.attributes), null, 2),
    pros: JSON.stringify(parseStringList(item.pros), null, 2),
    cons: JSON.stringify(parseStringList(item.cons), null, 2),
  }));

  return (
    <ComparisonEditor
      initial={{
        id: comparison.id,
        title: comparison.title,
        slug: comparison.slug,
        intro: comparison.intro ?? "",
        articleId: comparison.articleId ?? "",
        items,
      }}
      articles={articles}
      offers={offers}
      media={media}
    />
  );
}
