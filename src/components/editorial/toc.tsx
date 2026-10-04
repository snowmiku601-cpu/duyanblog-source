import { extractHeadings } from "@/lib/content-schema";
import type { Block } from "@/lib/content-schema";
import { TocNav } from "@/components/editorial/toc-nav";

/** Sticky table of contents built from heading blocks (guides & long reads). */
export function TableOfContents({ blocks, title = "On this page" }: { blocks: Block[]; title?: string }) {
  const headings = extractHeadings(blocks).filter((h) => h.level === 2);
  if (headings.length < 2) return null;
  return <TocNav items={headings} title={title} />;
}
