-- Backfill Article.isDemo = true for the six known seeded demo articles.
--
-- The `article_is_demo` migration added `isDemo BOOLEAN NOT NULL DEFAULT false`;
-- rows that existed before that migration keep the default (false), so a fresh
-- database built from migrations followed only by the committed seed would not
-- necessarily need this — but a pre-existing database that already carried
-- demo seed data does. This forward-only backfill is safe whether or not the
-- rows exist (UPDATE on zero rows is a no-op). It is NOT a seed; it only sets
-- the demo flag on the known fictional slugs.
UPDATE `Article` SET `isDemo` = true WHERE `slug` IN (
  'auralis-note-14-review',
  'terrasim-go-review',
  'best-esim-providers',
  'cloudpeak-vs-harborstack',
  'choose-a-vpn',
  'why-we-publish-testing-notes'
);
