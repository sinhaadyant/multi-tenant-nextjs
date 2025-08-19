/*
  Warnings:

  - You are about to drop the column `permissionId` on the `role_permissions` table. All the data in the column will be lost.
  - You are about to drop the `permissions` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[roleId,moduleKey]` on the `role_permissions` table will be added. If there are existing duplicate values, this will fail.
  - Added the required column `moduleKey` to the `role_permissions` table without a default value. This is not possible if the table is not empty.

*/

-- Step 1: Add isGlobal column to roles table
ALTER TABLE `roles` ADD COLUMN `isGlobal` BOOLEAN NOT NULL DEFAULT false;

-- Step 2: Update isGlobal based on tenantId
UPDATE `roles` SET `isGlobal` = CASE WHEN `tenantId` IS NULL THEN true ELSE false END;

-- Step 3: Create temporary table to store module-based permissions
CREATE TEMPORARY TABLE `temp_role_permissions` (
  `id` VARCHAR(191) NOT NULL,
  `roleId` VARCHAR(191) NOT NULL,
  `moduleKey` VARCHAR(191) NOT NULL,
  `canCreate` BOOLEAN NOT NULL DEFAULT false,
  `canRead` BOOLEAN NOT NULL DEFAULT false,
  `canUpdate` BOOLEAN NOT NULL DEFAULT false,
  `canDelete` BOOLEAN NOT NULL DEFAULT false,
  `canViewAll` BOOLEAN NOT NULL DEFAULT false
);

-- Step 4: Migrate data from permission-based to module-based, handling duplicates
INSERT INTO `temp_role_permissions` (`id`, `roleId`, `moduleKey`, `canCreate`, `canRead`, `canUpdate`, `canDelete`, `canViewAll`)
SELECT 
  UUID() as id,
  rp.roleId,
  p.moduleKey,
  MAX(rp.canCreate) as canCreate,
  MAX(rp.canRead) as canRead,
  MAX(rp.canUpdate) as canUpdate,
  MAX(rp.canDelete) as canDelete,
  MAX(rp.canViewAll) as canViewAll
FROM `role_permissions` rp
JOIN `permissions` p ON rp.permissionId = p.id
GROUP BY rp.roleId, p.moduleKey;

-- Step 5: Drop foreign keys and indexes
ALTER TABLE `permissions` DROP FOREIGN KEY `permissions_moduleKey_fkey`;
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_permissionId_fkey`;
ALTER TABLE `role_permissions` DROP FOREIGN KEY `role_permissions_roleId_fkey`;
DROP INDEX `role_permissions_permissionId_fkey` ON `role_permissions`;
DROP INDEX `role_permissions_roleId_permissionId_key` ON `role_permissions`;

-- Step 6: Drop old columns and add new ones
ALTER TABLE `role_permissions` DROP COLUMN `permissionId`;
ALTER TABLE `role_permissions` ADD COLUMN `moduleKey` VARCHAR(191) NOT NULL;

-- Step 7: Drop permissions table
DROP TABLE `permissions`;

-- Step 8: Clear existing role_permissions and restore data from temporary table
DELETE FROM `role_permissions`;

INSERT INTO `role_permissions` (`id`, `roleId`, `moduleKey`, `canCreate`, `canRead`, `canUpdate`, `canDelete`, `canViewAll`)
SELECT `id`, `roleId`, `moduleKey`, `canCreate`, `canRead`, `canUpdate`, `canDelete`, `canViewAll`
FROM `temp_role_permissions`;

-- Step 9: Drop temporary table
DROP TABLE `temp_role_permissions`;

-- Step 10: Create new indexes and foreign keys
CREATE INDEX `role_permissions_moduleKey_fkey` ON `role_permissions`(`moduleKey`);
CREATE UNIQUE INDEX `role_permissions_roleId_moduleKey_key` ON `role_permissions`(`roleId`, `moduleKey`);
CREATE INDEX `roles_isGlobal_fkey` ON `roles`(`isGlobal`);

-- Step 11: Add foreign key constraints
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_moduleKey_fkey` FOREIGN KEY (`moduleKey`) REFERENCES `modules`(`moduleKey`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `role_permissions` ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
