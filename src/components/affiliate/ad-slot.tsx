"use client";

import { useSyncExternalStore } from "react";
import { getConsentSnapshot, subscribeConsent } from "@/lib/consent";

/**
 * AdSlot — reusable advertising container.
 *
 * Ads are DISABLED by default. Two gates must both open before anything
 * renders:
 *   1. `enabled` — passed from the server, driven by the `ads_enabled` site
 *      setting with NEXT_PUBLIC_ADS_ENABLED as fallback (src/lib/settings.ts).
 *   2. `advertising` consent from the visitor (nothing loads before consent).
 *
 * When a real network is integrated, load its script inside this component
 * only after consent (see AFFILIATE_INTEGRATION.md). The reserved box keeps a
 * stable aspect ratio to avoid layout shift.
 */
export function AdSlot({
  enabled,
  slotId,
  label = "Advertisement",
  className,
}: {
  enabled: boolean;
  slotId: string;
  label?: string;
  className?: string;
}) {
  const advertisingConsent = useSyncExternalStore(
    subscribeConsent,
    () => getConsentSnapshot()?.advertising ?? false,
    () => false
  );

  if (!enabled) return null;
  if (!advertisingConsent) return null;

  return (
    <aside
      role="complementary"
      aria-label={label}
      data-ad-slot={slotId}
      className={
        className ??
        "my-8 flex min-h-24 items-center justify-center rounded-sm border border-dashed border-border bg-muted/40"
      }
    >
      <span className="eyebrow text-muted-foreground/70">{label} — slot {slotId}</span>
      {/* Integrate the ad network's markup here, after consent. */}
    </aside>
  );
}
