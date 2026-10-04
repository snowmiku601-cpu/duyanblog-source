# Content integrity — numbers, claims, demo data

Read before writing any user-facing content, number, or claim. On this project most displayed
data is **seeded demo fiction** (`prisma/seed.ts`, visibly marked by `DemoNotice`); the damage a
claim can do is smaller than on a live affiliate site, but the habit must be identical.

## The core rule

**A placeholder is a fabrication with a deadline you will forget.**
While data is demo, mark it visibly (`DemoNotice`, `demo_mode` setting) or delete the number.
Never soften, restate without its qualifier, or let fictional values leak into `parse`-visible
metadata as if real (no fake `review`/`aggregateRating` JSON-LD — the codebase already enforces
this; keep it that way).

## What you may never invent

A price, tier, rating, benchmark, test result, review count, certification, "N engineers",
hours tested, a quote, a URL, a slug, an affiliate link, an ASIN, a measurement. The seed dataset
may *contain* explicitly fictional values (they are labelled, by design); you may not invent a
**new** one outside the seed and present it as editorial fact.

## Verification rules

- Verify on the **rendered page**, never by grepping `src/` alone. Give every grep a control that
  must hit and one that must miss.
- **A verification claim includes the exact command, its literal output, and the exit code.**
  "Looks correct", "should work", "the format is right" are not verification.
- An agent's quote is a lead, not a source: re-fetch, attribute, or delete it. No fourth option.
- A false CON survives every sweep — criticism reads as honesty. Treat "no API / no free tier /
  no SOC 2" on a merchant as a spec claim that needs the same source as a pro.
- Scope dies when the claim is restated: "the cheapest of the five we compare" becomes "the
  cheapest" one sentence later. Check transitions, not just sentences.

## Pre-write gate (before every Edit or Write)

1. Have I read this file in this session?
2. Does the value I am about to write trace to a source, or is it labelled demo?
3. Is this the minimal change, or am I also "fixing" something adjacent?
4. Will I be able to demonstrate this on the rendered page, with a control that must not match?

## Demo → launch

Before real-go: delete or replace demo merchants/offers/articles/authors, flip `demo_mode`
setting, and drop the QA admin account. Steps documented in `AFFILIATE_INTEGRATION.md` and
`HOSTINGER_DEPLOYMENT.md`.