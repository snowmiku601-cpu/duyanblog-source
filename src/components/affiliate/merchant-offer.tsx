import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { AffiliateButton, AffiliateDisclosure } from "@/components/affiliate/affiliate-link";
import { cn } from "@/lib/utils";

export type OfferView = {
  id: string;
  label: string;
  url: string;
  price: string | null;
  currency: string;
  note: string | null;
  badge: string | null;
  isDeal: boolean;
  dealText: string | null;
  merchantName: string;
};

/** Merchant offer card — the standard way any offer is presented on-site. */
export function MerchantOffer({
  offer,
  articleSlug,
  compact = false,
  isDemo,
  className,
}: {
  offer: OfferView;
  articleSlug?: string;
  compact?: boolean;
  /** Demo context — REQUIRED (fail closed): a forgotten call site must not present sample commerce as real. */
  isDemo: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card",
        compact ? "p-4" : "p-5",
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow text-muted-foreground">{offer.merchantName}</p>
          <p className={cn("mt-1 font-display font-semibold leading-snug", compact ? "text-base" : "text-lg")}>
            {offer.label}
          </p>
        </div>
        {offer.badge && (
          <Badge className="shrink-0 bg-secondary text-secondary-foreground hover:bg-secondary">
            {offer.badge}
          </Badge>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        {offer.price && (
          <p className="font-display text-xl font-semibold text-primary">
            {offer.price}
            <span className="ml-1 text-xs font-normal text-muted-foreground">{offer.currency}</span>
          </p>
        )}
        {offer.isDeal && offer.dealText && (
          <p className="text-xs font-semibold uppercase tracking-wide text-vermilion">{offer.dealText}</p>
        )}
      </div>

      {offer.note && !compact && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{offer.note}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <AffiliateButton offerId={offer.id} articleSlug={articleSlug} size={compact ? "sm" : "default"}>
          View at {offer.merchantName}
        </AffiliateButton>
        {isDemo && (
          <span className="text-xs font-medium uppercase tracking-wide text-ochre">Sample offer · fictional data</span>
        )}
        {!isDemo && <span className="text-xs text-muted-foreground">on {offer.merchantName}</span>}
      </div>

      {!compact && <AffiliateDisclosure className="mt-4 border-t border-border pt-3" />}
    </div>
  );
}

/** Ultra-compact offer CTA used inside comparison tables and pick rows. */
export function ComparisonOffer({
  offer,
  articleSlug,
}: {
  offer: OfferView;
  articleSlug?: string;
}) {
  return (
    <AffiliateButton offerId={offer.id} articleSlug={articleSlug} size="sm" variant="default">
      {offer.price ? `Get it — ${offer.price}` : "Check price"}
    </AffiliateButton>
  );
}
