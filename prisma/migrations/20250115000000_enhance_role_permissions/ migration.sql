-- Migration: Enhance RolePermission table with tenant-specific control
-- This migration adds tenantId and isAllowed fields to RolePermission table
-- to support the proposed design where each tenant can customize permissions

-- Add new columns to role_permissions table
ALTER TABLE `role_permissions` 
ADD COLUMN `tenantId` VARCHAR(191) NULL,
ADD COLUMN `isAllowed` BOOLEAN NOT NULL DEFAULT TRUE,
ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Create index for tenant-specific queries
CREATE INDEX `role_permissions_tenantId_fkey` ON `role_permissions`(`tenantId`);

-- Create index for permission status queries
CREATE INDEX `role_permissions_isAllowed_fkey` ON `role_permissions`(`isAllowed`);

-- Add foreign key constraint for tenantId
ALTER TABLE `role_permissions` 
ADD CONSTRAINT `role_permissions_tenantId_fkey` 
FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Update existing role_permissions to set tenantId based on the role's tenant
UPDATE `role_permissions` rp
JOIN `roles` r ON rp.roleId = r.id
SET rp.tenantId = r.tenantId
WHERE r.tenantId IS NOT NULL;

-- Create a unique constraint for role-permission-tenant combination
-- This ensures no duplicate permission assignments per tenant
ALTER TABLE `role_permissions` 
ADD CONSTRAINT `role_permissions_role_permission_tenant_unique` 
UNIQUE (`roleId`, `permissionId`, `tenantId`);
