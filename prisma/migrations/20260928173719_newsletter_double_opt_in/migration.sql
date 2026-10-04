-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_NewsletterSubscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "source" TEXT,
    "confirmed" BOOLEAN NOT NULL DEFAULT false,
    "confirmToken" TEXT,
    "confirmExpiresAt" DATETIME,
    "unsubscribeToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_NewsletterSubscriber" ("confirmed", "createdAt", "email", "id", "source", "unsubscribeToken") SELECT "confirmed", "createdAt", "email", "id", "source", "unsubscribeToken" FROM "NewsletterSubscriber";
DROP TABLE "NewsletterSubscriber";
ALTER TABLE "new_NewsletterSubscriber" RENAME TO "NewsletterSubscriber";
CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmToken_key" ON "NewsletterSubscriber"("confirmToken");
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubscribeToken_key" ON "NewsletterSubscriber"("unsubscribeToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
