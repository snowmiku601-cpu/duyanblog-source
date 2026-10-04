import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Tiny inline-text renderer for article copy.
 *
 * Supported syntax (validated in src/lib/content-schema.ts):
 *   **bold**   *italic*   `code`
 *   [label](https://external.example)   → external, nofollow + new tab
 *   [label](/some/internal/path)        → internal link
 *   [label](go:OFFER_ID)                → tracked affiliate link (rel="sponsored")
 *
 * This keeps affiliate URLs out of article prose (they reference offer IDs,
 * never raw URLs) and avoids dangerouslySetInnerHTML entirely.
 */

const TOKEN_RE = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
const TOKEN_TEST = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/;

export type InlineContext = { articleSlug?: string };

function renderToken(token: string, ctx: InlineContext, key: number): ReactNode {
  // Link: [label](href)
  const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
  if (linkMatch) {
    const [, label, href] = linkMatch;
    if (href.startsWith("go:")) {
      const offerId = href.slice(3);
      const src = ctx.articleSlug ? `?src=${encodeURIComponent(ctx.articleSlug)}` : "";
      return (
        <a
          key={key}
          href={`/go/${encodeURIComponent(offerId)}${src}`}
          rel="sponsored noopener"
          target="_blank"
          className="underline decoration-vermilion/60 decoration-2 underline-offset-2 hover:decoration-vermilion"
        >
          {label}
        </a>
      );
    }
    if (href.startsWith("/")) {
      return (
        <Link
          key={key}
          href={href}
          className="underline decoration-sun decoration-2 underline-offset-2 hover:decoration-primary"
        >
          {label}
        </Link>
      );
    }
    if (href.startsWith("http")) {
      return (
        <a key={key} href={href} rel="nofollow noopener" target="_blank" className="underline underline-offset-2 hover:decoration-primary">
          {label}
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    return <span key={key}>{label}</span>;
  }
  if (token.startsWith("**") && token.endsWith("**")) {
    return <strong key={key} className="font-semibold">{token.slice(2, -2)}</strong>;
  }
  if (token.startsWith("*") && token.endsWith("*")) {
    return <em key={key}>{token.slice(1, -1)}</em>;
  }
  if (token.startsWith("`") && token.endsWith("`")) {
    return (
      <code key={key} className="rounded-sm bg-muted px-1.5 py-0.5 text-[0.9em] font-medium">
        {token.slice(1, -1)}
      </code>
    );
  }
  return <span key={key}>{token}</span>;
}

export function InlineText({ text, ctx = {} }: { text: string; ctx?: InlineContext }) {
  const parts = text.split(TOKEN_RE).filter((p) => p !== "" && p !== undefined);
  return (
    <>
      {parts.map((part, i) =>
        TOKEN_TEST.test(part) ? renderToken(part, ctx, i) : <span key={i}>{part}</span>
      )}
    </>
  );
}
