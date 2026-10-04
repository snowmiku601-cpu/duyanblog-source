import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { OffersClient } from "./offers-client";

export const metadata = { title: "Offers — Admin" };

export default async function AdminOffersPage() {
  await requireAdminPage();

  const [rows, merchants, articles] = await Promise.all([
    db.affiliateOffer.findMany({
      orderBy: [{ order: "asc" }, { label: "asc" }],
      include: {
        merchant: { select: { name: true } },
        article: { select: { title: true } },
        _count: { select: { clicks: true } },
      },
    }),
    db.merchant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.article.findMany({ orderBy: { title: "asc" }, select: { id: true, title: true } }),
  ]);

  return (
    <OffersClient
      rows={rows.map((o) => ({
        id: o.id,
        label: o.label,
        merchantName: o.merchant.name,
        articleId: o.articleId ?? "",
        articleTitle: o.article?.title ?? "",
        url: o.url,
        price: o.price ?? "",
        note: o.note ?? "",
        badge: o.badge ?? "",
        isDeal: o.isDeal,
        dealText: o.dealText ?? "",
        active: o.active,
        order: o.order,
        clickCount: o._count.clicks,
      }))}
      merchants={merchants}
      articles={articles}
    />
  );
}
