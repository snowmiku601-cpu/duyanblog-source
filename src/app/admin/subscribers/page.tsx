import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { SubscribersClient, type SubscriberRow } from "./subscribers-client";

export const metadata = { title: "Subscribers — Admin" };

export default async function SubscribersPage() {
  await requireAdminPage();

  const [rows, total, pending] = await Promise.all([
    db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        source: true,
        confirmed: true,
        confirmToken: true,
        unsubscribeToken: true,
        createdAt: true,
      },
    }),
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.count({ where: { confirmed: false } }),
  ]);

  const data: SubscriberRow[] = rows.map((r) => ({
    id: r.id,
    email: r.email,
    source: r.source,
    confirmed: r.confirmed,
    confirmToken: r.confirmToken,
    unsubscribeToken: r.unsubscribeToken,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Newsletter subscribers</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} {total === 1 ? "signup" : "signups"}
          {pending > 0 && ` · ${pending} pending confirmation`}. Double opt-in is on — new
          signups stay <em>Pending</em> until they open their confirmation link. Until an email
          provider is wired up, hand pending folks their link via the mail icon below.
        </p>
      </header>
      <SubscribersClient rows={data} />
    </div>
  );
}
