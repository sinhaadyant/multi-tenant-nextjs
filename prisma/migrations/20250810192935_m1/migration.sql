/*
  Warnings:

  - You are about to drop the column `isRead` on the `notifications` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[moduleKey,action,resource]` on the table `permissions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `archivedAt` DATETIME(3) NULL,
    ADD COLUMN `isArchived` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `newValues` LONGTEXT NULL,
    ADD COLUMN `oldValues` LONGTEXT NULL,
    ADD COLUMN `requestId` VARCHAR(191) NULL,
    ADD COLUMN `resourceId` VARCHAR(191) NULL,
    ADD COLUMN `resourceType` VARCHAR(191) NULL,
    ADD COLUMN `retentionExpiry` DATETIME(3) NULL,
    ADD COLUMN `sessionId` VARCHAR(191) NULL,
    ADD COLUMN `severity` VARCHAR(191) NOT NULL DEFAULT 'info',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'success';

-- AlterTable
ALTER TABLE `modules` ADD COLUMN `maxVersion` VARCHAR(191) NULL,
    ADD COLUMN `minVersion` VARCHAR(191) NULL,
    ADD COLUMN `releaseNotes` TEXT NULL,
    ADD COLUMN `version` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `notifications` DROP COLUMN `isRead`,
    ADD COLUMN `attachments` TEXT NULL,
    ADD COLUMN `createdByType` VARCHAR(191) NOT NULL DEFAULT 'superadmin',
    ADD COLUMN `metadata` TEXT NULL,
    ADD COLUMN `scheduledAt` DATETIME(3) NULL,
    ADD COLUMN `sentAt` DATETIME(3) NULL,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'draft',
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'info',
    MODIFY `title` VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE `permissions` ADD COLUMN `category` VARCHAR(191) NULL,
    ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `resource` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `roles` ADD COLUMN `color` VARCHAR(191) NULL,
    ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `isSystem` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `priority` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `tenant_modules` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `moduleKey` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `version` VARCHAR(191) NULL,
    `settings` LONGTEXT NULL,
    `enabledAt` DATETIME(3) NULL,
    `disabledAt` DATETIME(3) NULL,
    `enabledBy` VARCHAR(191) NULL,
    `disabledBy` VARCHAR(191) NULL,
    `lastAccessedAt` DATETIME(3) NULL,
    `accessCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `tenant_modules_tenantId_fkey`(`tenantId`),
    INDEX `tenant_modules_moduleKey_fkey`(`moduleKey`),
    INDEX `tenant_modules_isEnabled_idx`(`isEnabled`),
    UNIQUE INDEX `tenant_modules_tenantId_moduleKey_key`(`tenantId`, `moduleKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notifications` (
    `id` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `isRead` BOOLEAN NOT NULL DEFAULT false,
    `readAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `user_notifications_userId_fkey`(`userId`),
    INDEX `user_notifications_notificationId_fkey`(`notificationId`),
    INDEX `user_notifications_tenantId_fkey`(`tenantId`),
    INDEX `user_notifications_isRead_idx`(`isRead`),
    INDEX `user_notifications_createdAt_idx`(`createdAt`),
    UNIQUE INDEX `user_notifications_notificationId_userId_key`(`notificationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_status_fkey` ON `audit_logs`(`status`);

-- CreateIndex
CREATE INDEX `audit_logs_severity_fkey` ON `audit_logs`(`severity`);

-- CreateIndex
CREATE INDEX `audit_logs_resourceType_fkey` ON `audit_logs`(`resourceType`);

-- CreateIndex
CREATE INDEX `audit_logs_createdAt_fkey` ON `audit_logs`(`createdAt`);

-- CreateIndex
CREATE INDEX `audit_logs_isArchived_fkey` ON `audit_logs`(`isArchived`);

-- CreateIndex
CREATE INDEX `audit_logs_retentionExpiry_fkey` ON `audit_logs`(`retentionExpiry`);

-- CreateIndex
CREATE INDEX `notifications_status_idx` ON `notifications`(`status`);

-- CreateIndex
CREATE INDEX `notifications_type_idx` ON `notifications`(`type`);

-- CreateIndex
CREATE INDEX `notifications_priority_idx` ON `notifications`(`priority`);

-- CreateIndex
CREATE INDEX `notifications_createdAt_idx` ON `notifications`(`createdAt`);

-- CreateIndex
CREATE INDEX `permissions_action_idx` ON `permissions`(`action`);

-- CreateIndex
CREATE INDEX `permissions_isActive_idx` ON `permissions`(`isActive`);

-- CreateIndex
CREATE UNIQUE INDEX `permissions_moduleKey_action_resource_key` ON `permissions`(`moduleKey`, `action`, `resource`);

-- CreateIndex
CREATE INDEX `roles_isActive_idx` ON `roles`(`isActive`);

-- CreateIndex
CREATE INDEX `roles_isTemplate_idx` ON `roles`(`isTemplate`);

-- AddForeignKey
ALTER TABLE `tenant_modules` ADD CONSTRAINT `tenant_modules_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_modules` ADD CONSTRAINT `tenant_modules_moduleKey_fkey` FOREIGN KEY (`moduleKey`) REFERENCES `modules`(`moduleKey`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notifications` ADD CONSTRAINT `user_notifications_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
