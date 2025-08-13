/*
  Warnings:

  - You are about to drop the column `device_info` on the `login_devices` table. All the data in the column will be lost.
  - You are about to drop the column `last_active_at` on the `login_devices` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[device_id]` on the table `login_devices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `device_id` to the `login_devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `login_devices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_agent` to the `login_devices` table without a default value. This is not possible if the table is not empty.
  - Made the column `ip_address` on table `login_devices` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updated_at` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `login_devices_last_active_at_idx` ON `login_devices`;

-- AlterTable
ALTER TABLE `login_devices` DROP COLUMN `device_info`,
    DROP COLUMN `last_active_at`,
    ADD COLUMN `browser` VARCHAR(191) NULL,
    ADD COLUMN `device_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `device_type` VARCHAR(191) NULL,
    ADD COLUMN `last_used_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `os` VARCHAR(191) NULL,
    ADD COLUMN `platform` VARCHAR(191) NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL,
    ADD COLUMN `user_agent` VARCHAR(191) NOT NULL,
    MODIFY `ip_address` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `refresh_tokens` ADD COLUMN `device_id` VARCHAR(191) NULL,
    ADD COLUMN `is_active` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `login_devices_device_id_key` ON `login_devices`(`device_id`);

-- CreateIndex
CREATE INDEX `login_devices_device_id_idx` ON `login_devices`(`device_id`);

-- CreateIndex
CREATE INDEX `login_devices_last_used_at_idx` ON `login_devices`(`last_used_at`);

-- CreateIndex
CREATE INDEX `refresh_tokens_device_id_idx` ON `refresh_tokens`(`device_id`);

-- CreateIndex
CREATE INDEX `refresh_tokens_is_active_idx` ON `refresh_tokens`(`is_active`);
