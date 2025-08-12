const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let authToken = null;
let createdUserId = null;

describe('SuperAdmin Users Management Tests', () => {
  before(async () => {
    // Login to get auth token
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'test.superadmin@example.com',
      password: 'TestPassword123'
    });
    authToken = loginResponse.data.data.token;
  });

  const testUser = {
    email: 'test.user@example.com',
    name: 'Test User',
    password: 'TestPassword123',
    role: 'user',
    isActive: true
  };

  describe('GET /api/superadmin/users', () => {
    it('should fetch all users with pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('users');
      expect(response.data.data).to.have.property('pagination');
      expect(response.data.data.pagination).to.have.property('page');
      expect(response.data.data.pagination).to.have.property('limit');
      expect(response.data.data.pagination).to.have.property('totalCount');
      expect(response.data.data.pagination).to.have.property('totalPages');
    });

    it('should fetch users with search parameter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users?search=test`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.users).to.be.an('array');
    });

    it('should fetch users with role filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users?role=user`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.users).to.be.an('array');
    });

    it('should fetch users with status filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users?status=active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.users).to.be.an('array');
    });

    it('should fetch users with custom pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.pagination.limit).to.equal(5);
    });

    it('should fetch users with sorting', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users?sortBy=name&sortOrder=asc`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.users).to.be.an('array');
    });

    it('should reject request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/users`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/users', () => {
    it('should create a new user', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/users`, testUser, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.user).to.have.property('id');
      expect(response.data.data.user).to.have.property('email', testUser.email);
      expect(response.data.data.user).to.have.property('name', testUser.name);
      expect(response.data.data.user).to.have.property('isActive', testUser.isActive);
      expect(response.data.data.user).to.not.have.property('password'); // Password should not be returned

      createdUserId = response.data.data.user.id;
    });

    it('should create user with specific role', async () => {
      const adminUser = {
        ...testUser,
        email: 'admin.user@example.com',
        name: 'Admin User',
        role: 'admin'
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/users`, adminUser, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.user).to.have.property('role', 'admin');
    });

    it('should reject creation with duplicate email', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/users`, testUser, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.message).to.include('already exists');
      }
    });

    it('should reject creation with invalid email', async () => {
      const invalidUser = {
        ...testUser,
        email: 'invalid-email',
        name: 'Invalid User'
      };

      try {
        await axios.post(`${BASE_URL}/api/superadmin/users`, invalidUser, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject creation with weak password', async () => {
      const weakPasswordUser = {
        ...testUser,
        email: 'weak.password@example.com',
        password: 'weak'
      };

      try {
        await axios.post(`${BASE_URL}/api/superadmin/users`, weakPasswordUser, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject creation without authentication', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/users`, testUser);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('PUT /api/superadmin/users/[id]', () => {
    it('should update an existing user', async () => {
      const updateData = {
        name: 'Updated Test User',
        role: 'admin',
        isActive: false
      };

      const response = await axios.put(`${BASE_URL}/api/superadmin/users/${createdUserId}`, updateData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.user).to.have.property('name', updateData.name);
      expect(response.data.data.user).to.have.property('role', updateData.role);
      expect(response.data.data.user).to.have.property('isActive', updateData.isActive);
    });

    it('should update user password', async () => {
      const updateData = {
        password: 'NewPassword123'
      };

      const response = await axios.put(`${BASE_URL}/api/superadmin/users/${createdUserId}`, updateData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.user).to.not.have.property('password'); // Password should not be returned
    });

    it('should reject update with invalid user ID', async () => {
      try {
        await axios.put(`${BASE_URL}/api/superadmin/users/invalid-id`, { name: 'Updated' }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject update without authentication', async () => {
      try {
        await axios.put(`${BASE_URL}/api/superadmin/users/${createdUserId}`, { name: 'Updated' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('DELETE /api/superadmin/users/[id]', () => {
    it('should delete an existing user', async () => {
      const response = await axios.delete(`${BASE_URL}/api/superadmin/users/${createdUserId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('deleted');
    });

    it('should reject deletion of non-existent user', async () => {
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/users/non-existent-id`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject deletion without authentication', async () => {
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/users/${createdUserId}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/users/[id]', () => {
    it('should fetch a specific user by ID', async () => {
      // First create a user to fetch
      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/users`, {
        ...testUser,
        email: 'user.to.fetch@example.com',
        name: 'User to Fetch'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const userId = createResponse.data.data.user.id;

      const response = await axios.get(`${BASE_URL}/api/superadmin/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.user).to.have.property('id', userId);
      expect(response.data.data.user).to.have.property('name', 'User to Fetch');
      expect(response.data.data.user).to.not.have.property('password'); // Password should not be returned
    });

    it('should reject fetch with invalid user ID', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/users/invalid-id`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject fetch without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/users/some-id`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/users/[id]/reset-password', () => {
    it('should reset user password', async () => {
      // First create a user
      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/users`, {
        ...testUser,
        email: 'reset.password@example.com',
        name: 'Reset Password User'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const userId = createResponse.data.data.user.id;

      const response = await axios.post(`${BASE_URL}/api/superadmin/users/${userId}/reset-password`, {
        newPassword: 'ResetPassword123'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('password reset');
    });

    it('should reject password reset with invalid user ID', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/users/invalid-id/reset-password`, {
          newPassword: 'ResetPassword123'
        }, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject password reset without authentication', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/users/some-id/reset-password`, {
          newPassword: 'ResetPassword123'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/users/stats', () => {
    it('should fetch user statistics', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/users/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('totalUsers');
      expect(response.data.data).to.have.property('activeUsers');
      expect(response.data.data).to.have.property('inactiveUsers');
      expect(response.data.data).to.have.property('roleDistribution');
    });

    it('should reject stats request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/users/stats`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });
});

module.exports = { authToken };
