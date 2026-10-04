import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

/**
 * Affiliate navigation never depends on consent: these are plain anchors to
 * /go/:offerId (a server-side 302), so navigation works with every consent
 * combination. `rel="sponsored"` marks the commercial relationship for search
 * engines; `noopener` pairs with target=_blank. No deceptive redirects: the
 * destination is the offer's declared merchant URL, logged in AffiliateClick.
 */
export function affiliateHref(offerId: string, articleSlug?: string): string {
  return `/go/${encodeURIComponent(offerId)}${articleSlug ? `?src=${encodeURIComponent(articleSlug)}` : ""}`;
}

export function AffiliateLink({
  offerId,
  articleSlug,
  children,
  className,
}: {
  offerId: string;
  articleSlug?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      href={affiliateHref(offerId, articleSlug)}
      rel="sponsored noopener"
      target="_blank"
      className={cn("underline underline-offset-2 hover:decoration-primary", className)}
    >
      {children}
    </a>
  );
}

export function AffiliateButton({
  offerId,
  articleSlug,
  children,
  variant = "default",
  size = "default",
  className,
}: {
  offerId: string;
  articleSlug?: string;
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
  size?: "default" | "sm";
  className?: string;
}) {
  return (
    <Button variant={variant} size={size} className={cn("group font-medium", className)} asChild>
      <a href={affiliateHref(offerId, articleSlug)} rel="sponsored noopener" target="_blank">
        {children}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </a>
    </Button>
  );
}

/** Disclosure shown wherever commerce appears — one click from every offer. */
export function AffiliateDisclosure({
  variant = "inline",
  className,
}: {
  variant?: "inline" | "box";
  className?: string;
}) {
  if (variant === "inline") {
    return (
      <p className={cn("text-xs leading-relaxed text-muted-foreground", className)}>
        <Link href="/affiliate-disclosure" className="underline underline-offset-2 hover:text-foreground">
          Affiliate disclosure
        </Link>
        : we may earn a commission if you buy through links on this page. It never changes our verdicts.
      </p>
    );
  }
  return (
    <aside
      aria-label="Affiliate disclosure"
      className={cn("rounded-sm border border-border bg-muted/50 p-4", className)}
    >
      <p className="eyebrow text-muted-foreground">Why there are buy links here</p>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/80">
        Some links on this page are affiliate links. If you buy through them, we may earn a
        commission from the merchant — it costs you nothing extra and it never changes our
        verdicts, which follow our{" "}
        <Link href="/methodology" className="underline underline-offset-2 hover:text-foreground">
          published methodology
        </Link>{" "}
        and{" "}
        <Link href="/how-we-make-money" className="underline underline-offset-2 hover:text-foreground">
          business rules
        </Link>
        .
      </p>
    </aside>
  );
}
