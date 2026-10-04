import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, isScheduled } from "../_components/status-badge";
import { DeleteRowButton } from "../_components/delete-row-button";
import { formatDate } from "@/lib/admin-client";
import { articleTypeLabels, type ArticleType } from "@/lib/site";

export const metadata = { title: "Articles — Admin" };

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPage();
  const { status: statusParam, q: qParam } = await searchParams;
  const status =
    statusParam === "draft" || statusParam === "published" || statusParam === "scheduled"
      ? statusParam
      : "all";
  const q = (qParam ?? "").trim().slice(0, 120);

  const all = await db.article.findMany({
    orderBy: { updatedAt: "desc" },
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
  });

  // SQLite via Prisma has no case-insensitive "contains" — filter in JS.
  const needle = q.toLowerCase();
  const rows = all.filter((a) => {
    if (status === "scheduled" && !isScheduled(a.status, a.publishedAt)) return false;
    if (status === "published" && isScheduled(a.status, a.publishedAt)) return false;
    if ((status === "draft" || status === "published") && a.status !== status) return false;
    if (needle && !a.title.toLowerCase().includes(needle)) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Articles</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.length} total · showing {rows.length}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/articles/new">
            <Plus className="h-4 w-4" aria-hidden="true" /> New article
          </Link>
        </Button>
      </header>

      <form method="GET" action="/admin/articles" className="flex flex-wrap items-center gap-2" role="search">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search titles…"
            className="w-56 pl-8"
            aria-label="Search articles by title"
          />
        </div>
        <Select name="status" defaultValue={status}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="draft">Drafts</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" variant="outline">
          Apply
        </Button>
        {(q || status !== "all") && (
          <Button asChild variant="ghost">
            <Link href="/admin/articles">Clear</Link>
          </Button>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {all.length === 0
              ? "No articles at all — create the first one."
              : "No articles match this filter."}
          </p>
          <Button asChild className="mt-4">
            <Link href="/admin/articles/new">
              <Plus className="h-4 w-4" aria-hidden="true" /> New article
            </Link>
          </Button>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-14"><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="max-w-72">
                    <Link
                      href={`/admin/articles/${a.id}`}
                      className="block truncate font-medium hover:text-vermilion"
                      title={a.title}
                    >
                      {a.title}
                    </Link>
                    <span className="text-xs text-muted-foreground">/{a.slug}</span>
                  </TableCell>
                  <TableCell className="text-sm">{articleTypeLabels[a.type as ArticleType] ?? a.type}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} publishedAt={a.publishedAt} />
                  </TableCell>
                  <TableCell className="text-sm">{a.category?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm">{a.author?.name ?? "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(a.publishedAt)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(a.updatedAt)}</TableCell>
                  <TableCell>
                    <DeleteRowButton
                      path={`/api/admin/articles/${a.id}`}
                      label={`“${a.title}”`}
                      confirmText={`Delete “${a.title}”? Its revisions, scores, sources and merchant offers (and their click logs) are removed too. This cannot be undone.`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
