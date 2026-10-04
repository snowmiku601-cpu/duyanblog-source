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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, slugify } from "@/lib/admin-client";
import { FormRow } from "../_components/form-row";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  accent: string;
  order: number;
  articleCount: number;
};

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; row: CategoryRow };

const EMPTY = { name: "", slug: "", tagline: "", description: "", heroImage: "", accent: "amber", order: "0" };

export function CategoriesClient({ rows }: { rows: CategoryRow[] }) {
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

  function openEdit(row: CategoryRow) {
    slugTouched.current = true;
    setForm({
      name: row.name,
      slug: row.slug,
      tagline: row.tagline,
      description: row.description,
      heroImage: row.heroImage,
      accent: row.accent,
      order: String(row.order),
    });
    setError(null);
    setDialog({ mode: "edit", row });
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.slug.trim()) return setError("Slug is required.");
    if (!form.tagline.trim()) return setError("Tagline is required.");
    if (!form.description.trim()) return setError("Description is required.");

    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      tagline: form.tagline.trim(),
      description: form.description.trim(),
      heroImage: form.heroImage.trim() || null,
      accent: form.accent,
      order: Number(form.order) || 0,
    };
    const res =
      dialog.mode === "edit"
        ? await api(`/api/admin/categories/${dialog.row.id}`, "PUT", payload)
        : await api("/api/admin/categories", "POST", payload);
    setBusy(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }
    toast({ title: dialog.mode === "edit" ? "Category updated" : "Category created" });
    setDialog({ mode: "closed" });
  }

  async function onDelete(row: CategoryRow) {
    if (!confirm(`Delete category “${row.name}”? This cannot be undone.`)) return;
    const res = await api(`/api/admin/categories/${row.id}`, "DELETE");
    if (!res.ok) {
      toast({ title: "Delete failed", description: res.error, variant: "destructive" });
      return;
    }
    toast({ title: "Category deleted" });
  }

  const open = dialog.mode !== "closed";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Section hubs at /{rows.map((r) => r.slug).join(" · /") || "…"} — deleting is blocked while articles use them.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New category
        </Button>
      </header>

      {rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="font-display text-lg">Nothing yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Create the first category — articles hang off them.</p>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto scroll-thin rounded-lg border">
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Tagline</TableHead>
                <TableHead>Accent</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Articles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">/{row.slug}</TableCell>
                  <TableCell className="max-w-64 truncate text-sm">{row.tagline}</TableCell>
                  <TableCell className="text-sm capitalize">{row.accent}</TableCell>
                  <TableCell className="text-sm tabular-nums">{row.order}</TableCell>
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
            <DialogTitle>{dialog.mode === "edit" ? "Edit category" : "New category"}</DialogTitle>
            <DialogDescription>
              Public hub lives at <code className="rounded-sm bg-muted px-1">/{form.slug || "slug"}</code>.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onSave} className="grid gap-4" noValidate>
            <FormRow label="Name" required error={error && error.includes("Name") ? error : null}>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: slugTouched.current ? f.slug : slugify(name) }));
                }}
              />
            </FormRow>
            <FormRow label="Slug" required hint="Lowercase letters, numbers, dashes.">
              <Input
                value={form.slug}
                onChange={(e) => {
                  slugTouched.current = true;
                  setForm((f) => ({ ...f, slug: e.target.value }));
                }}
              />
            </FormRow>
            <FormRow label="Tagline" required hint="Short line shown on the hub header.">
              <Input
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                placeholder="Tools that earn their keep"
              />
            </FormRow>
            <FormRow label="Description" required hint="1–2 sentences for the hub intro and SEO description.">
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </FormRow>
            <FormRow label="Hero image path" hint="Optional, e.g. /images/hubs/software.png">
              <Input value={form.heroImage} onChange={(e) => setForm((f) => ({ ...f, heroImage: e.target.value }))} />
            </FormRow>
            <div className="grid grid-cols-2 gap-4">
              <FormRow label="Accent">
                <Select value={form.accent} onValueChange={(v) => setForm((f) => ({ ...f, accent: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amber">Amber</SelectItem>
                    <SelectItem value="ochre">Ochre</SelectItem>
                    <SelectItem value="vermilion">Vermilion</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Order" hint="Lower shows first.">
                <Input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
                />
              </FormRow>
            </div>
            {error && !error.includes("Name") && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setDialog({ mode: "closed" })} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "Saving…" : "Save category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
