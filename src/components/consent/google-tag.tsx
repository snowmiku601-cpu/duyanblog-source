"use client";

import Script from "next/script";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useMounted } from "@/hooks/use-mounted";
import { getConsentSnapshot, subscribeConsent } from "@/lib/consent";
import { site } from "@/lib/site";

/**
 * Route prefixes never measured: the authenticated admin surface. Public
 * routes are measured; everything under these prefixes (and any unknown
 * future private route added here) is excluded from GA4 page views.
 */
const PRIVATE_PREFIXES = ["/admin"] as const;

/**
 * Coordinated Google tag — Google Ads (AW) + GA4 (G-) destinations through
 * ONE shared gtag command queue and Google Consent Mode v2. Replaces the
 * single-destination GoogleAdsTag (Task 48) so the two destinations share a
 * single bootstrap and a single gtag.js library load instead of competing.
 *
 * Contract (mirrors AdSlot and src/lib/consent.ts):
 * - Each destination is configured ONLY via its build-time env var
 *   (NEXT_PUBLIC_GOOGLE_ADS_ID / NEXT_PUBLIC_GA4_MEASUREMENT_ID), which
 *   Next.js inlines at BUILD time. An absent var disables that destination
 *   completely — on localhost, previews, and the Hostinger reference site
 *   alike; with both absent, no Google request exists at all. Setting a var
 *   later requires a rebuild (production env mutation is a separate,
 *   review-gated step).
 *
 * Consent Mode v2 lifecycle:
 * - The shared bootstrap stub (dataLayer + gtag) renders once whenever ANY
 *   destination is configured — it makes zero external requests by itself.
 * - The FIRST time gtag.js loads (at least one optional consent granted),
 *   its inline init issues gtag('consent', 'default', ALL-DENIED) BEFORE any
 *   destination config — the v2-required safe baseline.
 * - A consent useEffect re-issues gtag('consent','update',…) on EVERY stored
 *   consent transition (accept, revoke, re-accept without reload, analytics-
 *   only or advertising-only change). Advertising consent alone controls the
 *   advertising categories (ad_storage/ad_user_data); analytics consent alone
 *   controls analytics_storage; one never implies the other;
 *   ad_personalization is never granted (no separate personalization category).
 * - Each destination is configured exactly once per page session (guarded by
 *   a module-level set) the first time its own consent is granted. Revocation
 *   stops application-generated events; script bytes and previously stored
 *   Google cookies cannot be unloaded/erased from here — the denied consent
 *   state is the enforcement.
 */

const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "";
const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID ?? "";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** The shared gtag bootstrap stub (documented command-queue format).
 *  Issues the Consent Mode v2 all-denied DEFAULT from the very first script —
 *  before any destination can ever be configured (v2 ordering requirement).
 *  The stub itself makes zero external requests. */
const GTAG_STUB = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
});
`;

/** Destinations configured on this page so far (per page session). */
const configured = new Set<string>();

function issueConsentUpdate(analytics: boolean, advertising: boolean) {
  window.gtag?.("consent", "update", {
    ad_storage: advertising ? "granted" : "denied",
    ad_user_data: advertising ? "granted" : "denied",
    ad_personalization: "denied",
    analytics_storage: analytics ? "granted" : "denied",
  });
}

export function GoogleTag() {
  const mounted = useMounted();
  const analytics = useSyncExternalStore(
    subscribeConsent,
    () => getConsentSnapshot()?.analytics ?? false,
    () => false
  );
  const advertising = useSyncExternalStore(
    subscribeConsent,
    () => getConsentSnapshot()?.advertising ?? false,
    () => false
  );
  const pathname = usePathname();

  // F1 (review): eligibility — a destination is ELIGIBLE only when BOTH its
  // consent is granted AND its ID is configured. The library id is chosen
  // from the FIRST eligible destination (GA4 preferred so analytics-only
  // consent never loads the Ads library; advertising-only loads AW). Consent
  // for an unconfigured destination triggers nothing.
  const analyticsEligible = analytics && Boolean(GA4_ID);
  const advertisingEligible = advertising && Boolean(ADS_ID);
  const someConsent = analyticsEligible || advertisingEligible;
  const libraryId = analyticsEligible ? GA4_ID : advertisingEligible ? ADS_ID : "";

  // Every consent transition re-issues the full consent state as an update,
  // so the executed command stream always matches the visitor's decision.
  useEffect(() => {
    if (!libraryId || !mounted) return;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag(...args: unknown[]) { window.dataLayer!.push(args); };
    }
    issueConsentUpdate(analytics, advertising);
  }, [analytics, advertising, mounted, libraryId]);

  // Configure each destination ONCE when its own consent first grants. GA4
  // uses send_page_view:false — the page-view effect below owns page views
  // (exactly one per navigation, including the first grant).
  useEffect(() => {
    if (!libraryId || !mounted) return;
    if (advertising && ADS_ID && !configured.has(ADS_ID)) {
      configured.add(ADS_ID);
      window.gtag?.("config", ADS_ID);
    }
    if (analytics && GA4_ID && !configured.has(GA4_ID)) {
      configured.add(GA4_ID);
      window.gtag?.("config", GA4_ID, { send_page_view: false });
    }
  }, [analytics, advertising, mounted, libraryId, pathname]);

  // Application-generated GA4 page views: one per public-route navigation
  // while analytics consent stands. Explicitly routed to the GA4 destination
  // (send_to) so nothing lands on the Ads destination. Query strings and
  // fragments are stripped: page_location is a sanitized ABSOLUTE URL built
  // from the trusted site origin plus the clean pathname; page_title comes
  // from the page's own metadata (never user-generated content), and the
  // referrer is not overridden — GA4 receives document.referrer internally,
  // which is navigation metadata, not form/URL parameters.
  useEffect(() => {
    if (!GA4_ID || !mounted || !analytics) return;
    const path = pathname?.split("?")[0] ?? "";
    if (!path || PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + "/"))) return;
    if (!configured.has(GA4_ID)) return; // not yet configured this session
    window.gtag?.("event", "page_view", {
      send_to: GA4_ID,
      page_path: path,
      page_location: `${site.url}${path}`,
      page_title: document.title,
    });
  }, [GA4_ID, analytics, mounted, pathname]);

  if (!libraryId) return null;

  return (
    <>
      {/* Shared bootstrap — renders once, makes no external requests. */}
      <Script id="dy-gtag-stub" strategy="afterInteractive">
        {GTAG_STUB}
      </Script>
      {/* ONE shared gtag.js library load, first time any optional consent is
          granted. The all-denied consent default was already queued by the
          bootstrap stub (and re-issued by gtag.js's own bootstrap when the
          library loads), so defaults always precede configs. */}
      {someConsent && (
        <Script
          id="dy-gtag-js"
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(libraryId)}`}
        />
      )}
      {someConsent && (
        <Script id="dy-gtag-init" strategy="afterInteractive">
          {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
`}
        </Script>
      )}
    </>
  );
}
