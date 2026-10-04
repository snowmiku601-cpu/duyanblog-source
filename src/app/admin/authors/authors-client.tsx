"use client";

import { useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, slugify } from "@/lib/admin-client";
import { FormRow } from "../_components/form-row";

export type AuthorRow = {
  id: string;
  slug: string;
  name: string;
  role: string;
  bio: string;
  avatarUrl: string;
  focusAreas: string[];
  articleCount: number;
};

type DialogState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; row: AuthorRow };

const EMPTY = { name: "", slug: "", role: "", bio: "", avatarUrl: "", focusAreas: "" };

export function AuthorsClient({ rows }: { rows: AuthorRow[] }) {
  const { toast } = useToast();
  const [dialog, setDialog] = useState<DialogState>({ mode: "closed" });
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const slugTouched = useRef(false);

  function openCreate() {
    slugTouched.current = false;
    setForm(EMPTY);
    setError(null);
    setDialog({ mode: "create" });
  }

  function openEdit(row: AuthorRow) {
    slugTouched.current = true;
    setForm({
      name: row.name,
      slug: row.slug,
      role: row.role,
      bio: row.bio,
      avatarUrl: row.avatarUrl,
      focusAreas: row.focusAreas.join(", "),
    });
    setError(null);
    setDialog({ mode: "edit", row });
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.slug.trim()) return setError("Slug is required.");
    if (!form.role.trim()) return setError("Role is required (e.g. “Founding editor”).");
    if (!form.bio.trim()) return setError("Bio is required.");

    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      role: form.role.trim(),
      bio: form.bio.trim(),
      avatarUrl: form.avatarUrl.trim() || null,
      focusAreas: form.focusAreas
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const res =
      dialog.mode === "edit"
        ? await api(`/api/admin/authors/${dialog.row.id}`, "PUT", payload)
        : await api("/api/admin/authors", "POST", payload);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast({ title: dialog.mode === "edit" ? "Author updated" : "Author created" });
    setDialog({ mode: "closed" });
  }

  async function onDelete(row: AuthorRow) {
    if (!confirm(`Delete author “${row.name}”? This cannot be undone.`)) return;
    const res = await api(`/api/admin/authors/${row.id}`, "DELETE");
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Author deleted" });
  }

  const open = dialog.mode !== "closed";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Authors</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bylines and public profile pages. Roles only — never fabricate credentials.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New author
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first author — articles need a byline.</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Focus areas</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">/authors/{row.slug}</TableCell>
                  <TableCell className="max-w-52 truncate text-sm">{row.role}</TableCell>
                  <TableCell className="max-w-56 truncate text-sm text-muted-foreground">
                    {row.focusAreas.join(", ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{row.articleCount}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)} aria-label={`Edit ${row.name}`}>
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(row)}
                        aria-label={`Delete ${row.name}`}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => !v && setDialog({ mode: "closed" })}>
        <DialogContent className="max-h-[90vh] overflow-y-auto scroll-thin sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{dialog.mode === "edit" ? "Edit author" : "New author"}</DialogTitle>
            <DialogDescription>
              Public profile lives at <code className="rounded-sm bg-muted px-1">/authors/{form.slug || "slug"}</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="grid gap-4" noValidate>
            <FormRow label="Name" required>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched.current ? f.slug : slugify(name) }));
                }}
              />
            </FormRow>
            <FormRow label="Slug" required>
              <Input
                value={form.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </FormRow>
            <FormRow label="Role" required hint="e.g. “Founding editor”, “Contributing writer”.">
              <Input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} />
            </FormRow>
            <FormRow label="Bio" required>
              <Textarea rows={3} value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} />
            </FormRow>
            <FormRow label="Avatar path" hint="Optional, e.g. /images/authors/maya.png">
              <Input value={form.avatarUrl} onChange={(e) => setForm((f) => ({ ...f, avatarUrl: e.target.value }))} />
            </FormRow>
            <FormRow label="Focus areas" hint="Comma-separated, e.g. “ESIMs, routers, sleep tech”.">
              <Input
                value={form.focusAreas}
                onChange={(e) => setForm((f) => ({ ...f, focusAreas: e.target.value }))}
              />
            </FormRow>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog({ mode: "closed" })} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save author"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
