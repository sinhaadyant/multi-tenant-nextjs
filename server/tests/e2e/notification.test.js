const request = require('supertest');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');

const prisma = new PrismaClient();

// Import the Express app for testing
const app = require('./test-app-ts');

// Constants for API endpoints and test data
const API_BASE_URL = '/api';
const NOTIFICATIONS_ENDPOINT = `${API_BASE_URL}/notifications`;

// Test data constants
const TEST_NOTIFICATION_DATA = {
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: 'info',
  priority: 'medium',
  channels: ['in_app'],
  recipients: [],
  metadata: { testKey: 'testValue' },
};

const TEST_BULK_NOTIFICATION_DATA = {
  notifications: [
    {
      title: 'Bulk Notification 1',
      message: 'First bulk notification message',
      type: 'success',
      priority: 'high',
      channels: ['in_app', 'email'],
    },
    {
      title: 'Bulk Notification 2',
      message: 'Second bulk notification message',
      type: 'warning',
      priority: 'medium',
      channels: ['in_app'],
    },
  ],
  targetAudience: 'tenant',
};

const TEST_TEMPLATE_DATA = {
  name: 'Test Template',
  subject: 'Test Subject',
  body: 'Test template body with {{variable}}',
  variables: ['variable'],
  isGlobal: false,
};

const TEST_PREFERENCES_DATA = {
  emailNotifications: true,
  smsNotifications: false,
  inAppNotifications: true,
  notificationTypes: {
    info: true,
    success: true,
    warning: false,
    error: true,
  },
  quietHours: {
    enabled: true,
    startTime: '22:00',
    endTime: '08:00',
  },
};

describe('Notification API - Comprehensive E2E Tests', () => {
  let adminUser, regularUser, superadminUser;
  let testTenant, otherTenant;
  let adminToken, userToken, superadminToken;
  let testNotificationId;

  // Helper function to get auth token
  const getAuthToken = async (email, password) => {
    const response = await request(app)
      .post(`${API_BASE_URL}/auth/login`)
      .send({ email, password });
    return response.body.data.accessToken;
  };

  // Helper function to create test notification
  const createTestNotification = async (token, data = {}) => {
    const notificationData = { ...TEST_NOTIFICATION_DATA, ...data };
    const response = await request(app)
      .post(NOTIFICATIONS_ENDPOINT)
      .set('Authorization', `Bearer ${token}`)
      .send(notificationData);
    return response.body.data;
  };

  // Helper function to validate error response
  const validateErrorResponse = (response, expectedStatus, expectedMessage) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    if (expectedMessage) {
      expect(response.body.message).toContain(expectedMessage);
    }
  };

  // Helper function to validate success response
  const validateSuccessResponse = (response, expectedStatus = 200) => {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBeDefined();
  };

  beforeAll(async () => {
    await prisma.$connect();
    console.log('✅ Connected to test database');
  });

  afterAll(async () => {
    await prisma.$disconnect();
    console.log('✅ Disconnected from test database');
  });

  beforeEach(async () => {
    // Clean up test data
    await prisma.auditLog.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.tenant.deleteMany();

    // Create test tenants
    testTenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
        domain: 'test.com',
        isActive: true,
      },
    });

    otherTenant = await prisma.tenant.create({
      data: {
        name: 'Other Tenant',
        domain: 'other.com',
        isActive: true,
      },
    });

    // Create test users
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

    const superadminPassword = await bcrypt.hash(
      credentials.users.superadmin.password,
      12
    );
    superadminUser = await prisma.user.create({
      data: {
        email: credentials.users.superadmin.email,
        passwordHash: superadminPassword,
        name: credentials.users.superadmin.name,
        tenantId: testTenant.id,
        isActive: credentials.users.superadmin.isActive,
        isSuperadmin: credentials.users.superadmin.isSuperadmin,
      },
    });

    // Get authentication tokens
    adminToken = await getAuthToken(
      credentials.users.admin.email,
      credentials.users.admin.password
    );
    userToken = await getAuthToken(
      credentials.users.user.email,
      credentials.users.user.password
    );
    superadminToken = await getAuthToken(
      credentials.users.superadmin.email,
      credentials.users.superadmin.password
    );

    console.log('✅ Test data prepared');
  });

  describe('GET /notifications - Get User Notifications', () => {
    describe('Success Cases', () => {
      test('should get user notifications successfully', async () => {
        const response = await request(app)
          .get(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('notifications');
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('page');
        expect(response.body.data).toHaveProperty('limit');
        expect(response.body.data).toHaveProperty('totalPages');
        expect(Array.isArray(response.body.data.notifications)).toBe(true);
      });

      test('should get notifications with pagination', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?page=1&limit=5`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(5);
        expect(response.body.data.notifications.length).toBeLessThanOrEqual(5);
      });

      test('should get notifications with read filter', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?read=false`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.notifications).toBeDefined();
      });

      test('should get notifications with type filter', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?type=info`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.notifications).toBeDefined();
      });

      test('should get notifications with priority filter', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?priority=medium`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.notifications).toBeDefined();
      });

      test('should get notifications with multiple filters', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?read=false&type=info&priority=medium`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.notifications).toBeDefined();
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication token', async () => {
        const response = await request(app)
          .get(NOTIFICATIONS_ENDPOINT)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with invalid authentication token', async () => {
        const response = await request(app)
          .get(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with malformed authorization header', async () => {
        const response = await request(app)
          .get(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', 'InvalidHeader')
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should handle invalid pagination parameters', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?page=invalid&limit=invalid`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200); // Should still work with default values

        validateSuccessResponse(response);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(20);
      });

      test('should handle negative pagination values', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?page=-1&limit=-5`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(20);
      });
    });

    describe('Edge Cases', () => {
      test('should handle very large limit values', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?limit=1000`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.limit).toBeLessThanOrEqual(1000);
      });

      test('should handle very large page numbers', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?page=999999`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.notifications).toEqual([]);
      });

      test('should handle special characters in query parameters', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}?type=info&priority=medium&read=false`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
      });
    });
  });

  describe('POST /notifications - Create Notification', () => {
    describe('Success Cases', () => {
      test('should create notification with valid data', async () => {
        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TEST_NOTIFICATION_DATA)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('notificationCount');
        expect(response.body.data).toHaveProperty('recipients');
        expect(response.body.data.notificationCount).toBeGreaterThan(0);
      });

      test('should create notification with specific recipients', async () => {
        const notificationData = {
          ...TEST_NOTIFICATION_DATA,
          recipients: [adminUser.id, regularUser.id],
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(notificationData)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.recipients).toBe(2);
      });

      test('should create notification with different types', async () => {
        const types = ['info', 'success', 'warning', 'error'];

        for (const type of types) {
          const notificationData = { ...TEST_NOTIFICATION_DATA, type };
          const response = await request(app)
            .post(NOTIFICATIONS_ENDPOINT)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(notificationData)
            .expect(200);

          validateSuccessResponse(response);
        }
      });

      test('should create notification with different priorities', async () => {
        const priorities = ['low', 'medium', 'high', 'urgent'];

        for (const priority of priorities) {
          const notificationData = { ...TEST_NOTIFICATION_DATA, priority };
          const response = await request(app)
            .post(NOTIFICATIONS_ENDPOINT)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(notificationData)
            .expect(200);

          validateSuccessResponse(response);
        }
      });

      test('should create notification with different channels', async () => {
        const channels = ['in_app', 'email', 'sms'];

        for (const channel of channels) {
          const notificationData = {
            ...TEST_NOTIFICATION_DATA,
            channels: [channel],
          };
          const response = await request(app)
            .post(NOTIFICATIONS_ENDPOINT)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(notificationData)
            .expect(200);

          validateSuccessResponse(response);
        }
      });

      test('should create notification with metadata', async () => {
        const notificationData = {
          ...TEST_NOTIFICATION_DATA,
          metadata: {
            key1: 'value1',
            key2: 123,
            key3: true,
            key4: { nested: 'object' },
          },
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(notificationData)
          .expect(200);

        validateSuccessResponse(response);
      });

      test('should create notification with minimal required fields', async () => {
        const minimalData = {
          title: 'Minimal Notification',
          message: 'Minimal message',
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(minimalData)
          .expect(200);

        validateSuccessResponse(response);
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .send(TEST_NOTIFICATION_DATA)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with missing title', async () => {
        const invalidData = { ...TEST_NOTIFICATION_DATA };
        delete invalidData.title;

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with missing message', async () => {
        const invalidData = { ...TEST_NOTIFICATION_DATA };
        delete invalidData.message;

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with empty title', async () => {
        const invalidData = { ...TEST_NOTIFICATION_DATA, title: '' };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with empty message', async () => {
        const invalidData = { ...TEST_NOTIFICATION_DATA, message: '' };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with invalid notification type', async () => {
        const invalidData = { ...TEST_NOTIFICATION_DATA, type: 'invalid_type' };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with invalid priority', async () => {
        const invalidData = {
          ...TEST_NOTIFICATION_DATA,
          priority: 'invalid_priority',
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with invalid channels', async () => {
        const invalidData = {
          ...TEST_NOTIFICATION_DATA,
          channels: ['invalid_channel'],
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with invalid recipients', async () => {
        const invalidData = {
          ...TEST_NOTIFICATION_DATA,
          recipients: ['invalid-user-id'],
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });

    describe('Edge Cases', () => {
      test('should handle very long title', async () => {
        const longTitle = 'a'.repeat(201); // Exceeds 200 character limit
        const invalidData = { ...TEST_NOTIFICATION_DATA, title: longTitle };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should handle very long message', async () => {
        const longMessage = 'a'.repeat(1001); // Exceeds 1000 character limit
        const invalidData = { ...TEST_NOTIFICATION_DATA, message: longMessage };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should handle special characters in title and message', async () => {
        const specialData = {
          ...TEST_NOTIFICATION_DATA,
          title: 'Special chars: @#$%^&*()_+-=[]{}|;:,.<>?',
          message: 'Message with special chars: @#$%^&*()_+-=[]{}|;:,.<>?',
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(specialData)
          .expect(200);

        validateSuccessResponse(response);
      });

      test('should handle unicode characters', async () => {
        const unicodeData = {
          ...TEST_NOTIFICATION_DATA,
          title: 'Unicode: 你好世界 🌍',
          message: 'Unicode message: こんにちは世界 🌟',
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(unicodeData)
          .expect(200);

        validateSuccessResponse(response);
      });

      test('should handle null values in optional fields', async () => {
        const nullData = {
          ...TEST_NOTIFICATION_DATA,
          metadata: null,
          recipients: null,
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(nullData)
          .expect(200);

        validateSuccessResponse(response);
      });

      test('should handle empty arrays in optional fields', async () => {
        const emptyArrayData = {
          ...TEST_NOTIFICATION_DATA,
          recipients: [],
          channels: [],
        };

        const response = await request(app)
          .post(NOTIFICATIONS_ENDPOINT)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(emptyArrayData)
          .expect(200);

        validateSuccessResponse(response);
      });
    });
  });

  describe('PUT /notifications/:id/read - Mark Notification as Read', () => {
    beforeEach(async () => {
      // Create a test notification to mark as read
      const result = await createTestNotification(adminToken);
      testNotificationId = result.notificationId || 'test-notification-id';
    });

    describe('Success Cases', () => {
      test('should mark notification as read successfully', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/${testNotificationId}/read`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.message).toContain('Notification marked as read');
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/${testNotificationId}/read`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with non-existent notification ID', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/non-existent-id/read`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with invalid notification ID format', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/invalid-format/read`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('PUT /notifications/read-all - Mark All Notifications as Read', () => {
    describe('Success Cases', () => {
      test('should mark all notifications as read successfully', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/read-all`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.message).toContain(
          'All notifications marked as read'
        );
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/read-all`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('GET /notifications/preferences - Get Notification Preferences', () => {
    describe('Success Cases', () => {
      test('should get notification preferences successfully', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/preferences`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('emailNotifications');
        expect(response.body.data).toHaveProperty('smsNotifications');
        expect(response.body.data).toHaveProperty('inAppNotifications');
        expect(response.body.data).toHaveProperty('notificationTypes');
        expect(response.body.data).toHaveProperty('quietHours');
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/preferences`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('PUT /notifications/preferences - Update Notification Preferences', () => {
    describe('Success Cases', () => {
      test('should update notification preferences successfully', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/preferences`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TEST_PREFERENCES_DATA)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('emailNotifications');
        expect(response.body.data.emailNotifications).toBe(
          TEST_PREFERENCES_DATA.emailNotifications
        );
      });

      test('should update partial preferences', async () => {
        const partialData = {
          emailNotifications: false,
          inAppNotifications: true,
        };

        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/preferences`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(partialData)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data.emailNotifications).toBe(false);
        expect(response.body.data.inAppNotifications).toBe(true);
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .put(`${NOTIFICATIONS_ENDPOINT}/preferences`)
          .send(TEST_PREFERENCES_DATA)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('POST /notifications/bulk - Send Bulk Notifications', () => {
    describe('Success Cases', () => {
      test('should send bulk notifications successfully', async () => {
        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/bulk`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TEST_BULK_NOTIFICATION_DATA)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('notificationCount');
        expect(response.body.data).toHaveProperty('recipients');
        expect(response.body.data).toHaveProperty('batches');
      });

      test('should send bulk notifications to tenant users', async () => {
        const tenantData = {
          ...TEST_BULK_NOTIFICATION_DATA,
          targetAudience: 'tenant',
        };

        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/bulk`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(tenantData)
          .expect(200);

        validateSuccessResponse(response);
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/bulk`)
          .send(TEST_BULK_NOTIFICATION_DATA)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail with missing notifications array', async () => {
        const invalidData = { targetAudience: 'tenant' };

        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/bulk`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(invalidData)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('GET /notifications/templates - Get Notification Templates', () => {
    describe('Success Cases', () => {
      test('should get notification templates (superadmin only)', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/templates`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toBeDefined();
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/templates`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail when non-superadmin tries to access templates', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/templates`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('POST /notifications/templates - Create Notification Template', () => {
    describe('Success Cases', () => {
      test('should create notification template successfully (superadmin only)', async () => {
        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/templates`)
          .set('Authorization', `Bearer ${superadminToken}`)
          .send(TEST_TEMPLATE_DATA)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('name');
        expect(response.body.data.name).toBe(TEST_TEMPLATE_DATA.name);
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/templates`)
          .send(TEST_TEMPLATE_DATA)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });

      test('should fail when non-superadmin tries to create template', async () => {
        const response = await request(app)
          .post(`${NOTIFICATIONS_ENDPOINT}/templates`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(TEST_TEMPLATE_DATA)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('GET /notifications/analytics - Get Notification Analytics', () => {
    describe('Success Cases', () => {
      test('should get notification analytics successfully', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/analytics`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        validateSuccessResponse(response);
        expect(response.body.data).toHaveProperty('total');
        expect(response.body.data).toHaveProperty('read');
        expect(response.body.data).toHaveProperty('unread');
        expect(response.body.data).toHaveProperty('readRate');
        expect(response.body.data).toHaveProperty('typeDistribution');
      });
    });

    describe('Failure Cases', () => {
      test('should fail without authentication', async () => {
        const response = await request(app)
          .get(`${NOTIFICATIONS_ENDPOINT}/analytics`)
          .expect(401);

        validateErrorResponse(response, 401, 'User not authenticated');
      });
    });
  });

  describe('Performance and Load Tests', () => {
    test('should handle rapid notification creation', async () => {
      const startTime = Date.now();
      const promises = Array(10)
        .fill()
        .map((_, index) =>
          request(app)
            .post(NOTIFICATIONS_ENDPOINT)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              ...TEST_NOTIFICATION_DATA,
              title: `Rapid Notification ${index}`,
              message: `Test message ${index}`,
            })
        );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
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

      const response = await request(app)
        .get(`${NOTIFICATIONS_ENDPOINT}?page=1&limit=50`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      validateSuccessResponse(response);
      expect(response.body.data.notifications.length).toBeLessThanOrEqual(50);

      const totalTime = endTime - startTime;
      console.log(
        `✅ Large notification list with pagination completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Data Scope and Security Tests', () => {
    test('should only return notifications from same tenant', async () => {
      // Create user in different tenant
      const otherUserPassword = await bcrypt.hash('Password123!', 12);
      const otherUser = await prisma.user.create({
        data: {
          email: 'other@other.com',
          passwordHash: otherUserPassword,
          name: 'Other User',
          tenantId: otherTenant.id,
          isActive: true,
        },
      });

      // Get notifications for admin user
      const response = await request(app)
        .get(NOTIFICATIONS_ENDPOINT)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      validateSuccessResponse(response);
      expect(response.body.data.notifications).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post(NOTIFICATIONS_ENDPOINT)
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should handle concurrent requests gracefully', async () => {
      const promises = Array(5)
        .fill()
        .map((_, index) =>
          request(app)
            .get(NOTIFICATIONS_ENDPOINT)
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });
  });
});
