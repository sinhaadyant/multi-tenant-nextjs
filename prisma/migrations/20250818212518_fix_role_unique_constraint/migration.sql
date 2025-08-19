/*
  Warnings:

  - A unique constraint covering the columns `[name,isGlobal]` on the table `roles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX `roles_name_tenantId_key` ON `roles`;

-- CreateIndex
CREATE UNIQUE INDEX `roles_name_isGlobal_key` ON `roles`(`name`, `isGlobal`);
