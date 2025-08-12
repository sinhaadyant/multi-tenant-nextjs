const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let authToken = null;
let createdRoleId = null;

describe('SuperAdmin Roles Management Tests', () => {
  before(async () => {
    // Login to get auth token
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'test.superadmin@example.com',
      password: 'TestPassword123'
    });
    authToken = loginResponse.data.data.token;
  });

  const testRole = {
    name: 'Test Role',
    description: 'A test role for testing purposes',
    permissions: [],
    color: '#3B82F6',
    priority: 5,
    isDefault: false,
    isTemplate: false
  };

  describe('GET /api/superadmin/roles', () => {
    it('should fetch all global roles with pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/roles`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('roles');
      expect(response.data.data).to.have.property('pagination');
      expect(response.data.data.pagination).to.have.property('page');
      expect(response.data.data.pagination).to.have.property('limit');
      expect(response.data.data.pagination).to.have.property('totalCount');
      expect(response.data.data.pagination).to.have.property('totalPages');
    });

    it('should fetch roles with search parameter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/roles?search=admin`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.roles).to.be.an('array');
    });

    it('should fetch roles with status filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/roles?status=active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.roles).to.be.an('array');
    });

    it('should fetch roles with custom pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/roles?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.pagination.limit).to.equal(5);
    });

    it('should fetch roles with sorting', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/roles?sortBy=name&sortOrder=asc`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.roles).to.be.an('array');
    });

    it('should reject request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/roles`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/roles', () => {
    it('should create a new global role', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/roles`, testRole, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.role).to.have.property('id');
      expect(response.data.data.role).to.have.property('name', testRole.name);
      expect(response.data.data.role).to.have.property('description', testRole.description);
      expect(response.data.data.role).to.have.property('roleScope', 'global');
      expect(response.data.data.role).to.have.property('isActive', true);

      createdRoleId = response.data.data.role.id;
    });

    it('should create role with permissions', async () => {
      const roleWithPermissions = {
        ...testRole,
        name: 'Test Role with Permissions',
        permissions: ['user.read', 'user.create'] // Assuming these permission IDs exist
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/roles`, roleWithPermissions, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.role).to.have.property('permissions');
      expect(response.data.data.role.permissions).to.be.an('array');
    });

    it('should reject creation with duplicate name', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/roles`, testRole, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
        expect(error.response.data.message).to.include('already exists');
      }
    });

    it('should reject creation with invalid data', async () => {
      const invalidRole = {
        name: '', // Empty name
        description: 'A'.repeat(600) // Too long description
      };

      try {
        await axios.post(`${BASE_URL}/api/superadmin/roles`, invalidRole, {
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
        await axios.post(`${BASE_URL}/api/superadmin/roles`, testRole);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('PUT /api/superadmin/roles/[id]', () => {
    it('should update an existing role', async () => {
      const updateData = {
        name: 'Updated Test Role',
        description: 'Updated description',
        color: '#EF4444',
        priority: 10
      };

      const response = await axios.put(`${BASE_URL}/api/superadmin/roles/${createdRoleId}`, updateData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.role).to.have.property('name', updateData.name);
      expect(response.data.data.role).to.have.property('description', updateData.description);
      expect(response.data.data.role).to.have.property('color', updateData.color);
      expect(response.data.data.role).to.have.property('priority', updateData.priority);
    });

    it('should update role permissions', async () => {
      const updateData = {
        permissions: ['user.read', 'user.update'] // Assuming these permission IDs exist
      };

      const response = await axios.put(`${BASE_URL}/api/superadmin/roles/${createdRoleId}`, updateData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.role).to.have.property('permissions');
    });

    it('should reject update with invalid role ID', async () => {
      try {
        await axios.put(`${BASE_URL}/api/superadmin/roles/invalid-id`, { name: 'Updated' }, {
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
        await axios.put(`${BASE_URL}/api/superadmin/roles/${createdRoleId}`, { name: 'Updated' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('DELETE /api/superadmin/roles/[id]', () => {
    it('should delete an existing role', async () => {
      const response = await axios.delete(`${BASE_URL}/api/superadmin/roles/${createdRoleId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('deleted');
    });

    it('should reject deletion of non-existent role', async () => {
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/roles/non-existent-id`, {
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
        await axios.delete(`${BASE_URL}/api/superadmin/roles/${createdRoleId}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/roles/[id]', () => {
    it('should fetch a specific role by ID', async () => {
      // First create a role to fetch
      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/roles`, {
        ...testRole,
        name: 'Role to Fetch'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const roleId = createResponse.data.data.role.id;

      const response = await axios.get(`${BASE_URL}/api/superadmin/roles/${roleId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.role).to.have.property('id', roleId);
      expect(response.data.data.role).to.have.property('name', 'Role to Fetch');
    });

    it('should reject fetch with invalid role ID', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/roles/invalid-id`, {
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
        await axios.get(`${BASE_URL}/api/superadmin/roles/some-id`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });
});

module.exports = { authToken };
