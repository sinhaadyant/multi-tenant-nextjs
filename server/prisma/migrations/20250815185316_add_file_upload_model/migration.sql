-- AlterTable
ALTER TABLE `audit_logs` ADD COLUMN `file_upload_id` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `notifications` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` TEXT NOT NULL,
    `type` VARCHAR(191) NOT NULL DEFAULT 'info',
    `priority` VARCHAR(191) NOT NULL DEFAULT 'medium',
    `channels` JSON NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT false,
    `read_at` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_tenant_id_idx`(`tenant_id`),
    INDEX `notifications_is_read_idx`(`is_read`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_priority_idx`(`priority`),
    INDEX `notifications_created_at_idx`(`created_at`),
    INDEX `notifications_user_id_is_read_idx`(`user_id`, `is_read`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_notification_preferences` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `email_notifications` BOOLEAN NOT NULL DEFAULT true,
    `sms_notifications` BOOLEAN NOT NULL DEFAULT false,
    `in_app_notifications` BOOLEAN NOT NULL DEFAULT true,
    `notificationTypes` JSON NOT NULL,
    `quietHours` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_notification_preferences_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_templates` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `subject` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `variables` JSON NULL,
    `is_global` BOOLEAN NOT NULL DEFAULT false,
    `tenant_id` VARCHAR(191) NULL,
    `created_by` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `notification_templates_tenant_id_idx`(`tenant_id`),
    INDEX `notification_templates_is_global_idx`(`is_global`),
    INDEX `notification_templates_created_by_idx`(`created_by`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_searches` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `query` JSON NOT NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `saved_searches_user_id_idx`(`user_id`),
    INDEX `saved_searches_is_public_idx`(`is_public`),
    INDEX `saved_searches_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_uploads` (
    `id` VARCHAR(191) NOT NULL,
    `original_name` VARCHAR(191) NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_path` VARCHAR(191) NOT NULL,
    `mime_type` VARCHAR(191) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `tags` JSON NULL,
    `is_public` BOOLEAN NOT NULL DEFAULT false,
    `uploaded_by` VARCHAR(191) NOT NULL,
    `tenant_id` VARCHAR(191) NULL,
    `file_hash` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `file_uploads_uploaded_by_idx`(`uploaded_by`),
    INDEX `file_uploads_tenant_id_idx`(`tenant_id`),
    INDEX `file_uploads_is_public_idx`(`is_public`),
    INDEX `file_uploads_mime_type_idx`(`mime_type`),
    INDEX `file_uploads_created_at_idx`(`created_at`),
    INDEX `file_uploads_file_hash_idx`(`file_hash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `audit_logs_file_upload_id_idx` ON `audit_logs`(`file_upload_id`);

-- CreateIndex
CREATE INDEX `audit_logs_tenant_id_user_id_idx` ON `audit_logs`(`tenant_id`, `user_id`);

-- CreateIndex
CREATE INDEX `login_devices_user_id_is_active_idx` ON `login_devices`(`user_id`, `is_active`);

-- CreateIndex
CREATE INDEX `refresh_tokens_user_id_is_active_idx` ON `refresh_tokens`(`user_id`, `is_active`);

-- CreateIndex
CREATE INDEX `reset_tokens_user_id_is_used_idx` ON `reset_tokens`(`user_id`, `is_used`);

-- CreateIndex
CREATE INDEX `role_permissions_role_id_module_id_idx` ON `role_permissions`(`role_id`, `module_id`);

-- CreateIndex
CREATE INDEX `role_permissions_module_id_can_read_can_view_all_idx` ON `role_permissions`(`module_id`, `can_read`, `can_view_all`);

-- CreateIndex
CREATE INDEX `role_permissions_submodule_id_can_read_can_view_all_idx` ON `role_permissions`(`submodule_id`, `can_read`, `can_view_all`);

-- CreateIndex
CREATE INDEX `role_permissions_role_id_idx` ON `role_permissions`(`role_id`);

-- CreateIndex
CREATE INDEX `roles_tenant_id_is_global_idx` ON `roles`(`tenant_id`, `is_global`);

-- CreateIndex
CREATE INDEX `support_tickets_tenant_id_status_idx` ON `support_tickets`(`tenant_id`, `status`);

-- CreateIndex
CREATE INDEX `support_tickets_user_id_status_idx` ON `support_tickets`(`user_id`, `status`);

-- CreateIndex
CREATE INDEX `user_roles_user_id_role_id_idx` ON `user_roles`(`user_id`, `role_id`);

-- CreateIndex
CREATE INDEX `users_tenant_id_is_active_idx` ON `users`(`tenant_id`, `is_active`);

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_file_upload_id_fkey` FOREIGN KEY (`file_upload_id`) REFERENCES `file_uploads`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `user_notification_preferences` ADD CONSTRAINT `user_notification_preferences_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `notification_templates` ADD CONSTRAINT `notification_templates_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_searches` ADD CONSTRAINT `saved_searches_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_uploads` ADD CONSTRAINT `file_uploads_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_uploads` ADD CONSTRAINT `file_uploads_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- RedefineIndex
CREATE INDEX `role_permissions_module_id_idx` ON `role_permissions`(`module_id`);
DROP INDEX `role_permissions_module_id_fkey` ON `role_permissions`;

-- RedefineIndex
CREATE INDEX `role_permissions_submodule_id_idx` ON `role_permissions`(`submodule_id`);
DROP INDEX `role_permissions_submodule_id_fkey` ON `role_permissions`;
