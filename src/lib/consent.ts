"use client";

/**
 * Consent state for duyanblog.com.
 *
 * Three categories: necessary (always on), analytics, advertising.
 * - Nothing optional may run before consent is stored (see AdSlot/analytics).
 * - Affiliate links are plain <a href="/go/…"> and work with zero consent —
 *   tracking and navigation are separate concerns.
 * - This layer is deliberately small and replaceable with a full CMP later
 *   (same event contract). It does NOT claim GDPR compliance by itself.
 */

export type ConsentState = {
  necessary: true;
  analytics: boolean;
  advertising: boolean;
  decidedAt: string;
};

const STORAGE_KEY = "dy-consent-v1";
export const CONSENT_EVENT = "dy:consent";
export const CONSENT_OPEN_EVENT = "dy:consent-open";

export function loadConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ConsentState>;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.advertising !== "boolean") return null;
    return { necessary: true, analytics: parsed.analytics, advertising: parsed.advertising, decidedAt: parsed.decidedAt ?? new Date().toISOString() };
  } catch {
    return null;
  }
}

/**
 * Snapshot + subscribe pair for useSyncExternalStore — the React-idiomatic way
 * to read consent without setState-in-effect. Snapshots are memoized because
 * the store contract requires referentially stable values.
 */
let snapshotCache: { raw: string; state: ConsentState | null } | null = null;

export function getConsentSnapshot(): ConsentState | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? "";
  if (snapshotCache && snapshotCache.raw === raw) return snapshotCache.state;
  const state = raw ? loadConsent() : null;
  snapshotCache = { raw, state };
  return state;
}

export function subscribeConsent(callback: () => void): () => void {
  window.addEventListener(CONSENT_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CONSENT_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

export function saveConsent(choices: { analytics: boolean; advertising: boolean }): ConsentState {
  const state: ConsentState = {
    necessary: true,
    analytics: choices.analytics,
    advertising: choices.advertising,
    decidedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
  }
  return state;
}

export function openConsentSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CONSENT_OPEN_EVENT));
  }
}

export function onConsentChange(cb: (state: ConsentState) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => cb((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}

/**
 * Analytics adapter. Intentionally a no-op queue until (a) the visitor grants
 * analytics consent and (b) a real provider is configured via
 * NEXT_PUBLIC_ANALYTICS_PROVIDER (see AFFILIATE_INTEGRATION.md / DESIGN.md).
 */
export function trackEvent(name: string, props: Record<string, unknown> = {}): void {
  if (typeof window === "undefined") return;
  const consent = loadConsent();
  if (!consent?.analytics) return;
  const w = window as unknown as { __dyAnalytics?: (n: string, p: Record<string, unknown>) => void };
  w.__dyAnalytics?.(name, props);
}
