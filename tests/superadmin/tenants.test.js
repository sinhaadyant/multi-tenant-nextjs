const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let authToken = null;
let createdTenantId = null;

describe('SuperAdmin Tenants Management Tests', () => {
  before(async () => {
    // Login to get auth token
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'test.superadmin@example.com',
      password: 'TestPassword123'
    });
    authToken = loginResponse.data.data.token;
  });

  const testTenant = {
    name: 'Test Tenant',
    slug: 'test-tenant',
    domain: 'test-tenant.example.com',
    plan: 'basic',
    region: 'us-east-1',
    settings: {
      maxUsers: 100,
      maxStorage: '10GB',
      features: ['dashboard', 'users', 'reports']
    }
  };

  describe('GET /api/superadmin/tenants', () => {
    it('should fetch all tenants with pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('tenants');
      expect(response.data.data).to.have.property('pagination');
      expect(response.data.data.pagination).to.have.property('page');
      expect(response.data.data.pagination).to.have.property('limit');
      expect(response.data.data.pagination).to.have.property('totalCount');
      expect(response.data.data.pagination).to.have.property('totalPages');
    });

    it('should fetch tenants with search parameter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants?search=test`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenants).to.be.an('array');
    });

    it('should fetch tenants with status filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants?status=active`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenants).to.be.an('array');
    });

    it('should fetch tenants with plan filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants?plan=basic`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenants).to.be.an('array');
    });

    it('should fetch tenants with region filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants?region=us-east-1`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenants).to.be.an('array');
    });

    it('should fetch tenants with custom pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.pagination.limit).to.equal(5);
    });

    it('should fetch tenants with sorting', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants?sortBy=name&sortOrder=asc`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenants).to.be.an('array');
    });

    it('should reject request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/tenants`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/tenants', () => {
    it('should create a new tenant', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/tenants`, testTenant, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenant).to.have.property('id');
      expect(response.data.data.tenant).to.have.property('name', testTenant.name);
      expect(response.data.data.tenant).to.have.property('slug', testTenant.slug);
      expect(response.data.data.tenant).to.have.property('domain', testTenant.domain);
      expect(response.data.data.tenant).to.have.property('plan', testTenant.plan);
      expect(response.data.data.tenant).to.have.property('isActive', true);

      createdTenantId = response.data.data.tenant.id;
    });

    it('should create tenant with admin user', async () => {
      const tenantWithAdmin = {
        ...testTenant,
        name: 'Tenant with Admin',
        slug: 'tenant-with-admin',
        domain: 'tenant-with-admin.example.com',
        adminUser: {
          email: 'admin@tenant-with-admin.com',
          name: 'Admin User',
          password: 'AdminPassword123'
        }
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/tenants`, tenantWithAdmin, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenant).to.have.property('id');
      expect(response.data.data.adminUser).to.have.property('email', tenantWithAdmin.adminUser.email);
    });

    it('should reject creation with duplicate slug', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/tenants`, testTenant, {
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
      const invalidTenant = {
        name: '', // Empty name
        slug: 'invalid-slug-with-spaces', // Invalid slug
        domain: 'invalid-domain'
      };

      try {
        await axios.post(`${BASE_URL}/api/superadmin/tenants`, invalidTenant, {
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
        await axios.post(`${BASE_URL}/api/superadmin/tenants`, testTenant);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('PUT /api/superadmin/tenants/[id]', () => {
    it('should update an existing tenant', async () => {
      const updateData = {
        name: 'Updated Test Tenant',
        plan: 'premium',
        settings: {
          maxUsers: 500,
          maxStorage: '50GB',
          features: ['dashboard', 'users', 'reports', 'analytics']
        }
      };

      const response = await axios.put(`${BASE_URL}/api/superadmin/tenants/${createdTenantId}`, updateData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenant).to.have.property('name', updateData.name);
      expect(response.data.data.tenant).to.have.property('plan', updateData.plan);
    });

    it('should update tenant status', async () => {
      const updateData = {
        isActive: false
      };

      const response = await axios.put(`${BASE_URL}/api/superadmin/tenants/${createdTenantId}`, updateData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenant).to.have.property('isActive', false);
    });

    it('should reject update with invalid tenant ID', async () => {
      try {
        await axios.put(`${BASE_URL}/api/superadmin/tenants/invalid-id`, { name: 'Updated' }, {
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
        await axios.put(`${BASE_URL}/api/superadmin/tenants/${createdTenantId}`, { name: 'Updated' });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('DELETE /api/superadmin/tenants/[id]', () => {
    it('should delete an existing tenant', async () => {
      const response = await axios.delete(`${BASE_URL}/api/superadmin/tenants/${createdTenantId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('deleted');
    });

    it('should reject deletion of non-existent tenant', async () => {
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/tenants/non-existent-id`, {
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
        await axios.delete(`${BASE_URL}/api/superadmin/tenants/${createdTenantId}`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/tenants/[id]', () => {
    it('should fetch a specific tenant by ID', async () => {
      // First create a tenant to fetch
      const createResponse = await axios.post(`${BASE_URL}/api/superadmin/tenants`, {
        ...testTenant,
        name: 'Tenant to Fetch',
        slug: 'tenant-to-fetch',
        domain: 'tenant-to-fetch.example.com'
      }, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      const tenantId = createResponse.data.data.tenant.id;

      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/${tenantId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.tenant).to.have.property('id', tenantId);
      expect(response.data.data.tenant).to.have.property('name', 'Tenant to Fetch');
    });

    it('should reject fetch with invalid tenant ID', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/tenants/invalid-id`, {
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
        await axios.get(`${BASE_URL}/api/superadmin/tenants/some-id`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/tenants/stats', () => {
    it('should fetch tenant statistics', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/tenants/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('totalTenants');
      expect(response.data.data).to.have.property('activeTenants');
      expect(response.data.data).to.have.property('inactiveTenants');
      expect(response.data.data).to.have.property('planDistribution');
    });

    it('should reject stats request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/tenants/stats`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });
});

module.exports = { authToken };
