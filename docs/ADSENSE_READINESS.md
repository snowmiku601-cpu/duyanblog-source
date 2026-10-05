# AdSense readiness — status: NOT READY

> **Status: NOT READY.** Advertising is disabled on duyanblog.com. No ad network is
> configured, no ad script loads anywhere, and no certified consent-management platform
> (CMP) is integrated. This document records that state and the checklist that must be
> completed, as a **separate, owner-authorized integration task**, before any advertising
> may serve. Nothing in this file is a promise that ads can be enabled by flipping a
> switch — they cannot.

## Current state (true as of 2026-10-05)

- **Ads disabled by default.** `ads_enabled` is a `SiteSetting` seeded to `false`.
  `NEXT_PUBLIC_ADS_ENABLED` is documented in `.env.example` as a fallback but is **not
  read by the application code yet** — the runtime gate is the DB setting
  (`src/lib/settings.ts` → `isAdsEnabled()`).
- **No ad network configured.** The `AdSlot` component (`src/components/affiliate/ad-slot.tsx`)
  renders a reserved, labelled placeholder and nothing else. It returns `null` unless both
  (a) `ads_enabled` is true **and** (b) the visitor granted advertising consent. No
  third-party script is ever loaded.
- **No certified CMP.** `src/lib/consent.ts` + the banner are a functional first-party
  consent store (necessary/analytics/advertising, localStorage + events). Its own header
  comment says it **does not claim GDPR compliance** — it is not a Google-certified CMP.
- **Two gates must both open before a slot renders.** `enabled` (server, DB setting) **and**
  `loadConsent()?.advertising === true` (client, live via `onConsentChange`). This gating
  contract is the integration point and must be preserved.

## Launch checklist — a separate future task, owner-authorized

Before any advertising may serve (EEA/UK/CH especially), the following must be done and
verified. This is not an ordering suggestion — every step is mandatory for that
integration task:

1. **Choose a Google-certified CMP** that meets the requirements for the regions you
   target, and integrate it. Keep or map the existing event contract
   (`dy:consent`, `dy:consent-open`, storage shape) so `AdSlot` and `trackEvent` keep
   working — the gating logic is the integration point, not the banner UI.
2. **Verify TCF / consent / region behaviour** with the CMP live: consent choices persist,
   denial blocks script loading, and region-based rules (EEA/UK/CH) behave correctly.
3. **Wire a real ad network inside `AdSlot`**, after both gates. The component must never
   load third-party script before advertising consent.
4. **Update privacy + cookie policies** for the provider's categories and any new storage
   keys, in line with the disclosure pages (`/how-we-make-money`, `/advertising-disclosure`).
5. **`ads.txt`** (and, if applicable, app-ads.txt) on the real production origin.
6. **Test ad gating** by consent and by region before any real traffic: consent-denied →
   no script, no request; consent-granted → ads render within the reserved box
   (`min-h-24`, dashed border, no layout shift).
7. **Invalid-click policy** and fraud guardrails from the network's policy.
8. **Production validation** — non-demo content in place, `demo_mode` off, domain swapped,
   `ALLOW_INDEXING=true` only on production.

Only after that authorized integration passes all of the above is AdSense "ready". The
current state is deliberately **NOT READY**, and no code path or flag pretends otherwise.

## Related

- `src/components/affiliate/ad-slot.tsx` — the reserved, gated slot.
- `src/lib/consent.ts` — first-party consent store (not a certified CMP).
- `src/lib/settings.ts` — `isAdsEnabled()` DB-first gate.
- `AFFILIATE_INTEGRATION.md` §7 — where the integration task points here.