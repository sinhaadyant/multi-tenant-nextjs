import { PermissionService, permissionService } from '../PermissionService';

describe('PermissionService', () => {
  describe('resolveEffectivePermissions', () => {
    it('should merge permissions from multiple roles', () => {
      const rolePermissions = [
        {
          roleId: 'role1',
          roleName: 'Role 1',
          isGlobal: false,
          tenantId: 'tenant1',
          permission: {
            moduleId: 'module1',
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
          tenantId: 'tenant1',
          permission: {
            moduleId: 'module1',
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

    it('should handle permissions for different modules separately', () => {
      const rolePermissions = [
        {
          roleId: 'role1',
          roleName: 'Role 1',
          isGlobal: false,
          tenantId: 'tenant1',
          permission: {
            moduleId: 'module1',
            moduleName: 'Module 1',
            canCreate: true,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
        },
        {
          roleId: 'role2',
          roleName: 'Role 2',
          isGlobal: false,
          tenantId: 'tenant1',
          permission: {
            moduleId: 'module2',
            moduleName: 'Module 2',
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

      expect(effectivePermissions).toHaveLength(2);

      const module1Permission = effectivePermissions.find(
        p => p.moduleId === 'module1'
      );
      const module2Permission = effectivePermissions.find(
        p => p.moduleId === 'module2'
      );

      expect(module1Permission?.canCreate).toBe(true);
      expect(module1Permission?.canRead).toBe(true);
      expect(module1Permission?.canUpdate).toBe(false);

      expect(module2Permission?.canCreate).toBe(false);
      expect(module2Permission?.canRead).toBe(true);
      expect(module2Permission?.canUpdate).toBe(true);
    });
  });

  describe('Cache Management', () => {
    it('should clear user cache', () => {
      // Set some test data in cache
      const testData = { userId: 'test', permissions: [] };
      (permissionService as any).setCache('user_permissions_test', testData);

      const statsBefore = permissionService.getCacheStats();
      expect(statsBefore.size).toBeGreaterThan(0);

      permissionService.clearUserCache('test');

      const statsAfter = permissionService.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    it('should clear all cache', () => {
      // Set some test data in cache
      const testData1 = { userId: 'test1', permissions: [] };
      const testData2 = { userId: 'test2', permissions: [] };
      (permissionService as any).setCache('user_permissions_test1', testData1);
      (permissionService as any).setCache('user_permissions_test2', testData2);

      const statsBefore = permissionService.getCacheStats();
      expect(statsBefore.size).toBe(2);

      permissionService.clearAllCache();

      const statsAfter = permissionService.getCacheStats();
      expect(statsAfter.size).toBe(0);
    });

    it('should get cache statistics', () => {
      permissionService.clearAllCache();

      const stats = permissionService.getCacheStats();
      expect(stats.size).toBe(0);
      expect(stats.entries).toEqual([]);
    });
  });

  describe('TypeScript Interfaces', () => {
    it('should have correct Permission interface structure', () => {
      const permission: any = {
        moduleId: 'test-module',
        moduleName: 'Test Module',
        submoduleId: 'test-submodule',
        submoduleName: 'Test Submodule',
        canCreate: true,
        canRead: true,
        canUpdate: false,
        canDelete: false,
        canViewAll: true,
      };

      expect(permission.moduleId).toBe('test-module');
      expect(permission.moduleName).toBe('Test Module');
      expect(permission.canCreate).toBe(true);
      expect(permission.canRead).toBe(true);
      expect(permission.canUpdate).toBe(false);
      expect(permission.canDelete).toBe(false);
      expect(permission.canViewAll).toBe(true);
    });

    it('should have correct DataScope interface structure', () => {
      const dataScope: any = {
        scope: 'tenant',
        tenantId: 'test-tenant',
        userId: 'test-user',
      };

      expect(dataScope.scope).toBe('tenant');
      expect(dataScope.tenantId).toBe('test-tenant');
      expect(dataScope.userId).toBe('test-user');
    });

    it('should have correct UserPermissions interface structure', () => {
      const userPermissions: any = {
        userId: 'test-user',
        isSuperadmin: false,
        tenantId: 'test-tenant',
        permissions: [],
        accessibleTenants: ['tenant1', 'tenant2'],
      };

      expect(userPermissions.userId).toBe('test-user');
      expect(userPermissions.isSuperadmin).toBe(false);
      expect(userPermissions.tenantId).toBe('test-tenant');
      expect(userPermissions.permissions).toEqual([]);
      expect(userPermissions.accessibleTenants).toEqual(['tenant1', 'tenant2']);
    });
  });

  describe('PermissionAction Type', () => {
    it('should accept valid permission actions', () => {
      const validActions = ['create', 'read', 'update', 'delete', 'view_all'];

      validActions.forEach(action => {
        expect(validActions).toContain(action);
      });
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = PermissionService.getInstance();
      const instance2 = PermissionService.getInstance();

      expect(instance1).toBe(instance2);
    });
  });
});
