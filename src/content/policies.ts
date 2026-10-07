/**
 * Static policy pages: original plain-language copy for duyanblog.com.
 * Kept as typed content (not DB) so they ship with the repo and survive
 * fresh databases. Each entry renders via src/components/editorial/policy-page.tsx.
 */

export type PolicySection = { heading: string; body: string[] };
export type Policy = {
  slug: string;
  title: string;
  description: string;
  updated: string;
  intro: string;
  sections: PolicySection[];
};

const POLICIES: Policy[] = [
  {
    slug: "editorial-policy",
    title: "Editorial policy",
    description:
      "How Duyan Blog produces, reviews and stands behind its editorial work: independence, named authors, visible evidence and labelled samples.",
    updated: "2026-10-05",
    intro:
      "This policy governs everything published on Duyan Blog. It is short on purpose — a policy nobody can memorise protects nobody.",
    sections: [
      {
        heading: "Independence",
        body: [
          "We choose what to cover, what to recommend and what to criticise. Manufacturers, merchants, affiliate networks and advertisers have no preview, no veto and no right of reply before publication. If one of them asks us to change a verdict, we decline — and if they pay us for anything, it is labelled as sponsorship and never touches a score.",
        ],
      },
      {
        heading: "Named humans",
        body: [
          "Every article carries a named author. Reviews additionally carry a second editor, where a review has one, who verifies the claims against the cited sources. We list real roles and never fabricate credentials, awards, research hours or test statistics. Where our product experience is limited, the article says so and describes exactly what was done.",
        ],
      },
      {
        heading: "Evidence and honesty",
        body: [
          "Claims are sourced; sources are listed, each with the day a human last checked it. Where evidence is thin or the market moves faster than we can read it, we say so instead of filling the gap with confident-sounding numbers. We run our own benchmarks only when an article plainly says so and describes the setup; otherwise we cite independent, dated measurements by name. Sample and demonstration content is explicitly labelled, everywhere it appears.",
        ],
      },
      {
        heading: "Sample content",
        body: [
          "If Duyan Blog publishes demonstration or sample content, it is clearly labelled on the page and excluded from normal editorial and indexing surfaces. No sample content is created to deceive search engines, and no fake reviews, ratings or structured data are generated.",
        ],
      },
      {
        heading: "Corrections",
        body: [
          "Mistakes get fixed and the fix is recorded in the article's revision history. See the corrections policy for the exact process.",
        ],
      },
    ],
  },
  {
    slug: "how-we-make-money",
    title: "How we make money",
    description:
      "How Duyan Blog plans to fund independent publishing, and the rules that keep future commerce out of editorial decisions.",
    updated: "2026-10-07",
    intro:
      "Independent publishing costs money. We do not currently run ads or affiliate links; this page explains the revenue models we may use and the rules that would govern them.",
    sections: [
      {
        heading: "Affiliate commissions",
        body: [
          "If and when we use affiliate links to merchants, buying through them may pay us a commission. Commission rates, and the price you pay, are merchant- and program-specific — check the merchant's current price and terms before you buy. Commission rates would differ across merchants and can be higher for products we do not rank first — which is precisely why our rule exists: verdicts are finalised before anyone looks at rates.",
        ],
      },
      {
        heading: "Advertising",
        body: [
          "We do not currently sell or serve advertising, and no ad network is configured on this site. If we add advertising later, it will be clearly labelled, governed by the rules in our advertising disclosure, and never touch a score, a ranking or a recommendation.",
        ],
      },
      {
        heading: "Newsletter and subscriptions",
        body: [
          "The newsletter is free. If we later add paid subscriptions or paid research reports, they will be listed here and will follow the same independence rules as everything else.",
        ],
      },
      {
        heading: "What we will never do",
        body: [
          "Sell rankings, scores or review placement. Publish undisclosed paid content. Let a merchant remove criticism in exchange for revenue. Fake urgency, fake scarcity or deceptive redirects — affiliate navigation goes exactly where the link says it goes.",
        ],
      },
    ],
  },
  {
    slug: "affiliate-disclosure",
    title: "Affiliate disclosure",
    description:
      "How affiliate links work on Duyan Blog when they appear: how they are marked, and why they never affect verdicts.",
    updated: "2026-10-07",
    intro:
      "This page explains, in plain language, how affiliate links would be used on this site and what that does and does not mean. There are currently no affiliate links on Duyan Blog; if and when we add them, they will be marked and governed here.",
    sections: [
      {
        heading: "What an affiliate link is",
        body: [
          "An affiliate link sends you to a merchant through a tracked destination. If you buy something, the merchant pays us a commission — typically a small percentage. Commission arrangements and the price you pay are set by the merchant's affiliate program, so check the merchant's current price and terms before you buy.",
          "On this site, affiliate links navigate through /go/[offer-id], which records an anonymous click (timestamp, and the Duyan Blog page the link sat on) and then forwards you to the merchant. We do not read or store your browser's Referer header and we never store your IP with click data. No consent is required for affiliate navigation to work — tracking and navigation are separate systems.",
        ],
      },
      {
        heading: "How links are marked",
        body: [
          "Affiliate links carry the rel=\"sponsored\" attribute so search engines can see the commercial relationship. Offer boxes and comparison tables include a short disclosure near the link, and every commercial page links back here.",
        ],
      },
      {
        heading: "What affiliate money does not buy",
        body: [
          "Scores, rankings or wording. Our methodology requires verdicts to be finalised before commission rates are considered. If we ever cannot maintain that separation for a category, we stop taking affiliate money in that category and say so on the page.",
        ],
      },
      {
        heading: "If sample data ever appears",
        body: [
          "Any demonstration or sample offer on the site is clearly labelled as such, both where it is shown and in this disclosure. No sample offer is ever a real checkout.",
        ],
      },
    ],
  },
  {
    slug: "advertising-disclosure",
    title: "Advertising disclosure",
    description:
      "The rules that will govern advertising and sponsorship on Duyan Blog, if and when we add them.",
    updated: "2026-10-05",
    intro:
      "We do not currently run advertising, and no ad network is configured on this site. If an advertiser's money ever touches a page here, this policy determines how you'll know about it.",
    sections: [
      {
        heading: "Current state",
        body: [
          "There is nothing to disclose yet: we do not sell display placements, we do not publish sponsored articles, and no advertising script loads anywhere on the site.",
        ],
      },
      {
        heading: "Labelling, if and when we add advertising",
        body: [
          "Display ads will be marked “Advertisement” and shown only after you grant advertising consent. Sponsored articles will carry a sponsor line at the top and bottom and will be produced outside the editorial workflow. Neither will ever be eligible for scores, rankings or product recommendations.",
        ],
      },
      {
        heading: "What advertisers cannot do",
        body: [
          "They cannot see editorial before publication, request changes to reviews, buy their way into a roundup, or take space that visually impersonates editorial content. If we ever break these rules ourselves, the failure gets a public correction.",
        ],
      },
    ],
  },
  {
    slug: "corrections-policy",
    title: "Corrections policy",
    description:
      "How Duyan Blog handles errors: how to report them, how fast we respond, and how corrections are recorded.",
    updated: "2026-10-05",
    intro:
      "Everyone who publishes gets things wrong sometimes. What separates serious publications is what happens next. This is our version of next.",
    sections: [
      {
        heading: "Reporting an error",
        body: [
          "Use the contact form and include the page URL and what you believe is wrong. Corrections do not require you to identify yourself. We aim to review correction reports promptly — contact messages are answered by a human, and material corrections reach the editors immediately.",
        ],
      },
      {
        heading: "How we fix things",
        body: [
          "Small factual fixes (a price, a name, a specification) are corrected in the article, and the “updated” date changes. Material errors — anything that could change a reader's decision, including a score or recommendation — are corrected in the article with a dated note at the bottom explaining what changed and why. Every fix is recorded in the article's revision history.",
          "Corrections are never hidden. Removed content that was material is marked as removed rather than silently deleted.",
        ],
      },
      {
        heading: "When we're wrong about a recommendation",
        body: [
          "If new evidence changes a verdict, we re-check the cited sources, update the article, change the score with its criteria, and note the change. Rankings follow the evidence, not our pride — and affiliate commissions are never a reason to leave a wrong recommendation in place.",
        ],
      },
    ],
  },
  {
    slug: "privacy-policy",
    title: "Privacy policy",
    description:
      "What Duyan Blog collects, what it doesn't, and how consent controls analytics and advertising. Plain language, short by design.",
    updated: "2026-03-01",
    intro:
      "We collect as little as possible, and optional collection is off until you turn it on. This page explains the details — it is information, not legal advice.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Newsletter subscriptions: the email address you submit, plus the signup source. Contact form: name, email, subject and message. Affiliate navigation: an anonymous click record (offer, timestamp, and the Duyan Blog page that carried the link) — we do not read or store your browser's Referer header, and we do not store your IP address with click data.",
          "That is the information we keep with your data. Separately, to stop abuse, we briefly derive an IP-based identifier in server memory when you submit the newsletter form, contact form or log in to the editorial area; it is used only to rate-limit and is not persisted to the application database.",
          "Records are kept only as long as reasonably necessary for the purpose they serve. You can ask us to delete anything we hold about you and we will action it promptly.",
        ],
      },
      {
        heading: "Cookies and local storage",
        body: [
          "Necessary storage keeps the site working (for example, your cookie choice itself). Analytics and advertising storage stay off until you opt in via the consent banner or the cookie settings in the footer. Your choice lives in your browser; clearing it reopens the prompt.",
        ],
      },
      {
        heading: "Analytics and advertising, after consent",
        body: [
          "If you grant analytics consent, aggregate usage measurement may run. If you grant advertising consent, advertising partners may set their own cookies subject to their policies. Neither ever runs before consent, and affiliate links work with all consents denied.",
        ],
      },
      {
        heading: "Your rights",
        body: [
          "You can change consent any time via “Cookie settings” in the footer, and ask us to delete your newsletter subscription or contact messages via the contact form.",
          "Depending on where you live, data-protection law may give you additional rights — for example, to access, correct, delete, restrict or object to the processing of your data, or to receive a portable copy. Those rights apply if the relevant law covers you, and we will honour any request that it does. We will review our privacy practices with legal counsel before we serve behavioural advertising.",
        ],
      },
      {
        heading: "Contact for privacy questions",
        body: [
          "Use the contact form for any privacy request. If the law where you live gives you the right to complain to a data-protection supervisory authority, this site's operator — reachable via the contact form — will tell you which one applies and help you get to it.",
        ],
      },
    ],
  },
  {
    slug: "cookie-policy",
    title: "Cookie policy",
    description:
      "The cookies and browser storage Duyan Blog uses, grouped by purpose, and how consent controls the optional ones.",
    updated: "2026-03-01",
    intro:
      "A short inventory of what this site stores in your browser, and when. Optional categories stay empty until you consent.",
    sections: [
      {
        heading: "Necessary",
        body: [
          "dy-consent-v1 (local storage): remembers your cookie choices so we stop asking. Admin sessions set a HttpOnly session cookie used only by the editorial team's login. These cannot be switched off without breaking the site.",
          "theme (local storage): keeps your light/dark display preference. It is stored before the consent prompt on purpose so the site renders correctly on first visit — it holds no tracking data.",
          "duyanblog:sort (local storage): remembers the column sort you picked on a comparison table, on this browser. Clearing it resets tables to the editors' default order.",
        ],
      },
      {
        heading: "Analytics (optional)",
        body: [
          "Empty by default. If, and only if, you enable analytics consent, an aggregate measurement tool may store an anonymous identifier. We deliberately keep this category unpopulated until a provider is configured.",
        ],
      },
      {
        heading: "Advertising (optional)",
        body: [
          "Empty by default. If you enable advertising consent, future ad partners may store cookies for measurement or frequency capping. Ads never load before this consent exists.",
        ],
      },
      {
        heading: "Managing storage",
        body: [
          "Use “Cookie settings” in the footer to change your choice at any time, or clear site data in your browser to reset everything. With all optional consent denied, every feature on the site except measurement and ads works normally — including affiliate links.",
        ],
      },
    ],
  },
  {
    slug: "terms",
    title: "Terms of service",
    description:
      "The ground rules for using duyanblog.com: content licence, acceptable use, affiliate relationships and limitations. Information, not legal advice.",
    updated: "2026-10-05",
    intro:
      "Short terms for a reader-friendly site. This page is plain-language information rather than a legal document; if you need formal wording, contact us.",
    sections: [
      {
        heading: "Using the site",
        body: [
          "You may read, link to and quote Duyan Blog with attribution. Scraping for AI training or republication of articles wholesale is not permitted without written permission. Don't attempt to break, overload or gain unauthorised access to any part of the site — the admin area is for the editorial team only.",
        ],
      },
      {
        heading: "Editorial content",
        body: [
          "Articles reflect the authors' honest judgement at the time of writing and are provided “as is”, without warranty of completeness or fitness for your specific situation. Prices, terms and product behaviour change; check the merchant before you buy.",
        ],
      },
      {
        heading: "Commercial relationships",
        body: [
          "Affiliate and advertising relationships are disclosed on-page and on the dedicated disclosure pages. Buying through our links never changes your rights with the merchant — your contract is with them, not with us.",
        ],
      },
      {
        heading: "Liability",
        body: [
          "To the extent permitted by law, we are not liable for indirect or consequential loss arising from use of the site. Nothing here excludes liability that cannot be excluded under applicable law.",
        ],
      },
      {
        heading: "Children",
        body: [
          "This site is not directed at children under 13, and we do not knowingly collect personal information from them. If you believe a child has provided us with personal information, use the contact form so we can delete it.",
        ],
      },
      {
        heading: "Changes",
        body: [
          "Material changes to these terms get a new “updated” date and, where sensible, a note on the page. Continued use after changes means you accept them.",
        ],
      },
    ],
  },
];

export function getPolicy(slug: string): Policy | null {
  return POLICIES.find((p) => p.slug === slug) ?? null;
}

export const policySlugs = POLICIES.map((p) => p.slug);
