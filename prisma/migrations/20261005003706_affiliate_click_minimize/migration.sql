/*
  Warnings:

  - You are about to drop the column `consentAnalytics` on the `affiliateclick` table. All the data in the column will be lost.
  - You are about to drop the column `referer` on the `affiliateclick` table. All the data in the column will be lost.
  - You are about to drop the column `sessionHash` on the `affiliateclick` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `AffiliateClick` DROP COLUMN `consentAnalytics`,
    DROP COLUMN `referer`,
    DROP COLUMN `sessionHash`,
    ADD COLUMN `sourcePath` VARCHAR(191) NULL;
