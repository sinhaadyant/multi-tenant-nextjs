const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let authToken = null;

describe('SuperAdmin Audit Logs Tests', () => {
  before(async () => {
    // Login to get auth token
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'test.superadmin@example.com',
      password: 'TestPassword123'
    });
    authToken = loginResponse.data.data.token;
  });

  describe('GET /api/superadmin/audit-logs', () => {
    it('should fetch all audit logs with pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('logs');
      expect(response.data.data).to.have.property('pagination');
      expect(response.data.data.pagination).to.have.property('page');
      expect(response.data.data.pagination).to.have.property('limit');
      expect(response.data.data.pagination).to.have.property('totalCount');
      expect(response.data.data.pagination).to.have.property('totalPages');
    });

    it('should fetch audit logs with action filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?action=login`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.logs).to.be.an('array');
    });

    it('should fetch audit logs with user filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?userId=test-user-id`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.logs).to.be.an('array');
    });

    it('should fetch audit logs with date range filter', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago
      const endDate = new Date().toISOString();

      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.logs).to.be.an('array');
    });

    it('should fetch audit logs with IP address filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?ipAddress=127.0.0.1`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.logs).to.be.an('array');
    });

    it('should fetch audit logs with custom pagination', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?page=1&limit=5`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.pagination.limit).to.equal(5);
    });

    it('should fetch audit logs with sorting', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?sortBy=createdAt&sortOrder=desc`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.logs).to.be.an('array');
    });

    it('should reject request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/audit-logs`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/audit-logs/[id]', () => {
    it('should fetch a specific audit log by ID', async () => {
      // First get a list of audit logs to get an ID
      const listResponse = await axios.get(`${BASE_URL}/api/superadmin/audit-logs?limit=1`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      if (listResponse.data.data.logs.length > 0) {
        const logId = listResponse.data.data.logs[0].id;

        const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs/${logId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
        expect(response.data.data.log).to.have.property('id', logId);
        expect(response.data.data.log).to.have.property('action');
        expect(response.data.data.log).to.have.property('details');
        expect(response.data.data.log).to.have.property('createdAt');
      }
    });

    it('should reject fetch with invalid log ID', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/audit-logs/invalid-id`, {
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
        await axios.get(`${BASE_URL}/api/superadmin/audit-logs/some-id`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/audit-logs/export', () => {
    it('should export audit logs as CSV', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs/export?format=csv`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/csv');
      expect(response.data).to.be.a('string');
    });

    it('should export audit logs as JSON', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs/export?format=json`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('application/json');
      expect(response.data).to.be.an('object');
    });

    it('should export audit logs with date range filter', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs/export?format=csv&startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.headers['content-type']).to.include('text/csv');
    });

    it('should reject export without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/audit-logs/export?format=csv`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/audit-logs/stats', () => {
    it('should fetch audit log statistics', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('totalLogs');
      expect(response.data.data).to.have.property('logsToday');
      expect(response.data.data).to.have.property('logsThisWeek');
      expect(response.data.data).to.have.property('logsThisMonth');
      expect(response.data.data).to.have.property('actionDistribution');
      expect(response.data.data).to.have.property('userActivity');
    });

    it('should fetch audit log statistics with date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const response = await axios.get(`${BASE_URL}/api/superadmin/audit-logs/stats?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('totalLogs');
    });

    it('should reject stats request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/audit-logs/stats`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('DELETE /api/superadmin/audit-logs', () => {
    it('should delete audit logs older than specified days', async () => {
      const response = await axios.delete(`${BASE_URL}/api/superadmin/audit-logs?olderThan=90`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.message).to.include('deleted');
    });

    it('should delete audit logs by action type', async () => {
      const response = await axios.delete(`${BASE_URL}/api/superadmin/audit-logs?action=test-action`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
    });

    it('should reject deletion without authentication', async () => {
      try {
        await axios.delete(`${BASE_URL}/api/superadmin/audit-logs?olderThan=90`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/audit-logs/search', () => {
    it('should search audit logs with advanced filters', async () => {
      const searchCriteria = {
        action: 'login',
        userId: 'test-user-id',
        ipAddress: '127.0.0.1',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
        page: 1,
        limit: 10
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/audit-logs/search`, searchCriteria, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('logs');
      expect(response.data.data).to.have.property('pagination');
    });

    it('should search audit logs with text search', async () => {
      const searchCriteria = {
        search: 'login attempt',
        page: 1,
        limit: 10
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/audit-logs/search`, searchCriteria, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.logs).to.be.an('array');
    });

    it('should reject search without authentication', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/audit-logs/search`, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });
});

module.exports = { authToken };
