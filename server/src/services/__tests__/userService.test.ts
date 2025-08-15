import { UserService } from '../userService';
import { testDatabase } from '../../test/helpers/database';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

describe('UserService', () => {
  let userService: UserService;
  let prisma: PrismaClient;
  let testData: any;

  beforeAll(async () => {
    prisma = testDatabase.getClient();
    userService = new UserService(prisma);

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

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        firstName: 'New',
        lastName: 'User',
        password: 'password123',
        roleId: testData.roles.userRole.id,
        tenantId: testData.tenant.id,
      };

      const result = await userService.createUser(userData);

      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.firstName).toBe(userData.firstName);
      expect(result.lastName).toBe(userData.lastName);
      expect(result.tenantId).toBe(testData.tenant.id);
      expect(result.roleId).toBe(testData.roles.userRole.id);
      expect(result.isActive).toBe(true);
      expect(result.emailVerified).toBe(false);

      // Password should be hashed
      expect(result.password).not.toBe(userData.password);
      expect(await bcrypt.compare(userData.password, result.password)).toBe(
        true
      );
    });

    it('should throw error for duplicate email in same tenant', async () => {
      const userData = {
        email: 'admin@test.com', // Already exists
        firstName: 'Duplicate',
        lastName: 'User',
        password: 'password123',
        roleId: testData.roles.userRole.id,
        tenantId: testData.tenant.id,
      };

      await expect(userService.createUser(userData)).rejects.toThrow();
    });

    it('should allow same email in different tenants', async () => {
      // Create another tenant
      const anotherTenant = await prisma.tenant.create({
        data: {
          name: 'Another Tenant',
          slug: 'another-tenant',
          isActive: true,
        },
      });

      const userData = {
        email: 'admin@test.com', // Same email as admin
        firstName: 'Another',
        lastName: 'User',
        password: 'password123',
        roleId: testData.roles.userRole.id,
        tenantId: anotherTenant.id,
      };

      const result = await userService.createUser(userData);
      expect(result).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.tenantId).toBe(anotherTenant.id);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'invalid-email',
        firstName: '',
        password: '123', // Too short
      };

      await expect(
        userService.createUser(invalidData as any)
      ).rejects.toThrow();
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phoneNumber: '+1234567890',
        isActive: false,
      };

      const result = await userService.updateUser(
        testData.users.adminUser.id,
        updateData
      );

      expect(result).toBeDefined();
      expect(result.firstName).toBe(updateData.firstName);
      expect(result.lastName).toBe(updateData.lastName);
      expect(result.phoneNumber).toBe(updateData.phoneNumber);
      expect(result.isActive).toBe(updateData.isActive);
    });

    it('should not update email if provided', async () => {
      const updateData = {
        email: 'newemail@test.com',
        firstName: 'Updated',
      };

      const result = await userService.updateUser(
        testData.users.adminUser.id,
        updateData
      );

      expect(result.email).toBe(testData.users.adminUser.email); // Should remain unchanged
      expect(result.firstName).toBe(updateData.firstName);
    });

    it('should throw error for non-existent user', async () => {
      const updateData = { firstName: 'Updated' };

      await expect(
        userService.updateUser('non-existent-id', updateData)
      ).rejects.toThrow();
    });

    it('should update password if provided', async () => {
      const newPassword = 'newpassword123';
      const updateData = { password: newPassword };

      const result = await userService.updateUser(
        testData.users.adminUser.id,
        updateData
      );

      expect(result.password).not.toBe(newPassword); // Should be hashed
      expect(await bcrypt.compare(newPassword, result.password)).toBe(true);
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      const user = await userService.getUserById(testData.users.adminUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(testData.users.adminUser.id);
      expect(user?.email).toBe(testData.users.adminUser.email);
    });

    it('should return null for non-existent user', async () => {
      const user = await userService.getUserById('non-existent-id');
      expect(user).toBeNull();
    });

    it('should include role and tenant data when requested', async () => {
      const user = await userService.getUserById(testData.users.adminUser.id, {
        includeRole: true,
        includeTenant: true,
      });

      expect(user).toBeDefined();
      expect(user?.role).toBeDefined();
      expect(user?.tenant).toBeDefined();
      expect(user?.role?.name).toBe('Administrator');
      expect(user?.tenant?.name).toBe('Test Organization');
    });
  });

  describe('getUserByEmail', () => {
    it('should return user by email', async () => {
      const user = await userService.getUserByEmail(
        testData.users.adminUser.email,
        testData.tenant.id
      );

      expect(user).toBeDefined();
      expect(user?.email).toBe(testData.users.adminUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userService.getUserByEmail(
        'nonexistent@test.com',
        testData.tenant.id
      );
      expect(user).toBeNull();
    });

    it('should return null for email in different tenant', async () => {
      const user = await userService.getUserByEmail(
        testData.users.adminUser.email,
        'different-tenant-id'
      );
      expect(user).toBeNull();
    });
  });

  describe('listUsers', () => {
    it('should return paginated users', async () => {
      const result = await userService.listUsers({
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
      const result = await userService.listUsers({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
        search: 'admin',
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].firstName.toLowerCase()).toContain('admin');
    });

    it('should filter by role', async () => {
      const result = await userService.listUsers({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
        roleId: testData.roles.adminRole.id,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data[0].roleId).toBe(testData.roles.adminRole.id);
    });

    it('should filter by active status', async () => {
      const result = await userService.listUsers({
        page: 1,
        limit: 10,
        tenantId: testData.tenant.id,
        isActive: true,
      });

      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.every(user => user.isActive)).toBe(true);
    });
  });

  describe('deleteUser', () => {
    it('should soft delete user', async () => {
      const result = await userService.deleteUser(
        testData.users.regularUser.id
      );

      expect(result).toBeDefined();
      expect(result.deletedAt).toBeDefined();
      expect(result.deletedAt).not.toBeNull();
    });

    it('should throw error for non-existent user', async () => {
      await expect(userService.deleteUser('non-existent-id')).rejects.toThrow();
    });

    it('should not allow deleting admin users', async () => {
      await expect(
        userService.deleteUser(testData.users.adminUser.id)
      ).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const newPassword = 'newpassword123';
      const currentPassword = 'password123';

      const result = await userService.changePassword(
        testData.users.adminUser.id,
        currentPassword,
        newPassword
      );

      expect(result).toBe(true);

      // Verify new password works
      const user = await userService.getUserById(testData.users.adminUser.id);
      expect(await bcrypt.compare(newPassword, user!.password)).toBe(true);
    });

    it('should throw error for incorrect current password', async () => {
      const newPassword = 'newpassword123';
      const wrongCurrentPassword = 'wrongpassword';

      await expect(
        userService.changePassword(
          testData.users.adminUser.id,
          wrongCurrentPassword,
          newPassword
        )
      ).rejects.toThrow();
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userService.changePassword('non-existent-id', 'current', 'new')
      ).rejects.toThrow();
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const result = await userService.verifyPassword(
        testData.users.adminUser.id,
        'password123'
      );

      expect(result).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const result = await userService.verifyPassword(
        testData.users.adminUser.id,
        'wrongpassword'
      );

      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('should return user permissions', async () => {
      const permissions = await userService.getUserPermissions(
        testData.users.adminUser.id
      );

      expect(permissions).toBeDefined();
      expect(permissions).toBeInstanceOf(Array);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it('should return empty array for user without permissions', async () => {
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

      const permissions = await userService.getUserPermissions(
        userWithoutRole.id
      );
      expect(permissions).toEqual([]);
    });
  });

  describe('getUserStats', () => {
    it('should return user statistics', async () => {
      const stats = await userService.getUserStats(testData.tenant.id);

      expect(stats).toBeDefined();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.activeUsers).toBeGreaterThan(0);
      expect(stats.inactiveUsers).toBeGreaterThanOrEqual(0);
      expect(stats.verifiedUsers).toBeGreaterThan(0);
      expect(stats.unverifiedUsers).toBeGreaterThanOrEqual(0);
    });
  });

  describe('bulkUpdateUsers', () => {
    it('should update multiple users', async () => {
      const userIds = [
        testData.users.adminUser.id,
        testData.users.regularUser.id,
      ];
      const updateData = { isActive: false };

      const result = await userService.bulkUpdateUsers(userIds, updateData);

      expect(result).toBeDefined();
      expect(result.updatedCount).toBe(2);

      // Verify updates
      const users = await Promise.all(
        userIds.map(id => userService.getUserById(id))
      );
      expect(users.every(user => user?.isActive === false)).toBe(true);
    });

    it('should handle empty user list', async () => {
      const result = await userService.bulkUpdateUsers([], { isActive: false });
      expect(result.updatedCount).toBe(0);
    });
  });

  describe('getUserActivity', () => {
    it('should return user activity logs', async () => {
      const activity = await userService.getUserActivity(
        testData.users.adminUser.id,
        { page: 1, limit: 10 }
      );

      expect(activity).toBeDefined();
      expect(activity.data).toBeInstanceOf(Array);
      expect(activity.meta).toBeDefined();
    });
  });
});
