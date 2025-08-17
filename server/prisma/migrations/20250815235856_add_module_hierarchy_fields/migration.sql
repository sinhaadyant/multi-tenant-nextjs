-- AlterTable
ALTER TABLE `modules` ADD COLUMN `icon` VARCHAR(191) NULL DEFAULT 'FileText',
    ADD COLUMN `parent_id` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` MODIFY `token` VARCHAR(1000) NOT NULL;

-- AlterTable
ALTER TABLE `reset_tokens` MODIFY `token` VARCHAR(1000) NOT NULL;

-- CreateIndex
CREATE INDEX `modules_parent_id_idx` ON `modules`(`parent_id`);

-- AddForeignKey
ALTER TABLE `modules` ADD CONSTRAINT `modules_parent_id_fkey` FOREIGN KEY (`parent_id`) REFERENCES `modules`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
