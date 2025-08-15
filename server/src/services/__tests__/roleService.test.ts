import { RoleService } from '../roleService';
import { testDatabase } from '../../test/helpers/database';
import { PrismaClient } from '@prisma/client';

describe('RoleService', () => {
  let roleService: RoleService;
  let prisma: PrismaClient;
  let testData: any;

  beforeAll(async () => {
    prisma = testDatabase.getClient();
    roleService = new RoleService(prisma);

    // Setup test data
    await testDatabase.runMigrations();
    testData = await testDatabase.seedDatabase();
  });

  afterAll(async () => {
    await testDatabase.disconnect();
  });

  beforeEach(async () => {
    await testDatabase.cleanDatabase();
    testData = await testDatabase.seedDatabase();
  });

  describe('createRole', () => {
    it('should create a new role successfully', async () => {
      const roleData = {
        name: 'Test Role',
        description: 'A test role for testing',
        isGlobal: false,
        color: '#3B82F6',
        icon: 'test-icon',
        priority: 5,
        tenantId: testData.tenant.id,
        permissions: [
          {
            moduleId: testData.modules.userModule.id,
            canCreate: true,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: true,
          },
        ],
      };

      const result = await roleService.createRole(roleData);

      expect(result).toBeDefined();
      expect(result.name).toBe(roleData.name);
      expect(result.description).toBe(roleData.description);
      expect(result.isGlobal).toBe(roleData.isGlobal);
      expect(result.color).toBe(roleData.color);
      expect(result.icon).toBe(roleData.icon);
      expect(result.priority).toBe(roleData.priority);
      expect(result.tenantId).toBe(testData.tenant.id);
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(1);
    });

    it('should throw error for duplicate role name in same tenant', async () => {
      const roleData = {
        name: 'Administrator', // Already exists
        description: 'Duplicate role',
        isGlobal: false,
        tenantId: testData.tenant.id,
      };

      await expect(roleService.createRole(roleData)).rejects.toThrow();
    });

    it('should allow same role name in different tenants', async () => {
      // Create another tenant
      const anotherTenant = await prisma.tenant.create({
        data: {
          name: 'Another Tenant',
          slug: 'another-tenant',
          isActive: true,
        },
      });

      const roleData = {
        name: 'Administrator', // Same name as admin role
        description: 'Another admin role',
        isGlobal: false,
        tenantId: anotherTenant.id,
      };

      const result = await roleService.createRole(roleData);
      expect(result).toBeDefined();
      expect(result.name).toBe(roleData.name);
      expect(result.tenantId).toBe(anotherTenant.id);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        name: '', // Empty name
        description: 'Test description',
        tenantId: testData.tenant.id,
      };

      await expect(
        roleService.createRole(invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('updateRole', () => {
    it('should update role successfully', async () => {
      const updateData = {
        name: 'Updated Role Name',
        description: 'Updated description',
        color: '#EF4444',
        priority: 10,
      };

      const result = await roleService.updateRole(
        testData.roles.userRole.id,
        updateData
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(updateData.name);
      expect(result.description).toBe(updateData.description);
      expect(result.color).toBe(updateData.color);
      expect(result.priority).toBe(updateData.priority);
    });

    it('should not update system roles', async () => {
      const updateData = { name: 'Updated System Role' };

      await expect(
        roleService.updateRole(testData.roles.adminRole.id, updateData)
      ).rejects.toThrow();
    });

    it('should throw error for non-existent role', async () => {
      const updateData = { name: 'Updated Role' };

      await expect(
        roleService.updateRole('non-existent-id', updateData)
      ).rejects.toThrow();
    });
  });

  describe('getRoleById', () => {
    it('should return role by ID', async () => {
      const role = await roleService.getRoleById(testData.roles.adminRole.id);

      expect(role).toBeDefined();
      expect(role?.id).toBe(testData.roles.adminRole.id);
      expect(role?.name).toBe(testData.roles.adminRole.name);
    });

    it('should return null for non-existent role', async () => {
      const role = await roleService.getRoleById('non-existent-id');
      expect(role).toBeNull();
    });

    it('should include permissions when requested', async () => {
      const role = await roleService.getRoleById(testData.roles.adminRole.id, {
        includePermissions: true,
      });

      expect(role).toBeDefined();
      expect(role?.permissions).toBeDefined();
      expect(role?.permissions.length).toBeGreaterThan(0);
    });
  });

  describe('getRoleByName', () => {
    it('should return role by name', async () => {
      const role = await roleService.getRoleByName(
        'Administrator',
        testData.tenant.id
      );

      expect(role).toBeDefined();
      expect(role?.name).toBe('Administrator');
    });

    it('should return null for non-existent role name', async () => {
      const role = await roleService.getRoleByName(
        'NonExistentRole',
        testData.tenant.id
      );
      expect(role).toBeNull();
    });

    it('should return null for role name in different tenant', async () => {
      const role = await roleService.getRoleByName(
        'Administrator',
        'different-tenant-id'
      );
      expect(role).toBeNull();
    });
  });

  describe('listRoles', () => {
    it('should return paginated roles', async () => {
      const result = await roleService.listRoles({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
      });

      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.meta).toBeDefined();
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBeGreaterThan(0);
    });

    it('should filter by search term', async () => {
      const result = await roleService.listRoles({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
        search: 'admin',
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].name.toLowerCase()).toContain('admin');
    });

    it('should filter by global status', async () => {
      const result = await roleService.listRoles({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
        isGlobal: false,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(role => role.isGlobal === false)).toBe(true);
    });

    it('should filter by system status', async () => {
      const result = await roleService.listRoles({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
        isSystem: true,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(role => role.isSystem === true)).toBe(true);
    });
  });

  describe('deleteRole', () => {
    it('should soft delete role', async () => {
      const result = await roleService.deleteRole(testData.roles.userRole.id);

      expect(result).toBeDefined();
      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).not.toBeNull();
    });

    it('should throw error for non-existent role', async () => {
      await expect(roleService.deleteRole('non-existent-id')).rejects.toThrow();
    });

    it('should not allow deleting system roles', async () => {
      await expect(
        roleService.deleteRole(testData.roles.adminRole.id)
      ).rejects.toThrow();
    });

    it('should not allow deleting roles with assigned users', async () => {
      // Create a role with assigned users
      const roleWithUsers = await prisma.role.create({
        data: {
          name: 'Role With Users',
          description: 'Role that has users assigned',
          isGlobal: false,
          tenantId: testData.tenant.id,
        },
      });

      // Assign user to role
      await prisma.user.update({
        where: { id: testData.users.adminUser.id },
        data: { roleId: roleWithUsers.id },
      });

      await expect(roleService.deleteRole(roleWithUsers.id)).rejects.toThrow();
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions successfully', async () => {
      const permissions = [
        {
          moduleId: testData.modules.userModule.id,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: false,
          canViewAll: true,
        },
        {
          moduleId: testData.modules.roleModule.id,
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        },
      ];

      const result = await roleService.updateRolePermissions(
        testData.roles.userRole.id,
        permissions
      );

      expect(result).toBeDefined();
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(2);
    });

    it('should replace existing permissions when replace is true', async () => {
      const newPermissions = [
        {
          moduleId: testData.modules.userModule.id,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        },
      ];

      const result = await roleService.updateRolePermissions(
        testData.roles.adminRole.id,
        newPermissions,
        true
      );

      expect(result.permissions.length).toBe(1);
    });

    it('should throw error for non-existent role', async () => {
      const permissions = [
        {
          moduleId: testData.modules.userModule.id,
          canCreate: true,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        },
      ];

      await expect(
        roleService.updateRolePermissions('non-existent-id', permissions)
      ).rejects.toThrow();
    });
  });

  describe('assignUsersToRole', () => {
    it('should assign users to role successfully', async () => {
      const userIds = [
        testData.users.adminUser.id,
        testData.users.regularUser.id,
      ];

      const result = await roleService.assignUsersToRole(
        testData.roles.userRole.id,
        userIds
      );

      expect(result).toBeDefined();
      expect(result.assignedCount).toBe(2);

      // Verify assignments
      const users = await Promise.all(
        userIds.map(id => prisma.user.findUnique({ where: { id } }))
      );
      expect(
        users.every(user => user?.roleId === testData.roles.userRole.id)
      ).toBe(true);
    });

    it('should handle empty user list', async () => {
      const result = await roleService.assignUsersToRole(
        testData.roles.userRole.id,
        []
      );
      expect(result.assignedCount).toBe(0);
    });

    it('should throw error for non-existent role', async () => {
      await expect(
        roleService.assignUsersToRole('non-existent-id', [
          testData.users.adminUser.id,
        ])
      ).rejects.toThrow();
    });
  });

  describe('removeUsersFromRole', () => {
    it('should remove users from role successfully', async () => {
      const userIds = [
        testData.users.adminUser.id,
        testData.users.regularUser.id,
      ];

      const result = await roleService.removeUsersFromRole(
        testData.roles.adminRole.id,
        userIds
      );

      expect(result).toBeDefined();
      expect(result.removedCount).toBe(2);

      // Verify removals
      const users = await Promise.all(
        userIds.map(id => prisma.user.findUnique({ where: { id } }))
      );
      expect(
        users.every(user => user?.roleId !== testData.roles.adminRole.id)
      ).toBe(true);
    });

    it('should handle empty user list', async () => {
      const result = await roleService.removeUsersFromRole(
        testData.roles.adminRole.id,
        []
      );
      expect(result.removedCount).toBe(0);
    });
  });

  describe('getRolePermissions', () => {
    it('should return role permissions', async () => {
      const permissions = await roleService.getRolePermissions(
        testData.roles.adminRole.id
      );

      expect(permissions).toBeDefined();
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for role without permissions', async () => {
      const roleWithoutPermissions = await prisma.role.create({
        data: {
          name: 'Role Without Permissions',
          description: 'Role with no permissions',
          isGlobal: false,
          tenantId: testData.tenant.id,
        },
      });

      const permissions = await roleService.getRolePermissions(
        roleWithoutPermissions.id
      );
      expect(permissions).toEqual([]);
    });
  });

  describe('getUserEffectivePermissions', () => {
    it('should return effective permissions for user', async () => {
      const permissions = await roleService.getUserEffectivePermissions(
        testData.users.adminUser.id
      );

      expect(permissions).toBeDefined();
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for user without role', async () => {
      // Create user without role
      const userWithoutRole = await prisma.user.create({
        data: {
          email: 'norole@test.com',
          firstName: 'No',
          lastName: 'Role',
          password: 'password123',
          tenantId: testData.tenant.id,
        },
      });

      const permissions = await roleService.getUserEffectivePermissions(
        userWithoutRole.id
      );
      expect(permissions).toEqual([]);
    });
  });

  describe('getRoleStats', () => {
    it('should return role statistics', async () => {
      const stats = await roleService.getRoleStats(testData.tenant.id);

      expect(stats).toBeDefined();
      expect(stats.totalRoles).toBeGreaterThan(0);
      expect(stats.globalRoles).toBeGreaterThanOrEqual(0);
      expect(stats.systemRoles).toBeGreaterThan(0);
      expect(stats.rolesWithUsers).toBeGreaterThan(0);
    });
  });

  describe('getPermissionMatrix', () => {
    it('should return permission matrix', async () => {
      const matrix = await roleService.getPermissionMatrix(testData.tenant.id);

      expect(matrix).toBeDefined();
      expect(matrix.roles).toBeInstanceOf(Array);
      expect(matrix.modules).toBeInstanceOf(Array);
      expect(matrix.permissions).toBeDefined();
    });
  });

  describe('createRoleFromTemplate', () => {
    it('should create role from template', async () => {
      const template = {
        name: 'Template Role',
        description: 'Role created from template',
        permissions: [
          {
            moduleId: testData.modules.userModule.id,
            canCreate: true,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: true,
          },
        ],
      };

      const result = await roleService.createRoleFromTemplate(
        template,
        testData.tenant.id
      );

      expect(result).toBeDefined();
      expect(result.name).toBe(template.name);
      expect(result.description).toBe(template.description);
      expect(result.permissions).toBeDefined();
      expect(result.permissions.length).toBe(1);
    });
  });

  describe('getRoleHierarchy', () => {
    it('should return role hierarchy', async () => {
      const hierarchy = await roleService.getRoleHierarchy(testData.tenant.id);

      expect(hierarchy).toBeDefined();
      expect(hierarchy).toBeInstanceOf(Array);
    });
  });

  describe('setRoleHierarchy', () => {
    it('should set role hierarchy', async () => {
      const hierarchy = {
        parentRoleId: testData.roles.adminRole.id,
        childRoleIds: [testData.roles.userRole.id],
      };

      const result = await roleService.setRoleHierarchy(hierarchy);

      expect(result).toBeDefined();
      expect(result.parentRoleId).toBe(hierarchy.parentRoleId);
      expect(result.childRoleIds).toEqual(hierarchy.childRoleIds);
    });
  });

  describe('getRoleAuditLogs', () => {
    it('should return role audit logs', async () => {
      const logs = await roleService.getRoleAuditLogs(
        testData.roles.adminRole.id,
        { page: 1, limit: 10 }
      );

      expect(logs).toBeDefined();
      expect(logs.data).toBeInstanceOf(Array);
      expect(logs.meta).toBeDefined();
    });
  });
});
