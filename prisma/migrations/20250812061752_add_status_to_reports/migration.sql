-- AlterTable
ALTER TABLE `reports` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'generating';

-- CreateTable
CREATE TABLE `backups` (
    `id` VARCHAR(191) NOT NULL,
    `filename` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'processing',
    `fileSize` INTEGER NOT NULL DEFAULT 0,
    `duration` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `createdById` VARCHAR(191) NOT NULL,
    `options` JSON NULL,
    `filePath` VARCHAR(191) NULL,

    INDEX `backups_createdById_fkey`(`createdById`),
    INDEX `backups_status_idx`(`status`),
    INDEX `backups_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `reports_status_idx` ON `reports`(`status`);

-- AddForeignKey
ALTER TABLE `backups` ADD CONSTRAINT `backups_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `super_admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
