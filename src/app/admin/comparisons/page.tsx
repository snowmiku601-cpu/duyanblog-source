import Link from "next/link";
import { Plus } from "lucide-react";
import { requireAdminPage } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteRowButton } from "../_components/delete-row-button";
import { formatDate } from "@/lib/admin-client";

export const metadata = { title: "Comparisons — Admin" };

export default async function AdminComparisonsPage() {
  await requireAdminPage();

  const rows = await db.comparison.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      article: { select: { title: true, type: true } },
      items: { select: { id: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Comparisons</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Side-by-side tables at /compare/[slug] — embedded in versus articles or standalone.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/comparisons/new">
            <Plus className="h-4 w-4" aria-hidden="true" /> New comparison
          </Link>
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first comparison table.</p>
          <Button asChild className="mt-4">
            <Link href="/admin/comparisons/new">
              <Plus className="h-4 w-4" aria-hidden="true" /> New comparison
            </Link>
          </Button>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Linked article</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/comparisons/${row.id}`} className="hover:text-vermilion">
                      {row.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">/compare/{row.slug}</TableCell>
                  <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                    {row.article?.title ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{row.items.length}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/admin/comparisons/${row.id}`}>Edit</Link>
                      </Button>
                      <DeleteRowButton
                        path={`/api/admin/comparisons/${row.id}`}
                        label={`“${row.title}”`}
                        confirmText={`Delete comparison “${row.title}”? Its items are removed too.`}
                      />
                    </div>
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
