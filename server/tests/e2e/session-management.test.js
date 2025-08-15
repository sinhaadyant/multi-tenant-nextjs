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

describe('Session Management API - E2E Tests', () => {
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

  describe('GET /api/sessions', () => {
    test('should get all sessions with admin permissions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(Array.isArray(response.body.data.sessions)).toBe(true);

      console.log('✅ Get all sessions successful with admin permissions');
    });

    test('should get sessions with pagination', async () => {
      const response = await request(app)
        .get('/api/sessions?page=1&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(response.body.data).toHaveProperty('meta');
      expect(response.body.data.meta).toHaveProperty('page');
      expect(response.body.data.meta).toHaveProperty('limit');
      expect(response.body.data.meta).toHaveProperty('total');
      expect(response.body.data.meta).toHaveProperty('totalPages');

      console.log('✅ Get sessions with pagination successful');
    });

    test('should get sessions with user filter', async () => {
      const response = await request(app)
        .get(`/api/sessions?userId=${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions.length).toBeGreaterThan(0);

      // Verify all sessions belong to the specified user
      const allBelongToUser = response.body.data.sessions.every(
        session => session.userId === adminUser.id
      );
      expect(allBelongToUser).toBe(true);

      console.log('✅ Get sessions with user filter successful');
    });

    test('should get sessions with status filter', async () => {
      const response = await request(app)
        .get('/api/sessions?isActive=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned sessions are active
      const allActive = response.body.data.sessions.every(
        session => session.isActive === true
      );
      expect(allActive).toBe(true);

      console.log('✅ Get sessions with status filter successful');
    });

    test('should fail to get sessions without authentication', async () => {
      const response = await request(app).get('/api/sessions').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get sessions failed without authentication');
    });

    test('should fail to get sessions with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get sessions failed with insufficient permissions');
    });
  });

  describe('GET /api/sessions/:id', () => {
    test('should get session by ID with admin permissions', async () => {
      // First get a session to test with
      const sessionsResponse = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (sessionsResponse.body.data.sessions.length > 0) {
        const sessionId = sessionsResponse.body.data.sessions[0].id;

        const response = await request(app)
          .get(`/api/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('session');
        expect(response.body.data.session.id).toBe(sessionId);

        console.log('✅ Get session by ID successful');
      } else {
        console.log('⚠️  No sessions available for testing');
      }
    });

    test('should fail to get non-existent session', async () => {
      const response = await request(app)
        .get('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');

      console.log('✅ Get non-existent session failed');
    });

    test('should fail to get session without authentication', async () => {
      const response = await request(app)
        .get('/api/sessions/test-id')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get session failed without authentication');
    });
  });

  describe('DELETE /api/sessions/:id', () => {
    test('should terminate session with admin permissions', async () => {
      // First get a session to test with
      const sessionsResponse = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (sessionsResponse.body.data.sessions.length > 0) {
        const sessionId = sessionsResponse.body.data.sessions[0].id;

        const response = await request(app)
          .delete(`/api/sessions/${sessionId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain(
          'Session terminated successfully'
        );

        console.log('✅ Terminate session successful');
      } else {
        console.log('⚠️  No sessions available for testing');
      }
    });

    test('should fail to terminate non-existent session', async () => {
      const response = await request(app)
        .delete('/api/sessions/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Session not found');

      console.log('✅ Terminate non-existent session failed');
    });

    test('should fail to terminate session without authentication', async () => {
      const response = await request(app)
        .delete('/api/sessions/test-id')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Terminate session failed without authentication');
    });
  });

  describe('POST /api/sessions/bulk-terminate', () => {
    test('should terminate multiple sessions', async () => {
      // First get sessions to test with
      const sessionsResponse = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (sessionsResponse.body.data.sessions.length >= 2) {
        const sessionIds = sessionsResponse.body.data.sessions
          .slice(0, 2)
          .map(session => session.id);

        const bulkData = {
          sessionIds: sessionIds,
          reason: 'Bulk termination test',
        };

        const response = await request(app)
          .post('/api/sessions/bulk-terminate')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(bulkData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain(
          '2 sessions terminated successfully'
        );

        console.log('✅ Bulk terminate sessions successful');
      } else {
        console.log('⚠️  Not enough sessions available for bulk testing');
      }
    });

    test('should fail bulk termination with invalid session IDs', async () => {
      const bulkData = {
        sessionIds: ['invalid-id-1', 'invalid-id-2'],
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/sessions/bulk-terminate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(bulkData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('No valid sessions found');

      console.log('✅ Bulk termination failed with invalid session IDs');
    });

    test('should fail bulk termination without authentication', async () => {
      const bulkData = {
        sessionIds: ['test-id-1', 'test-id-2'],
        reason: 'Test',
      };

      const response = await request(app)
        .post('/api/sessions/bulk-terminate')
        .send(bulkData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Bulk termination failed without authentication');
    });
  });

  describe('GET /api/sessions/analytics', () => {
    test('should get session analytics with admin permissions', async () => {
      const response = await request(app)
        .get('/api/sessions/analytics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');
      expect(response.body.data.analytics).toHaveProperty('totalSessions');
      expect(response.body.data.analytics).toHaveProperty('activeSessions');
      expect(response.body.data.analytics).toHaveProperty('terminatedSessions');

      console.log('✅ Get session analytics successful');
    });

    test('should get session analytics with date range', async () => {
      const startDate = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get(
          `/api/sessions/analytics?startDate=${startDate}&endDate=${endDate}`
        )
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('analytics');

      console.log('✅ Get session analytics with date range successful');
    });

    test('should fail to get analytics without authentication', async () => {
      const response = await request(app)
        .get('/api/sessions/analytics')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get analytics failed without authentication');
    });

    test('should fail to get analytics with insufficient permissions', async () => {
      const response = await request(app)
        .get('/api/sessions/analytics')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Insufficient permissions');

      console.log('✅ Get analytics failed with insufficient permissions');
    });
  });

  describe('GET /api/sessions/user/:userId', () => {
    test('should get user sessions with admin permissions', async () => {
      const response = await request(app)
        .get(`/api/sessions/user/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('sessions');
      expect(Array.isArray(response.body.data.sessions)).toBe(true);

      // Verify all sessions belong to the specified user
      const allBelongToUser = response.body.data.sessions.every(
        session => session.userId === adminUser.id
      );
      expect(allBelongToUser).toBe(true);

      console.log('✅ Get user sessions successful');
    });

    test('should fail to get sessions for non-existent user', async () => {
      const response = await request(app)
        .get('/api/sessions/user/non-existent-user-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('User not found');

      console.log('✅ Get sessions for non-existent user failed');
    });

    test('should fail to get user sessions without authentication', async () => {
      const response = await request(app)
        .get(`/api/sessions/user/${adminUser.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Access token required');

      console.log('✅ Get user sessions failed without authentication');
    });
  });

  // Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    test('should handle concurrent session termination', async () => {
      // First get sessions to test with
      const sessionsResponse = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      if (sessionsResponse.body.data.sessions.length >= 3) {
        const sessionIds = sessionsResponse.body.data.sessions
          .slice(0, 3)
          .map(session => session.id);

        // Make concurrent termination requests
        const promises = sessionIds.map(sessionId =>
          request(app)
            .delete(`/api/sessions/${sessionId}`)
            .set('Authorization', `Bearer ${adminToken}`)
        );

        const responses = await Promise.all(promises);

        // All should succeed
        responses.forEach(response => {
          expect(response.status).toBe(200);
          expect(response.body.success).toBe(true);
        });

        console.log('✅ Concurrent session termination handled successfully');
      } else {
        console.log('⚠️  Not enough sessions available for concurrent testing');
      }
    });

    test('should handle empty session list', async () => {
      // This test assumes no sessions exist
      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions).toBeDefined();
      expect(Array.isArray(response.body.data.sessions)).toBe(true);

      console.log('✅ Empty session list handled correctly');
    });

    test('should handle malformed session ID', async () => {
      const response = await request(app)
        .get('/api/sessions/malformed-id-123')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid session ID');

      console.log('✅ Malformed session ID handled correctly');
    });
  });

  // Performance Tests
  describe('Performance Tests', () => {
    test('should handle large session list with pagination', async () => {
      const startTime = Date.now();

      // Test pagination performance
      const response = await request(app)
        .get('/api/sessions?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const endTime = Date.now();

      expect(response.body.success).toBe(true);
      expect(response.body.data.sessions.length).toBeLessThanOrEqual(10);

      const totalTime = endTime - startTime;
      console.log(
        `✅ Large session list pagination completed in ${totalTime}ms`
      );
      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle rapid session queries', async () => {
      const startTime = Date.now();

      // Make rapid session queries
      const promises = Array(5)
        .fill()
        .map(() =>
          request(app)
            .get('/api/sessions')
            .set('Authorization', `Bearer ${adminToken}`)
        );

      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      console.log(`✅ 5 rapid session queries completed in ${totalTime}ms`);
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  // Data Scope Tests
  describe('Data Scope Tests', () => {
    test('should only return sessions from same tenant', async () => {
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

      const response = await request(app)
        .get('/api/sessions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify all returned sessions belong to the same tenant
      const allSameTenant = response.body.data.sessions.every(session => {
        // This assumes sessions have tenant information or user tenant info
        return (
          session.userId === adminUser.id || session.userId === regularUser.id
        );
      });
      expect(allSameTenant).toBe(true);

      console.log('✅ Data scope filtering works correctly');
    });
  });
});
