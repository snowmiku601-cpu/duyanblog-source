"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { useMounted } from "@/hooks/use-mounted";
import { getConsentSnapshot, subscribeConsent } from "@/lib/consent";

/**
 * Google Ads measurement tag (destination only — no GA4 site tag, no GTM).
 *
 * Contract (mirrors AdSlot and src/lib/consent.ts):
 * - The tag is configured ONLY via NEXT_PUBLIC_GOOGLE_ADS_ID, which Next.js
 *   inlines at BUILD time (like NEXT_PUBLIC_SITE_URL). If the var was absent
 *   when the deployment was built, nothing loads — on localhost, previews,
 *   and the Hostinger rollback/reference deployment alike. Setting it later
 *   requires a rebuild (production env mutation is deliberately a separate,
 *   review-gated step).
 * - No request may reach googletagmanager.com before advertising consent is
 *   stored (nothing optional runs before consent).
 *
 * Consent lifecycle (gtag Consent Mode):
 * - The component ALWAYS renders a gtag bootstrap stub (dataLayer + gtag
 *   function) once the tag is configured — the documented gtag command-queue
 *   format. Every consent transition (accept, revoke, re-accept without
 *   reload, analytics-only change) pushes a real gtag consent command through
 *   that stub from a useEffect, so the executed command stream always matches
 *   the visitor's current decision. Commands issued before gtag.js loads are
 *   queued in dataLayer in the same format and consumed on load.
 * - When the tag loads (advertising consent true), the inline init runs ONCE
 *   (next/script dedupes by id — by design): gtag.js + config for the single
 *   destination. Load-time defaults are granted for the categories the
 *   current decision authorizes (ad_storage/ad_user_data; analytics_storage
 *   mirroring the independent analytics consent) and ad_personalization stays
 *   denied — measurement consent is not personalization consent. The effect
 *   below has already pushed the matching consent command before/with load,
 *   so the default and the update stream agree.
 * - On revocation the update denies ad_storage/ad_user_data/ad_personalization.
 *   Script bytes already in browser memory cannot be unloaded, previously
 *   stored Google cookies are not erased here; the denied consent state is
 *   the enforcement. A later re-accept issues a fresh granted update —
 *   measurement is never stuck in a denied state.
 */

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The gtag bootstrap stub (documented command-queue format). */
const GTAG_STUB = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
`;

export function GoogleAdsTag() {
  const mounted = useMounted();
  const advertising = useSyncExternalStore(
    subscribeConsent,
    () => getConsentSnapshot()?.advertising ?? false,
    () => false
  );
  const analytics = useSyncExternalStore(
    subscribeConsent,
    () => getConsentSnapshot()?.analytics ?? false,
    () => false
  );

  // EVERY consent transition issues a real gtag consent command through the
  // bootstrap stub, so the executed stream always matches the decision:
  // accept/re-accept grants the permitted advertising categories (and mirrors
  // analytics_storage from the independent analytics choice); revoke denies
  // all advertising categories. ad_personalization is never granted.
  useEffect(() => {
    if (!ADS_ID || !mounted) return;
    // The stub may not exist yet on the very first client paint — install it.
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag(...args: unknown[]) { window.dataLayer!.push(args); };
    }
    if (advertising) {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "denied",
        analytics_storage: analytics ? "granted" : "denied",
      });
    } else {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        // analytics_storage is owned by the analytics decision, not the
        // advertising one — leave it untouched here.
      });
    }
  }, [advertising, analytics, mounted]);

  if (!ADS_ID) return null;

  // The stub renders once (id-deduped by next/script) so the gtag command
  // queue contract exists from first paint, before any consent decision.
  return (
    <>
      <Script id="dy-google-ads-stub" strategy="afterInteractive">
        {GTAG_STUB}
      </Script>
      {advertising && (
        <>
          <Script
            id="dy-google-ads-gtag"
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`}
          />
          <Script id="dy-google-ads-init" strategy="afterInteractive">
            {`
${GTAG_STUB}
gtag('consent', 'default', {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'denied',
  analytics_storage: '${analytics ? "granted" : "denied"}'
});
gtag('js', new Date());
gtag('config', '${ADS_ID}');
`}
          </Script>
        </>
      )}
    </>
  );
}
