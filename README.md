# duyanblog.com

Independent editorial review publication: research/evidence-led reviews, head-to-head comparisons and buying guides for software, travel and technology — built from published specs, source documents and dated checks, with the methodology and trade-offs shown in the open. Currently ships with a fully labelled fictional demo dataset so the presentation can be evaluated before real editorial work begins.

> **Tagline:** Reviews with reasons attached.

All docs for continuing this repo live at the root:

| Doc | Contents |
| --- | --- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Request lifecycle, data flow, auth, consent, comparison engine, trade-offs |
| [PRODUCT.md](PRODUCT.md) | Purpose, audiences, business model, content model, trust rules |
| [DESIGN.md](DESIGN.md) | Identity, colour tokens, typography, motifs, do-not-change list |
| [EDITORIAL_GUIDE.md](EDITORIAL_GUIDE.md) | Article types, block JSON format, review requirements, tone |
| [SEO_GUIDE.md](SEO_GUIDE.md) | Metadata, JSON-LD, sitemap/RSS, canonical rules, publishing checklist |
| [AFFILIATE_INTEGRATION.md](AFFILIATE_INTEGRATION.md) | Offer model, /go router, click logging, ad slots, compliance |
| [HOSTINGER_DEPLOYMENT.md](HOSTINGER_DEPLOYMENT.md) | Production build, MySQL, env vars, smoke test |

## Tech stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Framework | Next.js 16 App Router (`next@^16.3.8`) | `output: "standalone"`, React 19, TypeScript `strict: true` |
| Styling | Tailwind CSS 4 (`@theme inline` tokens) + shadcn/ui (Radix) | Tokens in `src/app/globals.css` |
| Data | Prisma 6 + MySQL (`DATABASE_URL`) | Schema is MySQL-canonical; see HOSTINGER_DEPLOYMENT.md |
| Validation | Zod 4 | Content blocks, comparison rows, API bodies |
| Fonts | Fraunces (display) + Inter (UI/body) via `next/font` | Vietnamese subset required |
| Auth | Hand-rolled scrypt + DB session tokens (`src/lib/auth.ts`) | No NextAuth despite it being in `package.json` |

## Quick start

```bash
npm install
cp .env.example .env              # then set DATABASE_URL to a MySQL URL (local MySQL or the platform DB)
npx prisma migrate dev            # applies prisma/migrations to MySQL
npm run seed:demo                 # loads the fictional demo issue
npm run admin:bootstrap -- --email you@example.com --password "min-12-chars-with-1-number"
npm run dev                       # http://localhost:3000
```

Note: the database is **MySQL** — the schema and migrations are MySQL-canonical (the sandbox's original SQLite setup is retired; `db/custom.db` is no longer created). Local dev runs against a local MySQL or the platform DB via `DATABASE_URL`.

Note: the `/admin` area is complete (see "Known state" below); `admin:bootstrap` creates the `User` row and `src/lib/auth.ts` powers the scrypt + DB-session login.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000, output teed to `dev.log` |
| `npm run lint` | ESLint (`eslint .`, flat config in `eslint.config.mjs`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | HTTP smoke test against a **running** server (`scripts/smoke.mjs`); override target with `SMOKE_BASE_URL=http://host:port` |
| `npm run build` | `next build`, then copies `.next/static` and `public/` into `.next/standalone/` |
| `npm run start` | Runs the standalone server via Node (`NODE_ENV=production node .next/standalone/server.js`); `npm run start:node` is the same without the tee |
| `npm run db:generate` | `prisma generate` |
| `npm run db:migrate` | `prisma migrate deploy` (production-safe) |
| `npm run db:reset` | `prisma migrate reset` (wipes data) |
| `npm run db:push` | `prisma db push --accept-data-loss` (prototyping only) |
| `npm run seed:demo` | Wipes + reseeds fictional demo content (`prisma/seed.ts`); refuses in production unless `ALLOW_DEMO_SEED=true` |
| `npm run admin:bootstrap` | Creates the first admin user; refuses in production unless `ALLOW_ADMIN_BOOTSTRAP=true` |

## Project structure (top two levels of `src/`)

```
src/
├── app/
│   ├── layout.tsx            # root layout: fonts, header, footer, consent manager
│   ├── page.tsx              # home (revalidate 300)
│   ├── reviews/ best/ compare/ guides/ articles/   # 5 article type routes + index pages
│   ├── [category]/page.tsx   # /software /travel /tech hubs
│   ├── authors/ deals/ search/ about/ contact/ methodology/
│   ├── editorial-policy/ … /terms   # 8 policy pages (content in src/content/policies.ts)
│   ├── go/[offerId]/route.ts # affiliate 302 click router
│   ├── api/newsletter/ api/contact/                 # public POST endpoints
│   ├── admin/                # login, dashboard, articles (+ revisions), categories, authors, merchants, offers, comparisons, redirects, messages, subscribers, settings
│   ├── feed.xml/route.ts  sitemap.ts  robots.ts
│   └── not-found.tsx  error.tsx
├── proxy.ts                  # Next 16 proxy (Node runtime): DB-backed Redirect table → 301/302, 30s TTL cache
├── components/
│   ├── logo.tsx  site-header.tsx  site-footer.tsx  reveal.tsx
│   ├── comparison-table.tsx  newsletter-form.tsx
│   ├── affiliate/            # affiliate-link, merchant-offer, ad-slot
│   ├── consent/              # consent-manager (banner + settings dialog)
│   ├── editorial/            # article-renderer, article-header, section-heading, …
│   ├── seo/json-ld.tsx
│   └── ui/                   # shadcn/ui primitives
├── content/policies.ts       # 8 static policy pages as typed content
├── hooks/                    # use-toast, use-mobile
└── lib/
    ├── site.ts  db.ts  queries.ts  format.ts
    ├── auth.ts  rate-limit.ts  settings.ts
    ├── content-schema.ts  comparison.ts
    ├── seo.ts  offers.ts
```

Prisma models: `User, Session, Author, Category, Article, ArticleRevision, Tag, ArticleTag, Merchant, AffiliateOffer, AffiliateClick, Comparison, ComparisonItem, ReviewScore, SourceCitation, MethodologyEntry, NewsletterSubscriber, ContactMessage, Redirect, SiteSetting` — see `prisma/schema.prisma`.

## Security notes

- **No default credentials exist.** The database is seeded with zero `User` rows; the only way to get an admin is `npm run admin:bootstrap`.
- `admin:bootstrap` refuses to run when `NODE_ENV=production` unless `ALLOW_ADMIN_BOOTSTRAP=true`; it enforces 12+ character passwords with letters and digits (`scripts/admin-bootstrap.ts`).
- `seed:demo` refuses production the same way (`ALLOW_DEMO_SEED=true` override).
- Session cookies are `HttpOnly`, `SameSite=Lax`, `Secure` in production; only SHA-256 hashes of tokens are stored (`Session.tokenHash`).
- Public POST endpoints (`/api/newsletter`, `/api/contact`) check same-origin, enforce a honeypot field and rate-limit to 5 requests/minute/IP (`src/lib/rate-limit.ts`, in-memory).
- Security headers (HSTS, nosniff, DENY framing, referrer + permissions policy) are set in `next.config.ts`.
- AI crawler user agents are currently **allowed** by default (no bot arrays in `robots.ts`; an owner decision, recorded in `.claude/rules/risk-register.md` — adding a block later is a single robots group change).

## Demo content disclaimer

Everything seeded by `prisma/seed.ts` is **fictional**: products (Auralis Note 14, TerraSIM Go, …), merchants (NomadLink, Cloudpeak Hosting, …), offers, prices, measurements and the three authors. Sample pages say so on the page (`DemoNotice` in `src/components/editorial/article-extras.tsx`). No fake `Review`/`aggregateRating` structured data is generated. Replace demo merchants/offers before go-live — steps in AFFILIATE_INTEGRATION.md.

## Known state of the repo

- The `/admin` area is complete: login (rate-limited, DB sessions), dashboard, article editor with JSON blocks + revision history (view/restore, auto-backup before restore), categories, authors, merchants, offers, comparisons, redirects, messages, newsletter subscribers (search + CSV export + delete), settings. No admin account is seeded — create one with `npm run admin:bootstrap`.
- `next-auth` and other unused packages remain in `package.json` from the scaffolding; the app does not import them.
- Search (`src/lib/queries.ts` `searchArticles`) filters published title/deck/tags in the DB (case-insensitive, newest first, `LIMIT 30`, demo-excluded) — no JS filter over a latest-100 ceiling; MySQL FULLTEXT is a later scale optimization (ARCHITECTURE.md).

## Working on this repo with an AI agent

0. Read `AGENTS.md` and `.claude/CLAUDE.md` first — the operating manual (reply-in-Vietnamese
   rule, rules index, canonical commands).
1. Read `worklog.md` first — it records what was built and the conventions ("Task ID" entries).
2. Before changing presentation, read [DESIGN.md](DESIGN.md); it lists tokens and patterns that must not be changed casually and explains the failure modes.
3. Content authoring and the block JSON format: [EDITORIAL_GUIDE.md](EDITORIAL_GUIDE.md).
4. Any article, routing or metadata change: check [SEO_GUIDE.md](SEO_GUIDE.md) for the canonical-URL and JSON-LD rules.
5. Commerce changes: [AFFILIATE_INTEGRATION.md](AFFILIATE_INTEGRATION.md). Never put raw merchant URLs in article copy — use `go:OFFER_ID`.
6. Architecture questions (caching, revalidation, consent): [ARCHITECTURE.md](ARCHITECTURE.md).
7. After any change: `npm run lint && npm run typecheck`, then `npm run test` against a running dev server.
