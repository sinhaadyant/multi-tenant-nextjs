const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');

const prisma = new PrismaClient();

// Import the Express app
let app;
try {
  app = require('../src/index');
} catch (error) {
  console.log('⚠️  App not started, creating mock app for testing');
  const express = require('express');
  app = express();
  app.use(express.json());
}

describe('Role Management API - E2E Tests', () => {
  let adminUser;
  let regularUser;
  let testTenant;
  let adminRole;
  let userRole;
  let adminToken;
  let userToken;

  beforeAll(async () => {
    // Connect to test database
    await prisma.$connect();
    console.log('✅ Connected to test database');
  });

  afterAll(async () => {
    // Cleanup and disconnect
    await prisma.$disconnect();
    console.log('✅ Disconnected from test database');
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await prisma.auditLog.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.module.deleteMany();
    await prisma.tenant.deleteMany();

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test.com',
        isActive: true,
      },
    });

    // Create modules for permissions
    const userModule = await prisma.module.create({
      data: {
        name: 'User Management',
        description: 'User management module',
        orderIndex: 1,
        isActive: true,
      },
    });

    const roleModule = await prisma.module.create({
      data: {
        name: 'Role Management',
        description: 'Role management module',
        orderIndex: 2,
        isActive: true,
      },
    });

    // Create admin role
    adminRole = await prisma.role.create({
      data: {
        name: 'Admin Role',
        description: 'Administrator role with full permissions',
        tenantId: testTenant.id,
        isGlobal: false,
      },
    });

    // Create user role
    userRole = await prisma.role.create({
      data: {
        name: 'User Role',
        description: 'Regular user role',
        tenantId: testTenant.id,
        isGlobal: false,
      },
    });

    // Create role permissions
    await prisma.rolePermission.createMany({
      data: [
        {
          roleId: adminRole.id,
          moduleId: userModule.id,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canViewAll: true,
        },
        {
          roleId: adminRole.id,
          moduleId: roleModule.id,
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          canViewAll: true,
        },
        {
          roleId: userRole.id,
          moduleId: userModule.id,
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false,
          canViewAll: false,
        },
      ],
    });

    // Create admin user
    const adminPassword = await bcrypt.hash(
      credentials.users.admin.password,
      12
    );
    adminUser = await prisma.user.create({
      data: {
        email: credentials.users.admin.email,
        passwordHash: adminPassword,
        name: credentials.users.admin.name,
        tenantId: testTenant.id,
        isActive: credentials.users.admin.isActive,
        isSuperadmin: credentials.users.admin.isSuperadmin,
      },
    });

    // Create regular user
    const userPassword = await bcrypt.hash(credentials.users.user.password, 12);
    regularUser = await prisma.user.create({
      data: {
        email: credentials.users.user.email,
        passwordHash: userPassword,
        name: credentials.users.user.name,
        tenantId: testTenant.id,
        isActive: credentials.users.user.isActive,
        isSuperadmin: credentials.users.user.isSuperadmin,
      },
    });

    // Assign roles
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        roleId: adminRole.id,
      },
    });

    await prisma.userRole.create({
      data: {
        userId: regularUser.id,
        roleId: userRole.id,
      },
    });

    // Get tokens for testing
    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'admin@test.com',
      password: 'AdminPassword123!',
    });

    const userLoginResponse = await request(app).post('/api/auth/login').send({
      email: 'user@test.com',
      password: 'UserPassword123!',
    });

    adminToken = adminLoginResponse.body.data.accessToken;
    userToken = userLoginResponse.body.data.accessToken;

    console.log('✅ Test data prepared');
  });

  describe('GET /api/roles', () => {
    test('should get all roles with admin permissions', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('roles');
      expect(Array.isArray(response.body.data.roles)).toBe(true);
      expect(response.body.data.roles.length).toBeGreaterThan(0);

      // Verify role data structure
      const role = response.body.data.roles[0];
      expect(role).toHaveProperty('id');
      expect(role).toHaveProperty('name');
      expect(role).toHaveProperty('description');
      expect(role).toHaveProperty('isGlobal');
      expect(role).toHaveProperty('tenantId');

      console.log('✅ Get all roles successful with admin permissions');
    });

    test('should get roles with pagination', async () => {
      const response = await request(app)
        .get('/api/roles?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('roles');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('totalPages');

      console.log('✅ Get roles with pagination successful');
    });

    test('should get roles with search filter', async () => {
      const response = await request(app)
        .get('/api/roles?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.roles.length).toBeGreaterThan(0);

      // Verify search results contain 'admin'
      const hasAdminRole = response.body.data.roles.some(role =>
        role.name.toLowerCase().includes('admin')
      );
      expect(hasAdminRole).toBe(true);

      console.log('✅ Get roles with search filter successful');
    });

    test('should get roles with global filter', async () => {
      const response = await request(app)
        .get('/api/roles?isGlobal=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned roles are not global
      const allNotGlobal = response.body.data.roles.every(
        role => role.isGlobal === false
      );
      expect(allNotGlobal).toBe(true);

      console.log('✅ Get roles with global filter successful');
    });

    test('should fail to get roles without authentication', async () => {
      const response = await request(app).get('/api/roles').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get roles failed without authentication');
    });

    test('should fail to get roles with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get roles failed with insufficient permissions');
    });
  });

  describe('POST /api/roles', () => {
    test('should create new role with valid data', async () => {
      const newRoleData = {
        name: 'New Role',
        description: 'A new test role',
        isGlobal: false,
        permissions: [
          {
            moduleId: (await prisma.module.findFirst()).id,
            canCreate: true,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
        ],
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRoleData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data.role.name).toBe(newRoleData.name);
      expect(response.body.data.role.description).toBe(newRoleData.description);
      expect(response.body.data.role.isGlobal).toBe(newRoleData.isGlobal);

      // Verify role was created in database
      const createdRole = await prisma.role.findUnique({
        where: { name: newRoleData.name },
        include: { rolePermissions: true },
      });
      expect(createdRole).toBeDefined();
      expect(createdRole.rolePermissions.length).toBe(1);

      console.log('✅ Create new role successful');
    });

    test('should fail to create role with duplicate name in same tenant', async () => {
      const newRoleData = {
        name: 'Admin Role', // Already exists
        description: 'Duplicate role',
        isGlobal: false,
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Role with this name already exists in this tenant'
      );

      console.log('✅ Create role failed with duplicate name');
    });

    test('should fail to create role with invalid module ID', async () => {
      const newRoleData = {
        name: 'New Role',
        description: 'A new test role',
        isGlobal: false,
        permissions: [
          {
            moduleId: 'non-existent-module-id',
            canCreate: true,
            canRead: true,
            canUpdate: false,
            canDelete: false,
            canViewAll: false,
          },
        ],
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Create role failed with invalid module ID');
    });

    test('should fail to create role without required fields', async () => {
      const newRoleData = {
        description: 'Missing name',
        isGlobal: false,
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Create role failed without required fields');
    });

    test('should fail to create role without authentication', async () => {
      const newRoleData = {
        name: 'New Role',
        description: 'A new test role',
        isGlobal: false,
      };

      const response = await request(app)
        .post('/api/roles')
        .send(newRoleData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Create role failed without authentication');
    });
  });

  describe('GET /api/roles/:id', () => {
    test('should get role by ID with admin permissions', async () => {
      const response = await request(app)
        .get(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data.role.id).toBe(userRole.id);
      expect(response.body.data.role.name).toBe(userRole.name);
      expect(response.body.data.role.description).toBe(userRole.description);

      console.log('✅ Get role by ID successful');
    });

    test('should fail to get non-existent role', async () => {
      const response = await request(app)
        .get('/api/roles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role not found');

      console.log('✅ Get non-existent role failed');
    });

    test('should fail to get role without authentication', async () => {
      const response = await request(app)
        .get(`/api/roles/${userRole.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get role failed without authentication');
    });
  });

  describe('PUT /api/roles/:id', () => {
    test('should update role with valid data', async () => {
      const updateData = {
        name: 'Updated Role Name',
        description: 'Updated role description',
        isGlobal: true,
      };

      const response = await request(app)
        .put(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data.role.name).toBe(updateData.name);
      expect(response.body.data.role.description).toBe(updateData.description);
      expect(response.body.data.role.isGlobal).toBe(updateData.isGlobal);

      // Verify role was updated in database
      const updatedRole = await prisma.role.findUnique({
        where: { id: userRole.id },
      });
      expect(updatedRole.name).toBe(updateData.name);

      console.log('✅ Update role successful');
    });

    test('should fail to update role with duplicate name', async () => {
      const updateData = {
        name: 'Admin Role', // Already exists
      };

      const response = await request(app)
        .put(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Role name already exists in this tenant'
      );

      console.log('✅ Update role failed with duplicate name');
    });

    test('should fail to update non-existent role', async () => {
      const updateData = {
        name: 'Updated Role',
        description: 'Updated description',
      };

      const response = await request(app)
        .put('/api/roles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role not found');

      console.log('✅ Update non-existent role failed');
    });

    test('should fail to update role without authentication', async () => {
      const updateData = {
        name: 'Updated Role',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/roles/${userRole.id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Update role failed without authentication');
    });
  });

  describe('DELETE /api/roles/:id', () => {
    test('should delete role with admin permissions', async () => {
      const response = await request(app)
        .delete(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Role deleted successfully');

      // Verify role was deleted from database
      const deletedRole = await prisma.role.findUnique({
        where: { id: userRole.id },
      });
      expect(deletedRole).toBeNull();

      console.log('✅ Delete role successful');
    });

    test('should fail to delete role assigned to users', async () => {
      // Create a user assigned to the role
      const testUser = await prisma.user.create({
        data: {
          email: 'testuser@test.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Test User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      await prisma.userRole.create({
        data: {
          userId: testUser.id,
          roleId: userRole.id,
        },
      });

      const response = await request(app)
        .delete(`/api/roles/${userRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Cannot delete role that is assigned to users'
      );

      console.log('✅ Delete role failed when assigned to users');
    });

    test('should fail to delete non-existent role', async () => {
      const response = await request(app)
        .delete('/api/roles/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role not found');

      console.log('✅ Delete non-existent role failed');
    });

    test('should fail to delete role without authentication', async () => {
      const response = await request(app)
        .delete(`/api/roles/${userRole.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Delete role failed without authentication');
    });
  });

  describe('POST /api/roles/:id/clone', () => {
    test('should clone role successfully', async () => {
      const cloneData = {
        name: 'Cloned Role',
        description: 'A cloned role',
      };

      const response = await request(app)
        .post(`/api/roles/${userRole.id}/clone`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cloneData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data.role.name).toBe(cloneData.name);
      expect(response.body.data.role.description).toBe(cloneData.description);

      // Verify cloned role was created in database
      const clonedRole = await prisma.role.findUnique({
        where: { name: cloneData.name },
        include: { rolePermissions: true },
      });
      expect(clonedRole).toBeDefined();
      expect(clonedRole.rolePermissions.length).toBe(
        userRole.rolePermissions.length
      );

      console.log('✅ Clone role successful');
    });

    test('should fail to clone role with duplicate name', async () => {
      const cloneData = {
        name: 'Admin Role', // Already exists
        description: 'A cloned role',
      };

      const response = await request(app)
        .post(`/api/roles/${userRole.id}/clone`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cloneData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain(
        'Role with this name already exists in this tenant'
      );

      console.log('✅ Clone role failed with duplicate name');
    });

    test('should fail to clone non-existent role', async () => {
      const cloneData = {
        name: 'Cloned Role',
        description: 'A cloned role',
      };

      const response = await request(app)
        .post('/api/roles/non-existent-id/clone')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(cloneData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Source role not found');

      console.log('✅ Clone non-existent role failed');
    });

    test('should fail to clone role without authentication', async () => {
      const cloneData = {
        name: 'Cloned Role',
        description: 'A cloned role',
      };

      const response = await request(app)
        .post(`/api/roles/${userRole.id}/clone`)
        .send(cloneData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Clone role failed without authentication');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle very long role names', async () => {
      const longName = 'a'.repeat(1000);
      const newRoleData = {
        name: longName,
        description: 'Role with long name',
        isGlobal: false,
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(newRoleData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Long role names handled correctly');
    });

    test('should handle special characters in role data', async () => {
      const specialData = {
        name: 'Special@#$%^&*()_+-=[]{}|;:,.<>?',
        description: 'Role with special characters',
        isGlobal: false,
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(specialData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.role.name).toBe(specialData.name);

      console.log('✅ Special characters in role data handled correctly');
    });

    test('should handle concurrent role creation', async () => {
      const roleData = {
        name: 'Concurrent Role',
        description: 'Concurrent role',
        isGlobal: false,
      };

      // Make concurrent requests
      const promises = Array(3)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/roles')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              ...roleData,
              name: `Concurrent Role ${index}`,
            })
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent role creation handled successfully');
    });

    test('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Empty request body handled correctly');
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"name": "Test Role", "description": "Test description"') // Missing closing brace
        .expect(400);

      expect(response.body.success).toBe(false);

      console.log('✅ Malformed JSON handled correctly');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid role creation requests', async () => {
      const startTime = Date.now();

      // Create 10 roles rapidly
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/roles')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              name: `Rapid Role ${index}`,
              description: `Rapid role ${index}`,
              isGlobal: false,
            })
        );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      console.log(
        `✅ 10 rapid role creation requests completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle large role list with pagination', async () => {
      // Create 50 roles for testing pagination
      const createPromises = Array(50)
        .fill()
        .map((_, index) =>
          prisma.role.create({
            data: {
              name: `Pagination Role ${index}`,
              description: `Pagination role ${index}`,
              tenantId: testTenant.id,
              isGlobal: false,
            },
          })
        );

      await Promise.all(createPromises);

      const startTime = Date.now();

      // Test pagination performance
      const response = await request(app)
        .get('/api/roles?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.roles.length).toBe(10);
      expect(response.body.data.meta.total).toBeGreaterThan(50);

      const totalTime = endTime - startTime;
      console.log(`✅ Large role list pagination completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle large payload gracefully', async () => {
      const largePayload = {
        name: 'Large Role',
        description: 'Role with large payload',
        isGlobal: false,
        extraData: 'x'.repeat(10000), // 10KB of extra data
      };

      const response = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(largePayload)
        .expect(201); // Should still work, ignoring extra data

      expect(response.body.success).toBe(true);

      console.log('✅ Large payload handled gracefully');
    });
  });

  // Data Scope Tests
  describe('Data Scope Tests', () => {
    test('should only return roles from same tenant', async () => {
      // Create another tenant and role
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      await prisma.role.create({
        data: {
          name: 'Other Role',
          description: 'Role from other tenant',
          tenantId: otherTenant.id,
          isGlobal: false,
        },
      });

      const response = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned roles belong to the same tenant
      const allSameTenant = response.body.data.roles.every(
        role => role.tenantId === testTenant.id
      );
      expect(allSameTenant).toBe(true);

      console.log('✅ Data scope filtering works correctly');
    });

    test('should not allow access to roles from other tenants', async () => {
      // Create another tenant and role
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      const otherRole = await prisma.role.create({
        data: {
          name: 'Other Role',
          description: 'Role from other tenant',
          tenantId: otherTenant.id,
          isGlobal: false,
        },
      });

      const response = await request(app)
        .get(`/api/roles/${otherRole.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Role not found');

      console.log('✅ Data scope prevents access to other tenant roles');
    });
  });
});
