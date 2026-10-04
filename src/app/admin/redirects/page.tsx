import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/admin-client";
import { RedirectsClient } from "./redirects-client";

export const metadata = { title: "Redirects — Admin" };

export default async function AdminRedirectsPage() {
  await requireAdminPage();

  const rows = await db.redirect.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Redirects</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Legacy-URL map (301/302). Consumed by middleware / future edge config — see ARCHITECTURE.md.{" "}
          <em>from</em> must start with “/”; <em>to</em> must start with “/” or “https://”.
        </p>
      </header>
      <RedirectsClient
        rows={rows.map((r) => ({
          id: r.id,
          from: r.from,
          to: r.to,
          statusCode: r.statusCode,
          active: r.active,
          createdAt: formatDate(r.createdAt),
        }))}
      />
    </div>
  );
}
