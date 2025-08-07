/*
  Warnings:

  - You are about to drop the column `subject` on the `support_tickets` table. All the data in the column will be lost.
  - Added the required column `title` to the `support_tickets` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `support_tickets` DROP COLUMN `subject`,
    ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'general',
    ADD COLUMN `isForwarded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `title` VARCHAR(255) NOT NULL,
    MODIFY `description` TEXT NOT NULL;

-- CreateTable
CREATE TABLE `support_ticket_comments` (
    `id` VARCHAR(191) NOT NULL,
    `text` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ticketId` VARCHAR(191) NOT NULL,
    `commentedBy` VARCHAR(191) NOT NULL,
    `commenterType` VARCHAR(191) NOT NULL,

    INDEX `support_ticket_comments_ticketId_fkey`(`ticketId`),
    INDEX `support_ticket_comments_commentedBy_fkey`(`commentedBy`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_ticket_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `ticketId` VARCHAR(191) NOT NULL,

    INDEX `support_ticket_attachments_ticketId_fkey`(`ticketId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `support_ticket_comment_attachments` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `originalName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `size` INTEGER NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `commentId` VARCHAR(191) NOT NULL,

    INDEX `support_ticket_comment_attachments_commentId_fkey`(`commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reports` (
    `id` VARCHAR(191) NOT NULL,
    `reportType` VARCHAR(191) NOT NULL,
    `dateFrom` DATETIME(3) NOT NULL,
    `dateTo` DATETIME(3) NOT NULL,
    `tenantId` VARCHAR(191) NULL,
    `format` VARCHAR(191) NOT NULL,
    `filters` LONGTEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'generating',
    `fileName` VARCHAR(191) NOT NULL,
    `filePath` VARCHAR(191) NULL,
    `fileSize` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `generatedBy` VARCHAR(191) NOT NULL,

    INDEX `reports_generatedBy_fkey`(`generatedBy`),
    INDEX `reports_tenantId_fkey`(`tenantId`),
    INDEX `reports_status_fkey`(`status`),
    INDEX `reports_reportType_fkey`(`reportType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `support_tickets_status_fkey` ON `support_tickets`(`status`);

-- CreateIndex
CREATE INDEX `support_tickets_priority_fkey` ON `support_tickets`(`priority`);

-- CreateIndex
CREATE INDEX `support_tickets_category_fkey` ON `support_tickets`(`category`);

-- AddForeignKey
ALTER TABLE `support_ticket_comments` ADD CONSTRAINT `support_ticket_comments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_attachments` ADD CONSTRAINT `support_ticket_attachments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `support_ticket_comment_attachments` ADD CONSTRAINT `support_ticket_comment_attachments_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `support_ticket_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_generatedBy_fkey` FOREIGN KEY (`generatedBy`) REFERENCES `super_admins`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reports` ADD CONSTRAINT `reports_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
