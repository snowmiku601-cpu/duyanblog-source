-- One-click unsubscribe tokens for newsletter subscribers.
-- Table rebuild (SQLite cannot add a NOT NULL unique column in place);
-- existing rows are backfilled with random tokens so every subscriber
-- immediately has a working unsubscribe link.

PRAGMA defer_foreign_keys=ON;
CREATE TABLE "new_NewsletterSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT true,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_NewsletterSubscriber" ("id", "email", "source", "confirmed", "createdAt", "unsubscribeToken")
SELECT "id", "email", "source", "confirmed", "createdAt", lower(hex(randomblob(24))) FROM "NewsletterSubscriber";
DROP TABLE "NewsletterSubscriber";
ALTER TABLE "new_NewsletterSubscriber" RENAME TO "NewsletterSubscriber";
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
