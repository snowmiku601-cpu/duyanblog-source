import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { MerchantsClient } from "./merchants-client";

export const metadata = { title: "Merchants — Admin" };

export default async function AdminMerchantsPage() {
  await requireAdminPage();

  const rows = await db.merchant.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { offers: true } } },
  });

  return (
    <MerchantsClient
      rows={rows.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        website: m.website ?? "",
        note: m.note ?? "",
        offerCount: m._count.offers,
      }))}
    />
  );
}
