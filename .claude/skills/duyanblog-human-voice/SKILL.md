---
name: duyanblog-human-voice
description: Mandatory before writing or editing any user-facing English prose on duyanblog.com — articles, decks, policies, SEO copy, admin UI strings, emails. Covers the editorial register, the integrity rules (seeded data vs real facts), and the verification checklist. Load BEFORE the first draft.
---

# Duyan Blog voice — reviews with reasons attached

Load this **before** the first draft. The failure this prevents is not a grammar mistake, it is
prose that reads like an AI content farm on a publication whose entire product is trust.

Read alongside: `rules/content-integrity.md`, `DESIGN.md` (§voice), `EDITORIAL_GUIDE.md`
(article types + block grammar).

## The register

- **Confident, short, editorial.** Sentences land. Headlines name the subject and the win/angle.
  No "unleash", no "seamlessly", no "in today's fast-paced world", no exclamation marks, no
  marketed adjectives (game-changer, powerhouse, jaw-dropping).
- **Reasons attached.** Every verdict explains *why* in the same breath: the metric, the trade,
  the moment it stopped making sense. "Best overall" is a start, never a sentence.
- **Show the trade-offs.** The comparison engine exists because winners without losers are
  unsupported. Name what you gave up to get what you liked.
- **Numbers are specific — and traced.** "3–4 days real-world battery with 5G on" beats
  "great battery". If the number comes from the seed dataset it is fiction and carries the
  `DemoNotice` framing; if it is editorial fact it needs a source the reader can check.
- **Typography discipline:** em dashes are a spice, not a seasoning; one or two per 500 words
  max, never three in a row. Periods and commas carry most sentences.

## The integrity rules (full text in `rules/content-integrity.md`)

1. A placeholder is a fabrication with a deadline you will forget. Demo data is visibly marked;
   never restate it as fact.
2. Never invent a price, rating, benchmark, quote, URL or claim. What you did not verify does
   not exist in prose.
3. Scope dies when restated: "the cheapest of the five we compare" is not "the cheapest".
4. Criticism is a spec claim too: a "con" needs the same sourcing as a "pro".

## The block grammar

Article bodies are JSON blocks (`EDITORIAL_GUIDE.md`), not markdown prose files. Inline links to
offers use `go:OFFER_ID` — never a raw merchant URL. Inline text supports the tiny grammar in
`src/components/editorial/inline-text.tsx` (bold `**`, emphasis `*`, `[label](ref:SLUG)` per the
schema comments); nothing renders with `dangerouslySetInnerHTML`.

## Verification checklist (before calling prose done)

- [ ] Every number traces to a source or a labelled demo entry — no adjectives standing in.
- [ ] First buy link has the affiliate disclosure adjacent (house rule).
- [ ] No raw merchant URLs — all offer references are `go:OFFER_ID`.
- [ ] Headline ≤ 60 chars, deck one crisp sentence, TL;DR three bullets max.
- [ ] Read aloud once: if a sentence needs two breaths it needs a period.
- [ ] **Run the slop scan** — `npm run slop -- --rows` — and read each hit before fixing.
      A hit is a lead, not a sentence to delete blindly; a pattern that fires on good prose is a
      known-imperfect instrument (same as the sibling projects). Do not argue about whether
      prose "feels human" — run the scan, it carries its own controls and prints a selftest
      before any result.
- [ ] `npm run lint && npm run typecheck` pass if any code touched the blocks/types.

## Scanner hygiene

- Default target is `src/content/policies.ts` — clean edits stay 0 hits, so a new FATAL is the
  diff, not the baseline.
- Demo seed (`prisma/seed.ts`) is labelled fiction: scan it with `--files=prisma/seed.ts --rows`
  to review style, never as a gate — its prices are demo by design.
- `--strict` makes any WARN fail; use it as the editorial gate when real content starts shipping.