"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { api, slugify } from "@/lib/admin-client";
import { MediaField } from "@/components/admin/media-field";
import { FormRow } from "../_components/form-row";
import { JsonField, parseJsonField } from "../_components/json-field";

/**
 * Canonical form-state shape: every input-backed field is a string ("" = empty),
 * so inputs never receive null. Nullable Prisma fields are converted at both
 * boundaries — page → form (null → "") and form → API payload ("" → null).
 */
export type ArticleFormState = {
  id: string;
  title: string;
  slug: string;
  type: string;
  status: string;
  deck: string;
  tldr: string;
  heroImage: string;
  heroAlt: string;
  heroCredit: string;
  categoryId: string;
  authorId: string;
  reviewerId: string;
  readingMinutes: string;
  featured: boolean;
  publishedAt: string;
  lastReviewedAt: string;
  tags: string;
  blocks: string;
  scores: string;
  sources: string;
};

export type ArticleFormOptions = {
  categories: { id: string; name: string }[];
  authors: { id: string; name: string }[];
  offers: { id: string; label: string }[];
  /** Public image paths for the hero datalist + "in library" hint. */
  media: string[];
};

const TYPES = [
  { value: "review", label: "Review" },
  { value: "roundup", label: "Best picks (roundup)" },
  { value: "versus", label: "Versus" },
  { value: "guide", label: "Guide" },
  { value: "editorial", label: "Editorial" },
];

const BLOCKS_HINT = `Array of blocks. Types: paragraph {"type":"paragraph","text":"**bold**, *italic*, \`code\`, [links](https://…), [internal](/path), [affiliate](go:OFFER_ID), [ref](ref:SLUG)"}, heading {"type":"heading","level":2,"text":"…"}, list {"type":"list","ordered":false,"items":["…"]}, quote, callout {"variant":"note|warning|tip"}, prosCons, stats, table, image {"src","alt"}, pick {"rank","name","blurb"}, comparisonEmbed {"comparisonSlug"}, offerEmbed {"offerId"}, faq, sources, divider.`;

const SCORES_HINT = `Review scorecard, e.g. [{"label":"Performance","score":8.5,"weight":2,"note":"why this score"}]. Score 0–10, weight 1–10.`;

const SOURCES_HINT = `Citations shown with the article, e.g. [{"label":"Vendor spec sheet","url":"https://…"}]. URL optional.`;

export function ArticleForm({
  article,
  options,
}: {
  /** Normalized form state of the saved article, or null when creating. */
  article: ArticleFormState | null;
  options: ArticleFormOptions;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const slugTouched = useRef(article !== null);

  const [form, setForm] = useState<ArticleFormState>(
    article ?? {
      id: "",
      title: "",
      slug: "",
      type: "review",
      status: "draft",
      deck: "",
      tldr: "",
      heroImage: "",
      heroAlt: "",
      heroCredit: "",
      categoryId: options.categories[0]?.id ?? "",
      authorId: options.authors[0]?.id ?? "",
      reviewerId: "",
      readingMinutes: "",
      featured: false,
      publishedAt: "",
      lastReviewedAt: "",
      tags: "",
      blocks: "",
      scores: "",
      sources: "",
    }
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof ArticleFormState>(key: K, value: ArticleFormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onTitleChange(value: string) {
    setForm((f) => ({
      ...f,
      title: value,
      slug: slugTouched.current ? f.slug : slugify(value),
    }));
  }

  async function onSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;

    if (!form.title.trim()) return setError("Title is required.");
    if (!form.slug.trim()) return setError("Slug is required.");
    if (!form.deck.trim()) return setError("Deck is required.");
    if (!form.categoryId) return setError("Choose a category — create one under Categories if the list is empty.");
    if (!form.authorId) return setError("Choose an author — create one under Authors if the list is empty.");

    const minsRaw = form.readingMinutes.trim();
    let readingMinutes: number | null = null;
    if (minsRaw !== "") {
      const mins = Number(minsRaw);
      if (!Number.isInteger(mins) || mins < 0 || mins > 600) {
        return setError("Reading minutes must be a whole number between 0 and 600.");
      }
      readingMinutes = mins;
    }

    const blocks = parseJsonField("Blocks", form.blocks, []);
    if (!blocks.ok) return setError(blocks.error);
    const scores = parseJsonField("Scores", form.scores, []);
    if (!scores.ok) return setError(scores.error);
    const sources = parseJsonField("Sources", form.sources, []);
    if (!sources.ok) return setError(sources.error);

    setError(null);
    setBusy(true);

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      type: form.type,
      status: form.status,
      deck: form.deck.trim(),
      tldr: form.tldr.trim() || null,
      heroImage: form.heroImage.trim() || null,
      heroAlt: form.heroAlt.trim() || null,
      heroCredit: form.heroCredit.trim() || null,
      categoryId: form.categoryId,
      authorId: form.authorId,
      reviewerId: form.reviewerId.trim() || null,
      readingMinutes,
      featured: form.featured,
      publishedAt: form.publishedAt || null,
      lastReviewedAt: form.lastReviewedAt || null,
      tags: form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 24),
      blocks: blocks.data,
      scores: scores.data,
      sources: sources.data,
    };

    const res = article
      ? await api<{ ok: boolean }>(`/api/admin/articles/${article.id}`, "PUT", payload)
      : await api<{ ok: boolean }>("/api/admin/articles", "POST", payload);

    if (!res.ok) {
      setError(res.error);
      toast({ title: "Save failed", description: res.error, variant: "destructive" });
      setBusy(false);
      return;
    }
    toast({ title: "Article saved", description: `“${form.title.trim()}” stored with a revision snapshot.` });
    router.push("/admin/articles");
  }

  return (
    <form onSubmit={onSave} className="flex flex-col gap-6" noValidate>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {article ? "Edit article" : "New article"}
          </h1>
          {article && (
            <p className="mt-1 text-sm text-muted-foreground">
              Every save snapshots an <span className="font-medium">ArticleRevision</span>.
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" onClick={() => router.push("/admin/articles")} disabled={busy}>
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            <Save className="h-4 w-4" aria-hidden="true" />
            {busy ? "Saving…" : "Save article"}
          </Button>
        </div>
      </header>

      {error && (
        <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardContent className="grid gap-5 p-6">
              <FormRow label="Title" htmlFor="af-title" required>
                <Input
                  id="af-title"
                  value={form.title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  placeholder="The eSIM that actually survived three borders"
                />
              </FormRow>
              <FormRow
                label="Slug"
                htmlFor="af-slug"
                required
                hint="Lowercase, dashes. Auto-generated from the title until you edit it."
              >
                <Input
                  id="af-slug"
                  value={form.slug}
                  onChange={(e) => {
                    slugTouched.current = true;
                    set("slug", e.target.value);
                  }}
                />
              </FormRow>
              <FormRow label="Deck" htmlFor="af-deck" required hint="Standfirst shown under the headline; doubles as excerpt.">
                <Textarea
                  id="af-deck"
                  rows={2}
                  value={form.deck}
                  onChange={(e) => set("deck", e.target.value)}
                />
              </FormRow>
              <FormRow label="TL;DR" htmlFor="af-tldr" hint="Optional verdict box at the top of the page.">
                <Textarea id="af-tldr" rows={2} value={form.tldr} onChange={(e) => set("tldr", e.target.value)} />
              </FormRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-5 p-6 sm:grid-cols-2">
              <FormRow
                label="Hero image path"
                htmlFor="af-hero"
                hint="Pick from the library, drop in a new file, or type a path."
              >
                <MediaField
                  id="af-hero"
                  value={form.heroImage}
                  onChange={(v) => set("heroImage", v)}
                  media={options.media}
                  emptyHint="Leave empty for a text-only hero."
                  browseLabel="Use as the hero image"
                />
              </FormRow>
              <FormRow label="Hero alt text" htmlFor="af-heroalt">
                <Input id="af-heroalt" value={form.heroAlt} onChange={(e) => set("heroAlt", e.target.value)} />
              </FormRow>
              <FormRow label="Image credit" htmlFor="af-herocredit">
                <Input id="af-herocredit" value={form.heroCredit} onChange={(e) => set("heroCredit", e.target.value)} />
              </FormRow>
              <FormRow label="Reading minutes" htmlFor="af-mins" hint="Leave empty to auto-calculate from the body copy (≈200 wpm) on save.">
                <Input
                  id="af-mins"
                  type="number"
                  min={0}
                  max={600}
                  placeholder="Auto"
                  value={form.readingMinutes}
                  onChange={(e) => set("readingMinutes", e.target.value)}
                />
              </FormRow>
              <FormRow label="Tags" htmlFor="af-tags" hint="Comma-separated; created on first use.">
                <Input
                  id="af-tags"
                  value={form.tags}
                  onChange={(e) => set("tags", e.target.value)}
                  placeholder="esim, travel, connectivity"
                />
              </FormRow>
              <div className="flex items-end">
                <div className="flex items-center gap-3">
                  <Switch id="af-featured" checked={form.featured} onCheckedChange={(v) => set("featured", v)} />
                  <Label htmlFor="af-featured">Featured on the homepage</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-4 p-6">
              <JsonField
                label="Blocks (article body)"
                value={form.blocks}
                onChange={(v) => set("blocks", v)}
                hint={BLOCKS_HINT}
                rows={12}
                placeholder='[{"type":"paragraph","text":"Start writing…"}]'
              />
              <JsonField
                label="Scores (review scorecard)"
                value={form.scores}
                onChange={(v) => set("scores", v)}
                hint={SCORES_HINT}
                rows={5}
                placeholder='[{"label":"Performance","score":8.5,"weight":2}]'
              />
              <JsonField
                label="Sources"
                value={form.sources}
                onChange={(v) => set("sources", v)}
                hint={SOURCES_HINT}
                rows={5}
                placeholder='[{"label":"Vendor spec sheet","url":"https://…"}]'
              />
              {options.offers.length > 0 && (
                <p className="col-span-full text-xs leading-relaxed text-muted-foreground">
                  Affiliate links inside text: <code className="rounded-sm bg-muted px-1">[label](go:OFFER_ID)</code>.
                  Current offer IDs: {options.offers.slice(0, 8).map((o) => o.id).join(", ")}
                  {options.offers.length > 8 && " …"} — full list under <em>Offers</em>.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar column */}
        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="grid gap-5 p-6">
              <FormRow label="Type" htmlFor="af-type" required hint="Determines the public URL: /reviews, /best, /compare, /guides, /articles.">
                <Select value={form.type} onValueChange={(v) => set("type", v)}>
                  <SelectTrigger id="af-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Status" htmlFor="af-status" required>
                <Select value={form.status} onValueChange={(v) => set("status", v)}>
                  <SelectTrigger id="af-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Category" htmlFor="af-category" required>
                <Select value={form.categoryId} onValueChange={(v) => set("categoryId", v)}>
                  <SelectTrigger id="af-category">
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Author" htmlFor="af-author" required>
                <Select value={form.authorId} onValueChange={(v) => set("authorId", v)}>
                  <SelectTrigger id="af-author">
                    <SelectValue placeholder="Choose…" />
                  </SelectTrigger>
                  <SelectContent>
                    {options.authors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
              <FormRow label="Reviewer" htmlFor="af-reviewer" hint="Optional second set of eyes.">
                <Select value={form.reviewerId} onValueChange={(v) => set("reviewerId", v)}>
                  <SelectTrigger id="af-reviewer">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {options.authors.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormRow>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-5 p-6">
              <FormRow
                label="Published at"
                htmlFor="af-pub"
                hint="Leave empty while a draft. Set a future date to schedule — the story stays hidden until then, then goes live within ~5 minutes."
              >
                <Input
                  id="af-pub"
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => set("publishedAt", e.target.value)}
                />
              </FormRow>
              <FormRow label="Last reviewed at" htmlFor="af-rev" hint="Freshness signal shown on public pages.">
                <Input
                  id="af-rev"
                  type="datetime-local"
                  value={form.lastReviewedAt}
                  onChange={(e) => set("lastReviewedAt", e.target.value)}
                />
              </FormRow>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  );
}
