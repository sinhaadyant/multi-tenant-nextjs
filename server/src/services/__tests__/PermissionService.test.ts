import { PrismaClient } from '@prisma/client';
import { PermissionService, permissionService } from '../PermissionService';
import {
  createTestDatabase,
  cleanupTestDatabase,
} from '../../test/helpers/database';

const prisma = new PrismaClient();

describe('PermissionService', () => {
  let testUserId: string;
  let testTenantId: string;
  let testRoleId: string;
  let testModuleId: string;
  let testSubmoduleId: string;

  beforeAll(async () => {
    await createTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create test data
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test-tenant.com',
      },
    });
    testTenantId = tenant.id;

    const module = await prisma.module.create({
      data: {
        name: 'Test Module',
        description: 'Test module for permissions',
      },
    });
    testModuleId = module.id;

    const submodule = await prisma.submodule.create({
      data: {
        moduleId: testModuleId,
        name: 'Test Submodule',
        description: 'Test submodule for permissions',
      },
    });
    testSubmoduleId = submodule.id;

    const role = await prisma.role.create({
      data: {
        tenantId: testTenantId,
        name: 'Test Role',
        description: 'Test role for permissions',
      },
    });
    testRoleId = role.id;

    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@example.com',
        passwordHash: 'hashedpassword',
        tenantId: testTenantId,
      },
    });
    testUserId = user.id;

    // Assign role to user
    await prisma.userRole.create({
      data: {
        userId: testUserId,
        roleId: testRoleId,
      },
    });
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.submodule.deleteMany();
    await prisma.module.deleteMany();
    await prisma.tenant.deleteMany();

    // Clear cache
    permissionService.clearAllCache();
  });

  describe('getUserPermissions', () => {
    it('should return user permissions with role assignments', async () => {
      // Create permission for the role
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });

      const permissions =
        await permissionService.getUserPermissions(testUserId);

      expect(permissions.userId).toBe(testUserId);
      expect(permissions.isSuperadmin).toBe(false);
      expect(permissions.tenantId).toBe(testTenantId);
      expect(permissions.permissions).toHaveLength(1);
      expect(permissions.permissions[0].canCreate).toBe(true);
      expect(permissions.permissions[0].canRead).toBe(true);
      expect(permissions.permissions[0].canUpdate).toBe(false);
      expect(permissions.permissions[0].canDelete).toBe(false);
      expect(permissions.permissions[0].canViewAll).toBe(true);
    });

    it('should return full permissions for superadmin', async () => {
      // Make user superadmin
      await prisma.user.update({
        where: { id: testUserId },
        data: { isSuperadmin: true },
      });

      const permissions =
        await permissionService.getUserPermissions(testUserId);

      expect(permissions.isSuperadmin).toBe(true);
      expect(permissions.permissions.length).toBeGreaterThan(0);
      expect(permissions.accessibleTenants).toBeDefined();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        permissionService.getUserPermissions('non-existent-id')
      ).rejects.toThrow('User not found');
    });
  });

  describe('hasPermission', () => {
    beforeEach(async () => {
      // Create permission for the role
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });
    });

    it('should return true for granted permissions', async () => {
      const hasCreate = await permissionService.hasPermission(
        testUserId,
        testModuleId,
        'create'
      );
      const hasRead = await permissionService.hasPermission(
        testUserId,
        testModuleId,
        'read'
      );
      const hasViewAll = await permissionService.hasPermission(
        testUserId,
        testModuleId,
        'view_all'
      );

      expect(hasCreate).toBe(true);
      expect(hasRead).toBe(true);
      expect(hasViewAll).toBe(true);
    });

    it('should return false for denied permissions', async () => {
      const hasUpdate = await permissionService.hasPermission(
        testUserId,
        testModuleId,
        'update'
      );
      const hasDelete = await permissionService.hasPermission(
        testUserId,
        testModuleId,
        'delete'
      );

      expect(hasUpdate).toBe(false);
      expect(hasDelete).toBe(false);
    });

    it('should work with module names', async () => {
      const hasRead = await permissionService.hasPermission(
        testUserId,
        'Test Module',
        'read'
      );
      expect(hasRead).toBe(true);
    });

    it('should return false for non-existent module', async () => {
      const hasRead = await permissionService.hasPermission(
        testUserId,
        'NonExistentModule',
        'read'
      );
      expect(hasRead).toBe(false);
    });

    it('should return true for superadmin regardless of permissions', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { isSuperadmin: true },
      });

      const hasPermission = await permissionService.hasPermission(
        testUserId,
        'AnyModule',
        'create'
      );
      expect(hasPermission).toBe(true);
    });
  });

  describe('getDataScope', () => {
    beforeEach(async () => {
      // Create permission for the role
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });
    });

    it('should return tenant scope when canViewAll is true', async () => {
      const scope = await permissionService.getDataScope(
        testUserId,
        testModuleId
      );

      expect(scope.scope).toBe('tenant');
      expect(scope.tenantId).toBe(testTenantId);
      expect(scope.userId).toBeUndefined();
    });

    it('should return own scope when canViewAll is false', async () => {
      // Update permission to not have view_all
      await prisma.rolePermission.updateMany({
        where: { roleId: testRoleId, moduleId: testModuleId },
        data: { canViewAll: false },
      });

      const scope = await permissionService.getDataScope(
        testUserId,
        testModuleId
      );

      expect(scope.scope).toBe('own');
      expect(scope.userId).toBe(testUserId);
      expect(scope.tenantId).toBeUndefined();
    });

    it('should return all scope for superadmin', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { isSuperadmin: true },
      });

      const scope = await permissionService.getDataScope(
        testUserId,
        testModuleId
      );

      expect(scope.scope).toBe('all');
      expect(scope.tenantId).toBeUndefined();
      expect(scope.userId).toBeUndefined();
    });
  });

  describe('resolveEffectivePermissions', () => {
    it('should merge permissions from multiple roles', () => {
      const rolePermissions = [
        {
          roleId: 'role1',
          roleName: 'Role 1',
          isGlobal: false,
          tenantId: testTenantId,
          permission: {
            moduleId: testModuleId,
            moduleName: 'Test Module',
            canCreate: true,
            canRead: false,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
        },
        {
          roleId: 'role2',
          roleName: 'Role 2',
          isGlobal: false,
          tenantId: testTenantId,
          permission: {
            moduleId: testModuleId,
            moduleName: 'Test Module',
            canCreate: false,
            canRead: true,
            canUpdate: true,
            canDelete: false,
            canViewAll: false,
          },
        },
      ];

      const effectivePermissions =
        permissionService.resolveEffectivePermissions(rolePermissions);

      expect(effectivePermissions).toHaveLength(1);
      expect(effectivePermissions[0].canCreate).toBe(true);
      expect(effectivePermissions[0].canRead).toBe(true);
      expect(effectivePermissions[0].canUpdate).toBe(true);
      expect(effectivePermissions[0].canDelete).toBe(false);
      expect(effectivePermissions[0].canViewAll).toBe(false);
    });
  });

  describe('getAccessibleTenants', () => {
    it('should return all active tenants for superadmin', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { isSuperadmin: true },
      });

      const tenants = await permissionService.getAccessibleTenants(testUserId);

      expect(tenants).toContain(testTenantId);
    });

    it('should return empty array for non-superadmin', async () => {
      const tenants = await permissionService.getAccessibleTenants(testUserId);

      expect(tenants).toEqual([]);
    });
  });

  describe('validatePermissions', () => {
    beforeEach(async () => {
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });
    });

    it('should return valid for granted permissions', async () => {
      const result = await permissionService.validatePermissions(testUserId, [
        { moduleKey: testModuleId, action: 'create' },
        { moduleKey: testModuleId, action: 'read' },
      ]);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid for denied permissions', async () => {
      const result = await permissionService.validatePermissions(testUserId, [
        { moduleKey: testModuleId, action: 'update' },
        { moduleKey: testModuleId, action: 'delete' },
      ]);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('getUserRoles', () => {
    it('should return user roles with permissions', async () => {
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });

      const roles = await permissionService.getUserRoles(testUserId);

      expect(roles).toHaveLength(1);
      expect(roles[0].roleId).toBe(testRoleId);
      expect(roles[0].roleName).toBe('Test Role');
      expect(roles[0].permissions).toHaveLength(1);
    });
  });

  describe('isUserSuperadmin', () => {
    it('should return true for superadmin user', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { isSuperadmin: true },
      });

      const isSuperadmin = await permissionService.isUserSuperadmin(testUserId);
      expect(isSuperadmin).toBe(true);
    });

    it('should return false for non-superadmin user', async () => {
      const isSuperadmin = await permissionService.isUserSuperadmin(testUserId);
      expect(isSuperadmin).toBe(false);
    });
  });

  describe('getAccessibleModules', () => {
    beforeEach(async () => {
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });
    });

    it('should return modules where user has read permission', async () => {
      const modules = await permissionService.getAccessibleModules(testUserId);

      expect(modules).toHaveLength(1);
      expect(modules[0].id).toBe(testModuleId);
      expect(modules[0].name).toBe('Test Module');
    });

    it('should return all modules for superadmin', async () => {
      await prisma.user.update({
        where: { id: testUserId },
        data: { isSuperadmin: true },
      });

      const modules = await permissionService.getAccessibleModules(testUserId);

      expect(modules.length).toBeGreaterThan(0);
    });
  });

  describe('Cache Management', () => {
    it('should cache user permissions', async () => {
      await prisma.rolePermission.create({
        data: {
          roleId: testRoleId,
          moduleId: testModuleId,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: true,
        },
      });

      // First call should cache
      await permissionService.getUserPermissions(testUserId);

      // Second call should use cache
      const startTime = Date.now();
      await permissionService.getUserPermissions(testUserId);
      const endTime = Date.now();

      // Should be very fast (cached)
      expect(endTime - startTime).toBeLessThan(10);
    });

    it('should clear user cache', async () => {
      await permissionService.getUserPermissions(testUserId);

      const statsBefore = permissionService.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      permissionService.clearUserCache(testUserId);

      const statsAfter = permissionService.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    it('should clear all cache', async () => {
      await permissionService.getUserPermissions(testUserId);

      const statsBefore = permissionService.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      permissionService.clearAllCache();

      const statsAfter = permissionService.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });
  });
});
