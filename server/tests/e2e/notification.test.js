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

describe('Notification API - E2E Tests', () => {
  let adminUser;
  let regularUser;
  let testTenant;
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
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.tenant.deleteMany();

    // Create test tenant
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test.com',
        isActive: true,
      },
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

    // Get tokens for testing
    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      email: credentials.users.admin.email,
      password: credentials.users.admin.password,
    });

    const userLoginResponse = await request(app).post('/api/auth/login').send({
      email: credentials.users.user.email,
      password: credentials.users.user.password,
    });

    adminToken = adminLoginResponse.body.data.accessToken;
    userToken = userLoginResponse.body.data.accessToken;

    console.log('✅ Test data prepared');
  });

  describe('GET /api/notifications', () => {
    test('should get all notifications with admin permissions', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(Array.isArray(response.body.data.notifications)).toBe(true);

      console.log('✅ Get all notifications successful with admin permissions');
    });

    test('should get notifications with pagination', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('totalPages');

      console.log('✅ Get notifications with pagination successful');
    });

    test('should get notifications with filters', async () => {
      const response = await request(app)
        .get('/api/notifications?type=system&isRead=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');

      console.log('✅ Get notifications with filters successful');
    });

    test('should fail to get notifications without authentication', async () => {
      const response = await request(app).get('/api/notifications').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get notifications failed without authentication');
    });
  });

  describe('POST /api/notifications', () => {
    test('should create notification with admin permissions', async () => {
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        priority: 'medium',
        recipients: [adminUser.id],
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');
      expect(response.body.data.notification.title).toBe(
        notificationData.title
      );
      expect(response.body.data.notification.message).toBe(
        notificationData.message
      );

      console.log('✅ Create notification successful with admin permissions');
    });

    test('should create notification with multiple recipients', async () => {
      const notificationData = {
        title: 'Multi-recipient Notification',
        message: 'This notification is for multiple users',
        type: 'user',
        priority: 'high',
        recipients: [adminUser.id, regularUser.id],
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');

      console.log('✅ Create notification with multiple recipients successful');
    });

    test('should fail to create notification with invalid data', async () => {
      const notificationData = {
        title: '',
        message: '',
        type: 'invalid',
        priority: 'invalid',
        recipients: [],
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Create notification failed with invalid data');
    });

    test('should fail to create notification without authentication', async () => {
      const notificationData = {
        title: 'Test',
        message: 'Test message',
        type: 'system',
        recipients: [adminUser.id],
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Create notification failed without authentication');
    });
  });

  describe('GET /api/notifications/:id', () => {
    test('should get notification by ID with admin permissions', async () => {
      // First create a notification to test with
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        recipients: [adminUser.id],
      };

      const createResponse = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      const notificationId = createResponse.body.data.notification.id;

      const response = await request(app)
        .get(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notification');
      expect(response.body.data.notification.id).toBe(notificationId);

      console.log('✅ Get notification by ID successful');
    });

    test('should fail to get non-existent notification', async () => {
      const response = await request(app)
        .get('/api/notifications/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Notification not found');

      console.log('✅ Get non-existent notification failed');
    });

    test('should fail to get notification without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/test-id')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get notification failed without authentication');
    });
  });

  describe('PUT /api/notifications/:id', () => {
    test('should update notification with admin permissions', async () => {
      // First create a notification to test with
      const notificationData = {
        title: 'Original Title',
        message: 'Original message',
        type: 'system',
        recipients: [adminUser.id],
      };

      const createResponse = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      const notificationId = createResponse.body.data.notification.id;

      const updateData = {
        title: 'Updated Title',
        message: 'Updated message',
        priority: 'high',
      };

      const response = await request(app)
        .put(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.title).toBe(updateData.title);
      expect(response.body.data.notification.message).toBe(updateData.message);

      console.log('✅ Update notification successful');
    });

    test('should fail to update non-existent notification', async () => {
      const updateData = {
        title: 'Updated Title',
        message: 'Updated message',
      };

      const response = await request(app)
        .put('/api/notifications/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Notification not found');

      console.log('✅ Update non-existent notification failed');
    });

    test('should fail to update notification without authentication', async () => {
      const updateData = {
        title: 'Updated Title',
      };

      const response = await request(app)
        .put('/api/notifications/test-id')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Update notification failed without authentication');
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('should delete notification with admin permissions', async () => {
      // First create a notification to test with
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        recipients: [adminUser.id],
      };

      const createResponse = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      const notificationId = createResponse.body.data.notification.id;

      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain(
        'Notification deleted successfully'
      );

      console.log('✅ Delete notification successful');
    });

    test('should fail to delete non-existent notification', async () => {
      const response = await request(app)
        .delete('/api/notifications/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Notification not found');

      console.log('✅ Delete non-existent notification failed');
    });

    test('should fail to delete notification without authentication', async () => {
      const response = await request(app)
        .delete('/api/notifications/test-id')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Delete notification failed without authentication');
    });
  });

  describe('POST /api/notifications/:id/read', () => {
    test('should mark notification as read', async () => {
      // First create a notification to test with
      const notificationData = {
        title: 'Test Notification',
        message: 'This is a test notification',
        type: 'system',
        recipients: [adminUser.id],
      };

      const createResponse = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      const notificationId = createResponse.body.data.notification.id;

      const response = await request(app)
        .post(`/api/notifications/${notificationId}/read`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Notification marked as read');

      console.log('✅ Mark notification as read successful');
    });

    test('should fail to mark non-existent notification as read', async () => {
      const response = await request(app)
        .post('/api/notifications/non-existent-id/read')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Notification not found');

      console.log('✅ Mark non-existent notification as read failed');
    });
  });

  describe('POST /api/notifications/bulk-read', () => {
    test('should mark multiple notifications as read', async () => {
      // First create multiple notifications to test with
      const notificationData1 = {
        title: 'Test Notification 1',
        message: 'This is test notification 1',
        type: 'system',
        recipients: [adminUser.id],
      };

      const notificationData2 = {
        title: 'Test Notification 2',
        message: 'This is test notification 2',
        type: 'system',
        recipients: [adminUser.id],
      };

      const createResponse1 = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData1)
        .expect(201);

      const createResponse2 = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData2)
        .expect(201);

      const notificationIds = [
        createResponse1.body.data.notification.id,
        createResponse2.body.data.notification.id,
      ];

      const bulkData = {
        notificationIds: notificationIds,
      };

      const response = await request(app)
        .post('/api/notifications/bulk-read')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('2 notifications marked as read');

      console.log('✅ Mark multiple notifications as read successful');
    });

    test('should fail bulk read with invalid notification IDs', async () => {
      const bulkData = {
        notificationIds: ['invalid-id-1', 'invalid-id-2'],
      };

      const response = await request(app)
        .post('/api/notifications/bulk-read')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No valid notifications found');

      console.log('✅ Bulk read failed with invalid notification IDs');
    });
  });

  describe('GET /api/notifications/unread-count', () => {
    test('should get unread notification count', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('unreadCount');
      expect(typeof response.body.data.unreadCount).toBe('number');

      console.log('✅ Get unread notification count successful');
    });

    test('should fail to get unread count without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/unread-count')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get unread count failed without authentication');
    });
  });

  describe('POST /api/notifications/templates', () => {
    test('should create notification template with admin permissions', async () => {
      const templateData = {
        name: 'Test Template',
        title: 'Template Title',
        message: 'Template message with {{variable}}',
        type: 'system',
        variables: ['variable'],
      };

      const response = await request(app)
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('template');
      expect(response.body.data.template.name).toBe(templateData.name);

      console.log('✅ Create notification template successful');
    });

    test('should fail to create template with invalid data', async () => {
      const templateData = {
        name: '',
        title: '',
        message: '',
        type: 'invalid',
      };

      const response = await request(app)
        .post('/api/notifications/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(templateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation failed');

      console.log('✅ Create template failed with invalid data');
    });
  });

  describe('GET /api/notifications/templates', () => {
    test('should get notification templates with admin permissions', async () => {
      const response = await request(app)
        .get('/api/notifications/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('templates');
      expect(Array.isArray(response.body.data.templates)).toBe(true);

      console.log('✅ Get notification templates successful');
    });

    test('should fail to get templates without authentication', async () => {
      const response = await request(app)
        .get('/api/notifications/templates')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get templates failed without authentication');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle very long notification title', async () => {
      const longTitle = 'a'.repeat(1000);
      const notificationData = {
        title: longTitle,
        message: 'Test message',
        type: 'system',
        recipients: [adminUser.id],
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Title too long');

      console.log('✅ Very long notification title handled correctly');
    });

    test('should handle special characters in notification message', async () => {
      const specialMessage =
        'Test message with special chars: @#$%^&*()_+-=[]{}|;:,.<>?';
      const notificationData = {
        title: 'Special Characters Test',
        message: specialMessage,
        type: 'system',
        recipients: [adminUser.id],
      };

      const response = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.notification.message).toBe(specialMessage);

      console.log(
        '✅ Special characters in notification message handled correctly'
      );
    });

    test('should handle concurrent notification creation', async () => {
      const notificationData = {
        title: 'Concurrent Test',
        message: 'Test message',
        type: 'system',
        recipients: [adminUser.id],
      };

      const promises = Array(3)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/notifications')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              ...notificationData,
              title: `${notificationData.title} ${index}`,
            })
        );

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
      });

      console.log('✅ Concurrent notification creation handled successfully');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle rapid notification creation', async () => {
      const startTime = Date.now();

      // Create 10 notifications rapidly
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .post('/api/notifications')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              title: `Rapid Notification ${index}`,
              message: `Test message ${index}`,
              type: 'system',
              recipients: [adminUser.id],
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
        `✅ 10 rapid notification creation completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
    });

    test('should handle large notification list with pagination', async () => {
      const startTime = Date.now();

      // Test pagination performance
      const response = await request(app)
        .get('/api/notifications?page=1&limit=50')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.notifications.length).toBeLessThanOrEqual(50);

      const totalTime = endTime - startTime;
      console.log(
        `✅ Large notification list with pagination completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  // Data Scope Tests
  describe('Data Scope Tests', () => {
    test('should only return notifications from same tenant', async () => {
      // Create another tenant and user
      const otherTenant = await prisma.tenant.create({
        data: {
          name: 'Other Tenant',
          domain: 'other.com',
          isActive: true,
        },
      });

      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other.com',
          passwordHash: await bcrypt.hash('Password123!', 12),
          name: 'Other User',
          tenantId: otherTenant.id,
          isActive: true,
        },
      });

      // Create notification for other tenant user
      const otherNotificationData = {
        title: 'Other Tenant Notification',
        message: 'This notification is for other tenant',
        type: 'system',
        recipients: [otherUser.id],
      };

      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(otherNotificationData)
        .expect(201);

      // Get notifications for admin user
      const response = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned notifications belong to the same tenant
      const allSameTenant = response.body.data.notifications.every(
        notification => {
          // This assumes notifications have tenant information or user tenant info
          return (
            notification.recipients.includes(adminUser.id) ||
            notification.recipients.includes(regularUser.id)
          );
        }
      );
      expect(allSameTenant).toBe(true);

      console.log('✅ Data scope filtering works correctly');
    });
  });
});
