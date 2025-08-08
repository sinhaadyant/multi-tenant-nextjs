/*
  Warnings:

  - You are about to drop the column `createdBy` on the `invite_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `usedAt` on the `invite_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `dateFrom` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `dateTo` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `fileName` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `filePath` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `filters` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `format` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `generatedBy` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `reportType` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `reports` table. All the data in the column will be lost.
  - You are about to drop the column `isGlobal` on the `roles` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `system_logs` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `system_settings` table. All the data in the column will be lost.
  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,tenantId]` on the table `roles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `invite_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `data` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `reports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `system_settings` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `invite_tokens` DROP FOREIGN KEY `invite_tokens_createdBy_fkey`;

-- DropForeignKey
ALTER TABLE `reports` DROP FOREIGN KEY `reports_generatedBy_fkey`;

-- DropForeignKey
ALTER TABLE `users` DROP FOREIGN KEY `users_roleId_fkey`;

-- DropIndex
DROP INDEX `invite_tokens_createdBy_fkey` ON `invite_tokens`;

-- DropIndex
DROP INDEX `reports_generatedBy_fkey` ON `reports`;

-- DropIndex
DROP INDEX `reports_reportType_fkey` ON `reports`;

-- DropIndex
DROP INDEX `reports_status_fkey` ON `reports`;

-- DropIndex
DROP INDEX `roles_name_key` ON `roles`;

-- DropIndex
DROP INDEX `users_roleId_fkey` ON `users`;

-- AlterTable
ALTER TABLE `invite_tokens` DROP COLUMN `createdBy`,
    DROP COLUMN `usedAt`,
    ADD COLUMN `superAdminId` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `submodule` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `reports` DROP COLUMN `dateFrom`,
    DROP COLUMN `dateTo`,
    DROP COLUMN `fileName`,
    DROP COLUMN `filePath`,
    DROP COLUMN `fileSize`,
    DROP COLUMN `filters`,
    DROP COLUMN `format`,
    DROP COLUMN `generatedBy`,
    DROP COLUMN `reportType`,
    DROP COLUMN `status`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `data` LONGTEXT NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NOT NULL,
    ADD COLUMN `superAdminId` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `roles` DROP COLUMN `isGlobal`,
    ADD COLUMN `isDefault` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isTemplate` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `tenantId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `system_logs` DROP COLUMN `details`,
    MODIFY `message` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `system_settings` DROP COLUMN `type`,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    MODIFY `value` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `roleId`;

-- CreateTable
CREATE TABLE `user_roles` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `assignedBy` VARCHAR(191) NULL,

    INDEX `user_roles_userId_fkey`(`userId`),
    INDEX `user_roles_roleId_fkey`(`roleId`),
    UNIQUE INDEX `user_roles_userId_roleId_key`(`userId`, `roleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `used` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `superAdminId` VARCHAR(191) NULL,

    UNIQUE INDEX `password_reset_tokens_token_key`(`token`),
    INDEX `password_reset_tokens_email_idx`(`email`),
    INDEX `password_reset_tokens_superAdminId_fkey`(`superAdminId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `tokenId` VARCHAR(191) NOT NULL,
    `hashedToken` VARCHAR(191) NOT NULL,
    `superAdminId` VARCHAR(191) NOT NULL,
    `isRevoked` BOOLEAN NOT NULL DEFAULT false,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastUsedAt` DATETIME(3) NULL,
    `deviceInfo` VARCHAR(191) NULL,
    `ipAddress` VARCHAR(191) NULL,

    UNIQUE INDEX `refresh_tokens_tokenId_key`(`tokenId`),
    UNIQUE INDEX `refresh_tokens_hashedToken_key`(`hashedToken`),
    INDEX `refresh_tokens_superAdminId_fkey`(`superAdminId`),
    INDEX `refresh_tokens_tokenId_idx`(`tokenId`),
    INDEX `refresh_tokens_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `invite_tokens_superAdminId_fkey` ON `invite_tokens`(`superAdminId`);

-- CreateIndex
CREATE INDEX `reports_superAdminId_fkey` ON `reports`(`superAdminId`);

-- CreateIndex
CREATE INDEX `roles_tenantId_fkey` ON `roles`(`tenantId`);

-- CreateIndex
CREATE UNIQUE INDEX `roles_name_tenantId_key` ON `roles`(`name`, `tenantId`);

-- AddForeignKey
ALTER TABLE `roles` ADD CONSTRAINT `roles_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_roles` ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invite_tokens` ADD CONSTRAINT `invite_tokens_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
