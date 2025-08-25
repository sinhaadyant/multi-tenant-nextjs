/*
  Warnings:

  - A unique constraint covering the columns `[name,tenantId,isGlobal]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `roles_name_isGlobal_key` ON `roles`;

-- CreateTable
CREATE TABLE `user_invitations` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `invitedById` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `message` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `acceptedAt` DATETIME(3) NULL,

    UNIQUE INDEX `user_invitations_token_key`(`token`),
    INDEX `user_invitations_tenantId_fkey`(`tenantId`),
    INDEX `user_invitations_roleId_fkey`(`roleId`),
    INDEX `user_invitations_invitedById_fkey`(`invitedById`),
    INDEX `user_invitations_email_idx`(`email`),
    INDEX `user_invitations_token_idx`(`token`),
    INDEX `user_invitations_status_idx`(`status`),
    INDEX `user_invitations_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `global_settings` (
    `id` VARCHAR(191) NOT NULL,
    `socialLogin` LONGTEXT NOT NULL,
    `security` LONGTEXT NOT NULL,
    `features` LONGTEXT NOT NULL,
    `updatedBy` VARCHAR(191) NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `global_settings_updatedBy_idx`(`updatedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `roles_name_tenantId_isGlobal_key` ON `roles`(`name`, `tenantId`, `isGlobal`);

-- AddForeignKey
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_invitations` ADD CONSTRAINT `user_invitations_invitedById_fkey` FOREIGN KEY (`invitedById`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
