-- Migration: Enhance roles table with role_scope and tenant_id
-- This migration adds the role_scope enum and tenant_id column to support
-- global roles created by superadmin and tenant-specific roles

-- Add role_scope enum column
ALTER TABLE `roles` 
ADD COLUMN `role_scope` ENUM('global', 'tenant') NOT NULL DEFAULT 'tenant';

-- Add tenant_id column (NULL for global roles)
ALTER TABLE `roles` 
ADD COLUMN `tenant_id` VARCHAR(191) NULL;

-- Create index for role_scope queries
CREATE INDEX `roles_role_scope_fkey` ON `roles`(`role_scope`);

-- Create index for tenant_id queries
CREATE INDEX `roles_tenant_id_fkey` ON `roles`(`tenant_id`);

-- Update existing roles to set appropriate scope
-- Roles created by superadmin should be global
UPDATE `roles` 
SET `role_scope` = 'global', `tenant_id` = NULL 
WHERE `isSystem` = true OR `isTemplate` = true OR `scope` = 'GLOBAL';

-- Roles with existing tenantId should be tenant-specific
UPDATE `roles` 
SET `role_scope` = 'tenant' 
WHERE `tenantId` IS NOT NULL AND `role_scope` = 'tenant';

-- Add unique constraint for role name within tenant scope
-- This ensures no duplicate role names within the same tenant
ALTER TABLE `roles` 
ADD CONSTRAINT `roles_name_tenant_unique` 
UNIQUE (`name`, `tenant_id`);

-- Drop the old unique constraint if it exists
-- (This might fail if the constraint doesn't exist, which is fine)
ALTER TABLE `roles` 
DROP INDEX `roles_name_tenantId_key`;

-- Update the existing unique constraint to use tenant_id instead of tenantId
-- First, let's check if the old constraint exists and drop it
SET @constraint_exists = (
  SELECT COUNT(*) 
  FROM information_schema.table_constraints 
  WHERE constraint_name = 'roles_name_tenantId_key' 
  AND table_name = 'roles'
);

SET @sql = IF(@constraint_exists > 0, 
  'ALTER TABLE `roles` DROP INDEX `roles_name_tenantId_key`', 
  'SELECT "Constraint does not exist" as message'
);

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
