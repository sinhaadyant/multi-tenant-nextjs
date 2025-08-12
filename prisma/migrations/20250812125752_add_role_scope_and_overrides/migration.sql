-- AlterTable
ALTER TABLE `roles` ADD COLUMN `scope` VARCHAR(191) NOT NULL DEFAULT 'TENANT';

-- CreateTable
CREATE TABLE `tenant_role_overrides` (
    `id` VARCHAR(191) NOT NULL,
    `tenantId` VARCHAR(191) NOT NULL,
    `roleId` VARCHAR(191) NOT NULL,
    `permissionId` VARCHAR(191) NOT NULL,
    `isGranted` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `createdBy` VARCHAR(191) NULL,

    INDEX `tenant_role_overrides_tenantId_fkey`(`tenantId`),
    INDEX `tenant_role_overrides_roleId_fkey`(`roleId`),
    INDEX `tenant_role_overrides_permissionId_fkey`(`permissionId`),
    UNIQUE INDEX `tenant_role_overrides_tenantId_roleId_permissionId_key`(`tenantId`, `roleId`, `permissionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `roles_scope_idx` ON `roles`(`scope`);

-- AddForeignKey
ALTER TABLE `tenant_role_overrides` ADD CONSTRAINT `tenant_role_overrides_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_role_overrides` ADD CONSTRAINT `tenant_role_overrides_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tenant_role_overrides` ADD CONSTRAINT `tenant_role_overrides_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
