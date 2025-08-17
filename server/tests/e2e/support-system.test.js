const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const credentials = require('../credentials');

const prisma = new PrismaClient();

// Import the Express app for testing
const app = require('./test-app-ts');

// Constants for API endpoints and test data
const API_BASE_URL = '/api';
const SUPPORT_ENDPOINT = `${API_BASE_URL}/support`;

// Test data constants
const TEST_LOGIN_DATA = {
  email: credentials.users.user.email,
  password: credentials.users.user.password,
  tenantSlug: credentials.tenants.primary.domain,
};

const TEST_TICKET_DATA = {
  title: 'Test Support Ticket',
  description: 'This is a test support ticket for testing purposes',
  priority: 'medium',
  category: 'technical',
  attachments: [],
};

const TEST_FAQ_DATA = {
  question: 'How do I reset my password?',
  answer: 'You can reset your password by clicking the "Forgot Password" link on the login page.',
  category: 'account',
  isPublished: true,
  tags: ['password', 'account', 'security'],
};

describe('Support System API - Comprehensive E2E Tests', () => {
  let testUser, testTenant, testRole, adminUser;
  let authToken, adminToken;

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
    // Clean up test data before each test
    await prisma.supportTicket.deleteMany();
    await prisma.faq.deleteMany();
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

    // Create admin role
    const adminRole = await prisma.role.create({
      data: {
        name: 'Support Admin',
        description: 'Support administrator role',
        tenantId: testTenant.id,
        permissions: ['support:read', 'support:write', 'support:delete', 'support:admin'],
      },
    });

    // Create regular role
    testRole = await prisma.role.create({
      data: {
        name: 'User',
        description: 'Regular user role',
        tenantId: testTenant.id,
        permissions: ['support:read', 'support:write'],
      },
    });

    // Create admin user
    const adminPassword = await bcrypt.hash('AdminPassword123!', 10);
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: adminPassword,
        name: 'Admin User',
        tenantId: testTenant.id,
        isActive: true,
      },
    });

    // Create regular user
    const userPassword = await bcrypt.hash('UserPassword123!', 10);
    testUser = await prisma.user.create({
      data: {
        email: 'user@test.com',
        password: userPassword,
        name: 'Test User',
        tenantId: testTenant.id,
        isActive: true,
      },
    });

    // Assign roles
    await prisma.userRole.createMany({
      data: [
        { userId: adminUser.id, roleId: adminRole.id },
        { userId: testUser.id, roleId: testRole.id },
      ],
    });

    // Login as admin
    const adminLoginResponse = await request(app)
      .post(`${API_BASE_URL}/auth/login`)
      .send({
        email: 'admin@test.com',
        password: 'AdminPassword123!',
        tenantSlug: 'test.com',
      });

    adminToken = adminLoginResponse.body.data.accessToken;

    // Login as regular user
    const userLoginResponse = await request(app)
      .post(`${API_BASE_URL}/auth/login`)
      .send({
        email: 'user@test.com',
        password: 'UserPassword123!',
        tenantSlug: 'test.com',
      });

    authToken = userLoginResponse.body.data.accessToken;
  });

  describe('POST /support/tickets', () => {
    it('should create a new support ticket successfully', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_TICKET_DATA);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(TEST_TICKET_DATA.title);
      expect(response.body.data.description).toBe(TEST_TICKET_DATA.description);
      expect(response.body.data.priority).toBe(TEST_TICKET_DATA.priority);
      expect(response.body.data.status).toBe('open');
      expect(response.body.data.userId).toBe(testUser.id);
    });

    it('should return 400 for invalid priority', async () => {
      const invalidData = {
        ...TEST_TICKET_DATA,
        priority: 'invalid-priority',
      };

      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      validateErrorResponse(response, 400);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        description: 'Missing title',
        priority: 'medium',
      };

      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData);

      validateErrorResponse(response, 400);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets`)
        .send(TEST_TICKET_DATA);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /support/tickets', () => {
    beforeEach(async () => {
      // Create test tickets
      await prisma.supportTicket.createMany({
        data: [
          {
            ...TEST_TICKET_DATA,
            userId: testUser.id,
            tenantId: testTenant.id,
            status: 'open',
          },
          {
            ...TEST_TICKET_DATA,
            title: 'Test Ticket 2',
            userId: testUser.id,
            tenantId: testTenant.id,
            status: 'in_progress',
          },
          {
            ...TEST_TICKET_DATA,
            title: 'Test Ticket 3',
            userId: testUser.id,
            tenantId: testTenant.id,
            status: 'closed',
          },
        ],
      });
    });

    it('should get all tickets for the authenticated user', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('title');
      expect(response.body.data[0]).toHaveProperty('status');
    });

    it('should get all tickets for admin users', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets?page=1&limit=2`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets?status=open`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(ticket => ticket.status === 'open')).toBe(true);
    });

    it('should filter by priority', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets?priority=medium`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(ticket => ticket.priority === 'medium')).toBe(true);
    });

    it('should support search by title', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets?search=Test Ticket`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(ticket => 
        ticket.title.toLowerCase().includes('test ticket')
      )).toBe(true);
    });

    it('should return 401 for unauthorized access', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets`);

      validateErrorResponse(response, 401, 'Unauthorized');
    });
  });

  describe('GET /support/tickets/:id', () => {
    let testTicket;

    beforeEach(async () => {
      testTicket = await prisma.supportTicket.create({
        data: {
          ...TEST_TICKET_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      });
    });

    it('should get ticket by ID successfully', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(testTicket.id);
      expect(response.body.data.title).toBe(TEST_TICKET_DATA.title);
      expect(response.body.data.description).toBe(TEST_TICKET_DATA.description);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets/999999`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 404, 'Ticket not found');
    });

    it('should return 403 for accessing other user ticket (non-admin)', async () => {
      // Create another user and ticket
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      const otherTicket = await prisma.supportTicket.create({
        data: {
          ...TEST_TICKET_DATA,
          title: 'Other User Ticket',
          userId: otherUser.id,
          tenantId: testTenant.id,
        },
      });

      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets/${otherTicket.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should allow admin to access any ticket', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.id).toBe(testTicket.id);
    });
  });

  describe('PUT /support/tickets/:id', () => {
    let testTicket;

    beforeEach(async () => {
      testTicket = await prisma.supportTicket.create({
        data: {
          ...TEST_TICKET_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      });
    });

    it('should update ticket successfully (owner or admin)', async () => {
      const updateData = {
        title: 'Updated Ticket Title',
        description: 'Updated description',
        priority: 'high',
      };

      const response = await request(app)
        .put(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.priority).toBe(updateData.priority);
    });

    it('should return 403 for non-owner and non-admin', async () => {
      // Create another user
      const otherUser = await prisma.user.create({
        data: {
          email: 'otheruser@test.com',
          password: await bcrypt.hash('Password123!', 10),
          name: 'Other User',
          tenantId: testTenant.id,
          isActive: true,
        },
      });

      // Login as other user
      const otherLoginResponse = await request(app)
        .post(`${API_BASE_URL}/auth/login`)
        .send({
          email: 'otheruser@test.com',
          password: 'Password123!',
          tenantSlug: 'test.com',
        });

      const otherToken = otherLoginResponse.body.data.accessToken;

      const response = await request(app)
        .put(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Updated Title' });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app)
        .put(`${SUPPORT_ENDPOINT}/tickets/999999`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });

      validateErrorResponse(response, 404, 'Ticket not found');
    });
  });

  describe('POST /support/tickets/:id/status', () => {
    let testTicket;

    beforeEach(async () => {
      testTicket = await prisma.supportTicket.create({
        data: {
          ...TEST_TICKET_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
          status: 'open',
        },
      });
    });

    it('should update ticket status successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' });

      validateSuccessResponse(response);
      expect(response.body.data.status).toBe('in_progress');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' });

      validateErrorResponse(response, 400);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/999999/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'in_progress' });

      validateErrorResponse(response, 404, 'Ticket not found');
    });
  });

  describe('POST /support/tickets/:id/reply', () => {
    let testTicket;

    beforeEach(async () => {
      testTicket = await prisma.supportTicket.create({
        data: {
          ...TEST_TICKET_DATA,
          userId: testUser.id,
          tenantId: testTenant.id,
        },
      });
    });

    it('should add reply to ticket successfully', async () => {
      const replyData = {
        message: 'This is a test reply to the support ticket',
        isInternal: false,
      };

      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}/reply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(replyData);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('replies');
      expect(response.body.data.replies).toHaveLength(1);
      expect(response.body.data.replies[0].message).toBe(replyData.message);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/999999/reply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ message: 'Test reply' });

      validateErrorResponse(response, 404, 'Ticket not found');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/tickets/${testTicket.id}/reply`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      validateErrorResponse(response, 400);
    });
  });

  describe('POST /support/faqs', () => {
    it('should create a new FAQ successfully (admin only)', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/faqs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(TEST_FAQ_DATA);

      validateSuccessResponse(response, 201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.question).toBe(TEST_FAQ_DATA.question);
      expect(response.body.data.answer).toBe(TEST_FAQ_DATA.answer);
      expect(response.body.data.category).toBe(TEST_FAQ_DATA.category);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/faqs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(TEST_FAQ_DATA);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        answer: 'Missing question',
        category: 'account',
      };

      const response = await request(app)
        .post(`${SUPPORT_ENDPOINT}/faqs`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(invalidData);

      validateErrorResponse(response, 400);
    });
  });

  describe('GET /support/faqs', () => {
    beforeEach(async () => {
      // Create test FAQs
      await prisma.faq.createMany({
        data: [
          {
            ...TEST_FAQ_DATA,
            tenantId: testTenant.id,
          },
          {
            ...TEST_FAQ_DATA,
            question: 'How do I contact support?',
            answer: 'You can contact support through the support portal.',
            category: 'contact',
            tenantId: testTenant.id,
          },
          {
            ...TEST_FAQ_DATA,
            question: 'Draft FAQ',
            answer: 'This is a draft FAQ',
            isPublished: false,
            tenantId: testTenant.id,
          },
        ],
      });
    });

    it('should get all published FAQs', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/faqs`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every(faq => faq.isPublished === true)).toBe(true);
    });

    it('should get all FAQs for admin users', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/faqs?includeDrafts=true`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/faqs?category=account`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(faq => faq.category === 'account')).toBe(true);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/faqs?search=password`)
        .set('Authorization', `Bearer ${authToken}`);

      validateSuccessResponse(response);
      expect(response.body.data.every(faq => 
        faq.question.toLowerCase().includes('password') || 
        faq.answer.toLowerCase().includes('password')
      )).toBe(true);
    });
  });

  describe('PUT /support/faqs/:id', () => {
    let testFaq;

    beforeEach(async () => {
      testFaq = await prisma.faq.create({
        data: {
          ...TEST_FAQ_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should update FAQ successfully (admin only)', async () => {
      const updateData = {
        question: 'Updated FAQ Question',
        answer: 'Updated FAQ answer',
        isPublished: false,
      };

      const response = await request(app)
        .put(`${SUPPORT_ENDPOINT}/faqs/${testFaq.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      validateSuccessResponse(response);
      expect(response.body.data.question).toBe(updateData.question);
      expect(response.body.data.answer).toBe(updateData.answer);
      expect(response.body.data.isPublished).toBe(updateData.isPublished);
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .put(`${SUPPORT_ENDPOINT}/faqs/${testFaq.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ question: 'Updated Question' });

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent FAQ', async () => {
      const response = await request(app)
        .put(`${SUPPORT_ENDPOINT}/faqs/999999`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ question: 'Updated Question' });

      validateErrorResponse(response, 404, 'FAQ not found');
    });
  });

  describe('DELETE /support/faqs/:id', () => {
    let testFaq;

    beforeEach(async () => {
      testFaq = await prisma.faq.create({
        data: {
          ...TEST_FAQ_DATA,
          tenantId: testTenant.id,
        },
      });
    });

    it('should delete FAQ successfully (admin only)', async () => {
      const response = await request(app)
        .delete(`${SUPPORT_ENDPOINT}/faqs/${testFaq.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.message).toContain('FAQ deleted successfully');

      // Verify FAQ is deleted
      const deletedFaq = await prisma.faq.findUnique({
        where: { id: testFaq.id },
      });
      expect(deletedFaq).toBeNull();
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .delete(`${SUPPORT_ENDPOINT}/faqs/${testFaq.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });

    it('should return 404 for non-existent FAQ', async () => {
      const response = await request(app)
        .delete(`${SUPPORT_ENDPOINT}/faqs/999999`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateErrorResponse(response, 404, 'FAQ not found');
    });
  });

  describe('GET /support/analytics', () => {
    beforeEach(async () => {
      // Create test tickets with different statuses
      await prisma.supportTicket.createMany({
        data: [
          {
            ...TEST_TICKET_DATA,
            userId: testUser.id,
            tenantId: testTenant.id,
            status: 'open',
            priority: 'high',
          },
          {
            ...TEST_TICKET_DATA,
            title: 'Medium Priority Ticket',
            userId: testUser.id,
            tenantId: testTenant.id,
            status: 'in_progress',
            priority: 'medium',
          },
          {
            ...TEST_TICKET_DATA,
            title: 'Low Priority Ticket',
            userId: testUser.id,
            tenantId: testTenant.id,
            status: 'closed',
            priority: 'low',
          },
        ],
      });
    });

    it('should get support analytics successfully (admin only)', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${adminToken}`);

      validateSuccessResponse(response);
      expect(response.body.data).toHaveProperty('totalTickets');
      expect(response.body.data).toHaveProperty('openTickets');
      expect(response.body.data).toHaveProperty('closedTickets');
      expect(response.body.data).toHaveProperty('averageResolutionTime');
      expect(response.body.data).toHaveProperty('ticketsByPriority');
      expect(response.body.data).toHaveProperty('ticketsByCategory');
    });

    it('should return 403 for non-admin users', async () => {
      const response = await request(app)
        .get(`${SUPPORT_ENDPOINT}/analytics`)
        .set('Authorization', `Bearer ${authToken}`);

      validateErrorResponse(response, 403, 'Access denied');
    });
  });
});
