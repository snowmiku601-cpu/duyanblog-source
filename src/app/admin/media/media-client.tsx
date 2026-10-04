"use client";

import { useMemo, useRef, useState } from "react";
import {
  ArrowUpDown,
  CheckCircle2,
  CloudUpload,
  Copy,
  ExternalLink,
  FileWarning,
  HardDrive,
  Images,
  Link2Off,
  LoaderCircle,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export type UsageRef = { label: string; href: string };

export type MediaItem = {
  path: string;
  bytes: number;
  modified: string;
  usedIn: UsageRef[];
  dimensions: { width: number; height: number } | null;
};

type Filter = "all" | "used" | "unused";
type SortKey = "name" | "newest" | "largest";

const SORTS: Array<{ key: SortKey; label: string }> = [
  { key: "name", label: "Name A→Z" },
  { key: "newest", label: "Newest first" },
  { key: "largest", label: "Largest first" },
];

function formatBytes(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function extOf(p: string): string {
  const m = /\.([a-z0-9]+)$/i.exec(p);
  return m ? m[1].toUpperCase() : "?";
}

const STORAGE_WARN_BYTES = 80 * 1024 * 1024; // amber note past 80 MB on disk

export function MediaClient({ items }: { items: MediaItem[] }) {
  const { toast } = useToast();
  const [files, setFiles] = useState<MediaItem[]>(items);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortKey>("name");
  const [pendingDelete, setPendingDelete] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [newPaths, setNewPaths] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const usedCount = files.filter((f) => f.usedIn.length > 0).length;
  const unusedCount = files.length - usedCount;
  const totalBytes = files.reduce((sum, f) => sum + f.bytes, 0);
  const unusedBytes = files.filter((f) => f.usedIn.length === 0).reduce((s, f) => s + f.bytes, 0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = files.filter((f) => {
      if (q && !f.path.toLowerCase().includes(q)) return false;
      if (filter === "used") return f.usedIn.length > 0;
      if (filter === "unused") return f.usedIn.length === 0;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.path.localeCompare(b.path);
      if (sort === "largest") return b.bytes - a.bytes;
      return (b.modified || "").localeCompare(a.modified || "");
    });
    return list;
  }, [files, query, filter, sort]);

  async function upload(file: File) {
    setUploadError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch("/api/admin/media", { method: "POST", body });
      let json: Record<string, unknown> = {};
      try {
        json = (await res.json()) as Record<string, unknown>;
      } catch {
        // empty body
      }
      if (!res.ok || typeof json.path !== "string") {
        setUploadError(typeof json.error === "string" ? json.error : `Upload failed (${res.status}).`);
        return;
      }
      const p = json.path;
      setFiles((prev) =>
        prev.some((f) => f.path === p)
          ? prev
          : [{ path: p, bytes: file.size, modified: new Date().toISOString(), usedIn: [], dimensions: null }, ...prev],
      );
      setNewPaths((prev) => (prev.includes(p) ? prev : [p, ...prev]));
      toast({ title: "Uploaded", description: p });
    } catch {
      setUploadError("Upload failed — is the server running?");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void upload(file);
  }

  function requestDelete(item: MediaItem) {
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete || deleting) return;
    setDeleting(true);
    const target = pendingDelete;
    let json: Record<string, unknown> = {};
    let status = 0;
    try {
      const res = await fetch(`/api/admin/media?path=${encodeURIComponent(target.path)}`, {
        method: "DELETE",
      });
      status = res.status;
      try {
        json = (await res.json()) as Record<string, unknown>;
      } catch {
        // empty body
      }
    } catch {
      status = 0;
    }
    setDeleting(false);

    if (status === 409) {
      const usedIn = Array.isArray(json.usedIn)
        ? (json.usedIn as UsageRef[]).map((r) => ({ label: String(r.label), href: String(r.href) }))
        : [];
      toast({
        title: "Still in use",
        description:
          usedIn.length > 0
            ? `${target.path} is referenced by: ${usedIn.map((r) => r.label).join(", ")}. Remove those references first.`
            : typeof json.error === "string"
              ? json.error
              : "This image is still referenced by a page.",
        variant: "destructive",
      });
      setPendingDelete(null);
      return;
    }
    if (status !== 200) {
      toast({
        title: "Delete failed",
        description: typeof json.error === "string" ? json.error : `Request failed (${status}).`,
        variant: "destructive",
      });
      setPendingDelete(null);
      return;
    }
    setFiles((prev) => prev.filter((f) => f.path !== target.path));
    setNewPaths((prev) => prev.filter((p) => p !== target.path));
    setPendingDelete(null);
    toast({ title: "Deleted", description: `${target.path} removed from the library.` });
  }

  function copyPath(p: string) {
    void navigator.clipboard?.writeText(p);
    toast({ title: "Path copied", description: p });
  }

  /** Delete every file the server currently reports as unused. */
  async function bulkDeleteUnused() {
    if (bulkBusy) return;
    setBulkBusy(true);
    const targets = files.filter((f) => f.usedIn.length === 0).map((f) => f.path);
    let json: { deleted?: string[]; skipped?: Array<{ path: string; reason: string }> } = {};
    let networkError = false;
    try {
      const res = await fetch("/api/admin/media/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paths: targets }),
      });
      json = (await res.json().catch(() => ({}))) as typeof json;
    } catch {
      networkError = true;
    }
    setBulkBusy(false);
    setBulkOpen(false);

    if (networkError) {
      toast({ title: "Bulk delete failed", description: "Network error — is the server running?", variant: "destructive" });
      return;
    }
    const deleted = json.deleted ?? [];
    const skipped = json.skipped ?? [];
    if (deleted.length > 0) {
      const gone = new Set(deleted);
      setFiles((prev) => prev.filter((f) => !gone.has(f.path)));
      setNewPaths((prev) => prev.filter((p) => !gone.has(p)));
    }
    if (skipped.length > 0) {
      toast({
        title: `Deleted ${deleted.length} · skipped ${skipped.length}`,
        description: skipped.slice(0, 3).map((s) => `${s.path.replace(/^\/images\//, "")} — ${s.reason}`).join(" · "),
        variant: "destructive",
      });
    } else if (deleted.length > 0) {
      toast({ title: `Deleted ${deleted.length} file${deleted.length === 1 ? "" : "s"}`, description: `${formatBytes(unusedBytes)} freed.` });
    } else {
      toast({ title: "Nothing to delete", description: "Every file is still referenced by a page." });
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-vermilion">The desk</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Media library</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {files.length} file{files.length === 1 ? "" : "s"} · {formatBytes(totalBytes)} on disk ·{" "}
            {usedCount} in use · {unusedCount} unused. Everything lives under{" "}
            <code className="rounded-sm bg-muted px-1.5 py-0.5">public/images</code>.
          </p>
          {totalBytes > STORAGE_WARN_BYTES && (
            <p
              role="status"
              className="mt-2 inline-flex items-center gap-1.5 rounded-sm border border-amber-600/40 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400"
            >
              <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
              Media is {formatBytes(totalBytes)} on disk — past the 80 MB comfort line. Consider
              deleting unused files.
            </p>
          )}
        </div>
        {unusedCount > 0 && (
          <Button
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="border-amber-600/40 text-amber-700 hover:bg-amber-500/10 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete unused ({unusedCount})
          </Button>
        )}
      </header>

      {/* Upload dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-wrap items-center justify-between gap-4 rounded-md border border-dashed px-5 py-4 transition-colors",
          dragging ? "border-vermilion bg-vermilion/5" : "border-border",
          uploading && "opacity-60",
        )}
      >
        <div className="flex items-center gap-3">
          <CloudUpload
            className={cn("h-5 w-5 shrink-0", dragging ? "text-vermilion" : "text-muted-foreground")}
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">
            {uploading ? (
              <span className="flex items-center gap-1.5">
                <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                Uploading…
              </span>
            ) : (
              <>
                Drag an image here, or{" "}
                <button
                  type="button"
                  className="font-medium text-foreground underline underline-offset-2 hover:text-vermilion"
                  onClick={() => fileInputRef.current?.click()}
                >
                  choose a file
                </button>{" "}
                — .png, .jpg, .webp, .gif, .avif, .svg up to 5&nbsp;MB. Bytes are sniffed, so a
                misnamed file is refused.
              </>
            )}
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.avif,.svg,image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
          className="sr-only"
          aria-label="Upload an image to the media library"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
            e.target.value = "";
          }}
        />
      </div>
      {uploadError && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {uploadError}
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by file name…"
            aria-label="Search the media library"
            className="pl-8"
          />
        </div>

        <div role="group" aria-label="Filter by usage" className="flex items-center gap-1">
          {(
            [
              { key: "all", label: `All ${files.length}` },
              { key: "used", label: `In use ${usedCount}` },
              { key: "unused", label: `Unused ${files.length - usedCount}` },
            ] as Array<{ key: Filter; label: string }>
          ).map((f) => (
            <button
              key={f.key}
              type="button"
              aria-pressed={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-sm border px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "border-vermilion/60 bg-vermilion/10 text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-xs text-muted-foreground lg:ml-auto">
          <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">Sort files</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-sm border border-border bg-card px-2 py-1.5 text-xs text-foreground"
            aria-label="Sort order"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <span className="text-xs tabular-nums text-muted-foreground" aria-live="polite">
          {visible.length} of {files.length} shown
        </span>
      </div>

      {/* Grid */}
      {visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-10 text-center">
          <Images className="mx-auto mb-3 h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">
            {files.length === 0
              ? "The library is empty — upload the first image above."
              : "Nothing matches this filter."}
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((f) => (
            <MediaTile
              key={f.path}
              item={f}
              fresh={newPaths.includes(f.path)}
              onCopy={() => copyPath(f.path)}
              onDelete={() => requestDelete(f)}
            />
          ))}
        </ul>
      )}

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkOpen} onOpenChange={(open) => !open && !bulkBusy && setBulkOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all {unusedCount} unused file{unusedCount === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  This frees about {formatBytes(unusedBytes)}. Files are removed from disk immediately
                  and can&apos;t be recovered.
                </p>
                <p>
                  The server re-checks usage per file — anything that gained a reference since this
                  page loaded is skipped, not deleted.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Keep them</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkBusy}
              onClick={(e) => {
                e.preventDefault();
                void bulkDeleteUnused();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkBusy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete {unusedCount} file{unusedCount === 1 ? "" : "s"}
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.path.replace(/^\/images\//, "")}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  The file is removed from disk immediately and can&apos;t be recovered. Pages using a
                  deleted path would show a broken image.
                </p>
                {pendingDelete && pendingDelete.usedIn.length > 0 && (
                  <p className="font-medium text-destructive">
                    Currently referenced by {pendingDelete.usedIn.length} page
                    {pendingDelete.usedIn.length === 1 ? "" : "s"} — the delete will be refused until
                    those references are removed.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep it</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> Deleting…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete file
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MediaTile({
  item,
  fresh,
  onCopy,
  onDelete,
}: {
  item: MediaItem;
  fresh: boolean;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const used = item.usedIn.length > 0;
  const name = item.path.replace(/^\/images\//, "");

  return (
    <li
      className={cn(
        "group flex flex-col gap-3 rounded-md border bg-card p-3 transition-colors",
        used ? "border-border" : "border-dashed border-amber-600/40",
      )}
    >
      {/* Thumbnail */}
      <a
        href={item.path}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open ${name} full size`}
        className="relative block aspect-[16/9] w-full overflow-hidden rounded-sm border border-border bg-muted/40"
      >
        <img
          src={item.path}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
        {fresh && (
          <span className="absolute left-2 top-2 rounded-sm bg-amber-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
            New
          </span>
        )}
        <span
          className={cn(
            "absolute right-2 top-2 flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
            used ? "bg-emerald-700 text-white" : "bg-amber-600 text-white",
          )}
        >
          {used ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> : <Link2Off className="h-3 w-3" aria-hidden="true" />}
          {used ? "In use" : "Unused"}
        </span>
      </a>

      {/* Meta */}
      <div className="min-w-0">
        <p className="truncate font-mono text-xs font-medium" title={item.path}>
          {name}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[10px]">{extOf(item.path)}</span>
          <span className="tabular-nums">{formatBytes(item.bytes)}</span>
          {item.dimensions && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums" title="Pixel dimensions">
                {item.dimensions.width} × {item.dimensions.height}
              </span>
            </>
          )}
          <span aria-hidden="true">·</span>
          <span>added {formatDate(item.modified)}</span>
        </p>
      </div>

      {/* Usage refs */}
      <div className="min-h-6">
        {used ? (
          <ul className="flex flex-wrap gap-1">
            {item.usedIn.slice(0, 2).map((ref) => (
              <li key={ref.href + ref.label}>
                <a
                  href={ref.href}
                  className="inline-block max-w-52 truncate rounded-sm border border-border bg-accent/40 px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:border-vermilion/50 hover:text-foreground"
                  title={ref.label}
                >
                  {ref.label}
                </a>
              </li>
            ))}
            {item.usedIn.length > 2 && (
              <li className="self-center text-[11px] text-muted-foreground">
                +{item.usedIn.length - 2} more
              </li>
            )}
          </ul>
        ) : (
          <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <FileWarning className="h-3 w-3 shrink-0 text-amber-700 dark:text-amber-400" aria-hidden="true" />
            Not referenced by any page — safe to delete.
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-auto flex items-center gap-1 border-t border-border pt-2.5">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          onClick={onCopy}
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy path
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
          asChild
        >
          <a href={item.path} target="_blank" rel="noreferrer">
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> Open
          </a>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-xs text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={onDelete}
          aria-label={`Delete ${name} from the library`}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
        </Button>
      </div>
    </li>
  );
}
