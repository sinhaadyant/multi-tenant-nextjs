-- AlterTable
ALTER TABLE `password_reset_tokens` ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'superadmin';
