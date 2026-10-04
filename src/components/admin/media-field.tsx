"use client";

import { useMemo, useRef, useState } from "react";
import { CheckCircle2, CloudUpload, ImageIcon, LoaderCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Shared media field used by the article hero and comparison-item images.
 *
 * Four affordances:
 *  1. a datalist of known library paths (type-to-match),
 *  2. a live status line — in library / not in library / remote warning /
 *     load failure — driven purely by the current value (no round-trips),
 *  3. a "Browse" dialog with thumbnails for point-and-pick,
 *  4. drag-and-drop / pick-to-upload straight into the dialog — the file is
 *     POSTed to /api/admin/media, the returned path is selected, and the
 *     library grid gains it for the rest of the session.
 *
 * Purely advisory validation: the APIs accept any root-relative path, and a
 * path that isn't in the library still renders if the file exists. The live
 * <img> preview catches typos without saving anything.
 */
export function MediaField({
  id,
  value,
  onChange,
  media,
  placeholder = "/images/my-image.png",
  browseLabel = "Use this image",
  emptyHint = "Leave empty for no image.",
  ariaLabel = "Browse the media library",
}: {
  id: string;
  value: string;
  onChange: (next: string) => void;
  media: string[];
  placeholder?: string;
  browseLabel?: string;
  emptyHint?: string;
  ariaLabel?: string;
}) {
  const trimmed = value.trim();
  const inLibrary = trimmed !== "" && media.includes(trimmed);
  const looksLocal = trimmed.startsWith("/");
  const [pickerOpen, setPickerOpen] = useState(false);
  // Paths uploaded this session — server props are frozen, so we overlay.
  const [sessionUploads, setSessionUploads] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const library = useMemo(() => {
    const merged = new Set([...media, ...sessionUploads]);
    return [...merged].sort();
  }, [media, sessionUploads]);

  const status = useMemo(() => {
    if (trimmed === "") {
      return { icon: null, text: emptyHint, className: "text-muted-foreground" };
    }
    if (inLibrary || sessionUploads.includes(trimmed)) {
      return {
        icon: (
          <CheckCircle2
            className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
            aria-hidden="true"
          />
        ),
        text: "In the media library.",
        className: "text-muted-foreground",
      };
    }
    if (!looksLocal) {
      return {
        icon: (
          <ImageIcon
            className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400"
            aria-hidden="true"
          />
        ),
        text: "Use a root-relative path like /images/… — remote hosts aren't configured, so external URLs won't render.",
        className: "text-foreground/80",
      };
    }
    return {
      icon: (
        <ImageIcon
          className="h-3.5 w-3.5 shrink-0 text-amber-700 dark:text-amber-400"
          aria-hidden="true"
        />
      ),
      text: "Not in the media library — it still works if the file exists, but double-check for typos.",
      className: "text-foreground/80",
    };
  }, [trimmed, inLibrary, looksLocal, sessionUploads, emptyHint]);

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
        // empty body — fall through
      }
      if (!res.ok || typeof json.path !== "string") {
        setUploadError(typeof json.error === "string" ? json.error : `Upload failed (${res.status}).`);
        return;
      }
      const p = json.path;
      setSessionUploads((prev) => (prev.includes(p) ? prev : [p, ...prev]));
      onChange(p);
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          list={`${id}-media-list`}
          placeholder={placeholder}
          className="flex-1"
          autoComplete="off"
        />
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          onClick={() => setPickerOpen(true)}
          aria-label={ariaLabel}
        >
          <ImageIcon className="h-4 w-4" aria-hidden="true" />
          Browse
        </Button>
      </div>

      <datalist id={`${id}-media-list`}>
        {library.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>

      <div className="flex flex-wrap items-start gap-3">
        <p className={`flex flex-1 items-start gap-1.5 text-xs leading-relaxed ${status.className}`}>
          {status.icon}
          <span>{status.text}</span>
        </p>
        {trimmed !== "" && <MediaPreview key={trimmed} src={trimmed} />}
      </div>

      <Dialog
        open={pickerOpen}
        onOpenChange={(open) => {
          setPickerOpen(open);
          if (!open) {
            setUploadError(null);
            setDragging(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Media library</DialogTitle>
            <DialogDescription>
              {library.length === 0
                ? "No images yet — upload the first one below."
                : `${library.length} image${library.length === 1 ? "" : "s"} under /images — click one to use it.`}
            </DialogDescription>
          </DialogHeader>

          {/* Upload dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center gap-2 rounded-md border border-dashed px-4 py-5 text-center transition-colors",
              dragging ? "border-vermilion bg-vermilion/5" : "border-border",
              uploading && "opacity-60",
            )}
          >
            <CloudUpload
              className={cn("h-5 w-5", dragging ? "text-vermilion" : "text-muted-foreground")}
              aria-hidden="true"
            />
            <p className="text-xs leading-relaxed text-muted-foreground">
              {uploading ? (
                <span className="flex items-center gap-1.5">
                  <LoaderCircle className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Uploading…
                </span>
              ) : (
                <>
                  Drag an image here, or{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:text-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    choose a file
                  </button>{" "}
                  — .png, .jpg, .webp, .gif, .avif, .svg up to 5&nbsp;MB.
                </>
              )}
            </p>
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
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
            >
              {uploadError}
            </p>
          )}

          {library.length === 0 ? (
            <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              The library is empty. Upload above, or drop files into{" "}
              <code className="rounded-sm bg-muted px-1">public/images</code> — both appear here.
            </p>
          ) : (
            <div className="grid max-h-[55vh] grid-cols-2 gap-3 overflow-y-auto scroll-thin sm:grid-cols-3">
              {library.map((p) => {
                const active = p === trimmed;
                const fresh = sessionUploads.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      onChange(p);
                      setPickerOpen(false);
                    }}
                    aria-label={`${browseLabel}: ${p}${active ? " (currently in use)" : ""}`}
                    aria-pressed={active}
                    className={cn(
                      "group relative flex flex-col gap-1.5 rounded-sm border p-1.5 text-left transition-colors hover:border-vermilion/60 hover:bg-accent/40 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "border-vermilion/70 bg-accent/50" : "border-border",
                    )}
                  >
                    <span className="relative block aspect-[4/3] w-full overflow-hidden rounded-[2px] bg-muted/40">
                      <img src={p} alt="" loading="lazy" className="h-full w-full object-cover" />
                      {active && (
                        <span className="absolute right-1 top-1 flex items-center gap-1 rounded-sm bg-vermilion px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          In use
                        </span>
                      )}
                      {fresh && !active && (
                        <span className="absolute left-1 top-1 rounded-sm bg-amber-600 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white">
                          New
                        </span>
                      )}
                    </span>
                    <span className="truncate font-mono text-[10px] text-muted-foreground group-hover:text-foreground">
                      {p.replace(/^\/images\/?/, "")}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Live thumbnail of the typed path — remounts on every path change (key). */
function MediaPreview({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span className="flex aspect-video w-48 shrink-0 items-center justify-center gap-1.5 rounded-sm border border-border bg-muted/40 px-2 text-center text-[11px] leading-snug text-amber-700 dark:text-amber-400">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Couldn&apos;t load — check the path
      </span>
    );
  }

  return (
    <span className="relative block aspect-video w-48 shrink-0 overflow-hidden rounded-sm border border-border bg-muted/40">
      <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
    </span>
  );
}
