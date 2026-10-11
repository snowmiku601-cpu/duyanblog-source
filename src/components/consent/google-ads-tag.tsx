"use client";

import Script from "next/script";
import { useEffect, useSyncExternalStore } from "react";
import { getConsentSnapshot, subscribeConsent } from "@/lib/consent";

/**
 * Google Ads measurement tag (destination only — no GA4 site tag, no GTM).
 *
 * Contract (mirrors AdSlot and src/lib/consent.ts):
 * - The tag is configured ONLY via NEXT_PUBLIC_GOOGLE_ADS_ID. If the env var
 *   is absent, nothing loads — on localhost, previews, and the Hostinger
 *   rollback/reference deployment alike.
 * - No request may reach googletagmanager.com before advertising consent is
 *   stored (nothing optional runs before consent).
 * - On advertising consent, gtag.js loads once and configures the single Ads
 *   destination with consent default-denied for every advertising category,
 *   so advertising cookies/storage stay off until explicitly granted.
 * - On revocation (advertising true → false), gtag("consent", "update", …)
 *   denies ad_storage/ad_user_data/ad_personalization — no further
 *   advertising measurement is permitted. Script bytes already in browser
 *   memory cannot be unloaded; the denied consent state is the enforcement.
 *
 * Consent-state side effects use useEffect (deterministic on every consent
 * transition), NOT next/script inline blocks — next/script dedupes inline
 * scripts by id for the page lifetime, so a re-mounted inline deny block
 * would silently never re-execute (found by Task 43 network verification).
 */

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";

const DENIED = { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" } as const;

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

  // Revocation / deny enforcement: whenever advertising consent is false and
  // the tag is configured, re-assert denied consent state on every transition.
  // Safe pre-load too: pushing to dataLayer before gtag.js loads is the
  // standard consent-mode bootstrap pattern.
  useEffect(() => {
    if (!ADS_ID) return;
    if (advertising) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(["consent", "update", DENIED]);
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
gtag('js', new Date());
gtag('consent', 'default', ${JSON.stringify(DENIED)});
gtag('config', '${ADS_ID}');
`}
        </Script>
      </>
    )
  );
}
