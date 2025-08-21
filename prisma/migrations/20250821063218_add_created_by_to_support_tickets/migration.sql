-- AlterTable
ALTER TABLE `support_tickets` ADD COLUMN `createdBy` VARCHAR(191) NULL,
    ADD COLUMN `createdByType` VARCHAR(191) NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX `support_tickets_createdBy_fkey` ON `support_tickets`(`createdBy`);

-- AddForeignKey
ALTER TABLE `support_tickets` ADD CONSTRAINT `support_tickets_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `super_admins`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
