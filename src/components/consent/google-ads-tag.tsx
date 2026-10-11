"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
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
 * - On advertising consent, gtag.js loads once. The load-time consent default
 *   reflects the decision that authorized the load: ad_storage and
 *   ad_user_data GRANTED (advertising consent exists), ad_personalization
 *   DENIED (measurement consent is not personalization consent), and
 *   analytics_storage mirroring the independently-granted analytics consent.
 *   This default precedes config, so measurement starts in the right state.
 * - On revocation (advertising true → false), a gtag consent update denies
 *   ad_storage/ad_user_data/ad_personalization — no further advertising
 *   measurement is permitted. Script bytes already in browser memory cannot
 *   be unloaded, previously stored Google cookies are not erased here, and
 *   the denied consent state is the enforcement.
 *
 * Consent-state side effects use useEffect (deterministic on every consent
 * transition), NOT next/script inline blocks — next/script dedupes inline
 * scripts by id for the page lifetime, so a re-mounted inline deny block
 * would silently never re-execute (found by Task 43 network verification).
 */

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function GoogleAdsTag() {
  const advertising = useSyncExternalStore(
    subscribeConsent,
    () => getConsentSnapshot()?.advertising ?? false,
    () => false
  );
  // Read once at consent-transition time; the loader only mounts after
  // advertising consent, so the granted/default state matches the decision.
  const analytics = advertising ? (getConsentSnapshot()?.analytics ?? false) : false;

  // Revocation enforcement: whenever advertising consent is false and the tag
  // is configured, deny every advertising category on every transition.
  useEffect(() => {
    if (!ADS_ID || advertising) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push([
      "consent",
      "update",
      { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" },
    ]);
  }, [advertising]);

  if (!ADS_ID) return null;

  return (
    advertising && (
      <>
        <Script
          id="dy-google-ads-gtag"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ADS_ID)}`}
        />
        <Script id="dy-google-ads-init" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
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
    )
  );
}
