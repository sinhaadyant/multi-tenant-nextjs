/*
  Warnings:

  - You are about to drop the column `module` on the `permissions` table. All the data in the column will be lost.
  - Added the required column `moduleKey` to the `permissions` table without a default value. This is not possible if the table is not empty.

*/

-- CreateTable
CREATE TABLE `modules` (
    `id` VARCHAR(191) NOT NULL,
    `moduleKey` VARCHAR(191) NOT NULL,
    `moduleName` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `parentModuleKey` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `isVisible` BOOLEAN NOT NULL DEFAULT true,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `modules_moduleKey_key`(`moduleKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default modules
INSERT INTO `modules` (`id`, `moduleKey`, `moduleName`, `path`, `icon`, `parentModuleKey`, `description`, `isActive`, `isVisible`, `orderIndex`, `createdAt`, `updatedAt`) VALUES
('clx1', 'dashboard', 'Dashboard', '/dashboard', 'LayoutDashboard', NULL, 'Main dashboard with overview and analytics', true, true, 1, NOW(), NOW()),
('clx2', 'users', 'User Management', '/users', 'Users', NULL, 'Manage tenant users, roles, and permissions', true, true, 2, NOW(), NOW()),
('clx3', 'roles', 'Roles & Permissions', '/roles', 'Shield', NULL, 'Manage roles and assign permissions', true, true, 3, NOW(), NOW()),
('clx4', 'reports', 'Reports & Analytics', '/reports', 'BarChart3', NULL, 'Generate and view reports and analytics', true, true, 4, NOW(), NOW()),
('clx5', 'audit', 'Audit Logs', '/audit', 'ClipboardList', NULL, 'View system audit logs and activity', true, true, 5, NOW(), NOW()),
('clx6', 'notifications', 'Notifications', '/notifications', 'Bell', NULL, 'Manage notifications and alerts', true, true, 6, NOW(), NOW()),
('clx7', 'settings', 'Settings', '/settings', 'Settings', NULL, 'System and tenant settings', true, true, 7, NOW(), NOW()),
('clx8', 'support', 'Support', '/support', 'LifeBuoy', NULL, 'Support tickets and help', true, true, 8, NOW(), NOW()),
('clx9', 'content', 'Content Management', '/content', 'FileText', NULL, 'Manage content and documents', true, true, 9, NOW(), NOW()),
('clx10', 'analytics', 'Analytics', '/analytics', 'Activity', 'reports', 'Advanced analytics and insights', true, true, 1, NOW(), NOW()),
('clx11', 'user-management', 'User Management', '/users/management', 'UserCheck', 'users', 'Create, edit, and manage users', true, true, 1, NOW(), NOW()),
('clx12', 'role-management', 'Role Management', '/roles/management', 'ShieldCheck', 'roles', 'Create and manage roles', true, true, 1, NOW(), NOW()),
('clx13', 'permission-management', 'Permission Management', '/roles/permissions', 'Key', 'roles', 'Manage permissions and access rights', true, true, 2, NOW(), NOW());

-- AddForeignKey for modules self-reference
ALTER TABLE `modules` ADD CONSTRAINT `modules_parentModuleKey_fkey` FOREIGN KEY (`parentModuleKey`) REFERENCES `modules`(`moduleKey`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Add moduleKey column to permissions table
ALTER TABLE `permissions` ADD COLUMN `moduleKey` VARCHAR(191) NULL;

-- Update existing permissions with correct moduleKey values
UPDATE `permissions` SET `moduleKey` = 'dashboard' WHERE `module` = 'Dashboard' AND `action` = 'view';
UPDATE `permissions` SET `moduleKey` = 'users' WHERE `module` = 'Users' AND `action` IN ('view', 'create', 'edit', 'delete');
UPDATE `permissions` SET `moduleKey` = 'roles' WHERE `module` = 'Roles' AND `action` IN ('view', 'create', 'edit', 'delete');
UPDATE `permissions` SET `moduleKey` = 'reports' WHERE `module` = 'Reports' AND `action` IN ('view', 'create', 'export');
UPDATE `permissions` SET `moduleKey` = 'audit' WHERE `module` = 'Audit' AND `action` IN ('view', 'export');
UPDATE `permissions` SET `moduleKey` = 'notifications' WHERE `module` = 'Notifications' AND `action` IN ('view', 'create', 'send');
UPDATE `permissions` SET `moduleKey` = 'settings' WHERE `module` = 'Settings' AND `action` IN ('view', 'edit');
UPDATE `permissions` SET `moduleKey` = 'support' WHERE `module` = 'Support' AND `action` IN ('view', 'create', 'manage');
UPDATE `permissions` SET `moduleKey` = 'content' WHERE `module` = 'Content' AND `action` IN ('view', 'create', 'edit', 'delete');

-- Make moduleKey required
ALTER TABLE `permissions` MODIFY COLUMN `moduleKey` VARCHAR(191) NOT NULL;

-- Drop the old module column
ALTER TABLE `permissions` DROP COLUMN `module`;

-- AddForeignKey for permissions to modules
ALTER TABLE `permissions` ADD CONSTRAINT `permissions_moduleKey_fkey` FOREIGN KEY (`moduleKey`) REFERENCES `modules`(`moduleKey`) ON DELETE RESTRICT ON UPDATE CASCADE;
