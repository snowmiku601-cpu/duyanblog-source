import Link from "next/link";
import { ArrowRight, MousePointerClick } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { listPublicImages } from "@/lib/media";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, ReadBadge } from "../_components/status-badge";
import { formatDate } from "@/lib/admin-client";
import { cn } from "@/lib/utils";
import { articlePath, articleTypeLabels, type ArticleType } from "@/lib/site";

export const metadata = { title: "Dashboard — Admin" };

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
}) {
  const body = (
    <Card className={cn("gap-2 p-4", href && "transition-colors group-hover:bg-accent/40")}>
      <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="font-display text-3xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
  if (!href) return body;
  return (
    <Link href={href} className="group focus-visible:outline-hidden">
      {body}
    </Link>
  );
}

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const [
    articleGroups,
    comparisons,
    authors,
    categories,
    merchants,
    activeOffers,
    subscribers,
    pendingSubscribers,
    unreadMessages,
    clicks,
    recentArticles,
    recentMessages,
    recentClicks,
    clicksLastWeek,
    mediaFiles,
    scheduledCount,
  ] = await Promise.all([
    db.article.groupBy({ by: ["status"], _count: { _all: true } }),
    db.comparison.count(),
    db.author.count(),
    db.category.count(),
    db.merchant.count(),
    db.affiliateOffer.count({ where: { active: true } }),
    db.newsletterSubscriber.count(),
    db.newsletterSubscriber.count({ where: { confirmed: false } }),
    db.contactMessage.count({ where: { read: false } }),
    db.affiliateClick.count(),
    db.article.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        status: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true } },
        author: { select: { name: true } },
      },
    }),
    db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
    db.affiliateClick.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        createdAt: true,
        referer: true,
        offer: { select: { label: true, merchant: { select: { name: true } } } },
        article: { select: { slug: true, type: true, title: true } },
      },
    }),
    db.affiliateClick.count({ where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 3600 * 1000) } } }),
    listPublicImages(),
    db.article.count({ where: { status: "published", publishedAt: { gt: new Date() } } }),
  ]);

  const published = articleGroups.find((g) => g.status === "published")?._count._all ?? 0;
  const drafts = articleGroups.find((g) => g.status === "draft")?._count._all ?? 0;
  const reviews = await db.article.count({ where: { type: "review" } });

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-vermilion">The desk</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Dashboard</h1>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            New article <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </header>

      <section aria-label="Key numbers" className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Published"
          value={published}
          hint={scheduledCount > 0 ? `${scheduledCount} scheduled for later` : undefined}
        />
        <StatCard label="Drafts" value={drafts} />
        <StatCard label="Reviews" value={reviews} />
        <StatCard label="Comparisons" value={comparisons} />
        <StatCard label="Authors" value={authors} />
        <StatCard label="Categories" value={categories} />
        <StatCard label="Merchants" value={merchants} />
        <StatCard label="Active offers" value={activeOffers} />
        <StatCard
          label="Subscribers"
          value={subscribers - pendingSubscribers}
          hint={pendingSubscribers > 0 ? `${pendingSubscribers} pending confirmation` : "all confirmed"}
          href="/admin/subscribers"
        />
        <StatCard label="Unread messages" value={unreadMessages} href="/admin/messages" />
        <StatCard
          label="Media files"
          value={mediaFiles.length}
          hint="images under /images"
          href="/admin/media"
        />
      </section>

      <section aria-label="Recently edited articles" className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-4 p-6">
          <CardHeader className="p-0">
            <CardTitle className="font-display text-xl">Recent articles</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentArticles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing yet — <Link className="underline underline-offset-2 hover:text-foreground" href="/admin/articles/new">write the first article</Link>.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {recentArticles.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/articles/${a.id}`}
                        className="block truncate text-sm font-medium hover:text-vermilion"
                      >
                        {a.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {articleTypeLabels[a.type as ArticleType] ?? a.type} · {a.category?.name ?? "—"} ·{" "}
                        {a.author?.name ?? "—"} · updated {formatDate(a.updatedAt)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} publishedAt={a.publishedAt} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="gap-4 p-6">
          <CardHeader className="p-0">
            <CardTitle className="font-display text-xl">Latest messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">Inbox is empty — nothing yet.</p>
            ) : (
              <ul className="flex flex-col divide-y">
                {recentMessages.map((m) => (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.subject}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {m.name} · {m.email} · {formatDate(m.createdAt)}
                      </p>
                    </div>
                    <ReadBadge read={m.read} />
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/messages">Open inbox <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ---------------------------------------------- Affiliate clicks */}
      <section aria-label="Recent affiliate clicks">
        <Card className="gap-4 p-6">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-0">
            <CardTitle className="flex items-center gap-2 font-display text-xl">
              <MousePointerClick className="h-4 w-4 text-vermilion" aria-hidden="true" />
              Affiliate clicks
            </CardTitle>
            <p className="text-xs tabular-nums text-muted-foreground">
              {clicksLastWeek} in the last 7 days · {clicks} all-time
            </p>
          </CardHeader>
          <CardContent className="p-0">
            {recentClicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No clicks logged yet — every tap on a <code className="rounded-sm bg-muted px-1.5 py-0.5">/go/…</code>{" "}
                link lands here with its offer and source page.
              </p>
            ) : (
              <ul className="flex flex-col divide-y">
                {recentClicks.map((c) => (
                  <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.offer.label}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.offer.merchant.name}
                        {c.article && (
                          <>
                            {" "}· via{" "}
                            <Link
                              href={articlePath(c.article.type as ArticleType, c.article.slug)}
                              className="underline underline-offset-2 hover:text-foreground"
                            >
                              {c.article.title}
                            </Link>
                          </>
                        )}
                      </p>
                    </div>
                    <p className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {c.referer ? <span className="mr-2 font-mono">{new URL(c.referer, "http://x").pathname}</span> : null}
                      {formatDate(c.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
