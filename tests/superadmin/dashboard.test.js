const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let authToken = null;

describe('SuperAdmin Dashboard Tests', () => {
  before(async () => {
    // Login to get auth token
    const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
      email: 'test.superadmin@example.com',
      password: 'TestPassword123'
    });
    authToken = loginResponse.data.data.token;
  });

  describe('GET /api/superadmin/dashboard', () => {
    it('should fetch dashboard overview data', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('overview');
      expect(response.data.data.overview).to.have.property('totalTenants');
      expect(response.data.data.overview).to.have.property('totalUsers');
      expect(response.data.data.overview).to.have.property('activeTenants');
      expect(response.data.data.overview).to.have.property('totalRevenue');
    });

    it('should reject request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/dashboard/stats', () => {
    it('should fetch dashboard statistics', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('tenantStats');
      expect(response.data.data).to.have.property('userStats');
      expect(response.data.data).to.have.property('revenueStats');
      expect(response.data.data).to.have.property('activityStats');
    });

    it('should fetch dashboard statistics with date range', async () => {
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days ago
      const endDate = new Date().toISOString();

      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/stats?startDate=${startDate}&endDate=${endDate}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('tenantStats');
    });

    it('should reject stats request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard/stats`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/dashboard/charts', () => {
    it('should fetch dashboard chart data', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/charts`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('tenantGrowth');
      expect(response.data.data).to.have.property('userGrowth');
      expect(response.data.data).to.have.property('revenueChart');
      expect(response.data.data).to.have.property('activityChart');
    });

    it('should fetch chart data with specific period', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/charts?period=30d`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('tenantGrowth');
    });

    it('should reject charts request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard/charts`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/dashboard/recent-activity', () => {
    it('should fetch recent activity data', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/recent-activity`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('activities');
      expect(response.data.data.activities).to.be.an('array');
    });

    it('should fetch recent activity with limit', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/recent-activity?limit=5`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.activities).to.be.an('array');
      expect(response.data.data.activities.length).to.be.at.most(5);
    });

    it('should reject recent activity request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard/recent-activity`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/dashboard/alerts', () => {
    it('should fetch dashboard alerts', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/alerts`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('alerts');
      expect(response.data.data.alerts).to.be.an('array');
    });

    it('should fetch alerts with severity filter', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/alerts?severity=high`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data.alerts).to.be.an('array');
    });

    it('should reject alerts request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard/alerts`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/dashboard/performance', () => {
    it('should fetch system performance metrics', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/performance`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('systemMetrics');
      expect(response.data.data).to.have.property('databaseMetrics');
      expect(response.data.data).to.have.property('apiMetrics');
    });

    it('should fetch performance metrics with time range', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/performance?range=24h`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('systemMetrics');
    });

    it('should reject performance request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard/performance`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('GET /api/superadmin/dashboard/quick-actions', () => {
    it('should fetch available quick actions', async () => {
      const response = await axios.get(`${BASE_URL}/api/superadmin/dashboard/quick-actions`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('actions');
      expect(response.data.data.actions).to.be.an('array');
    });

    it('should reject quick actions request without authentication', async () => {
      try {
        await axios.get(`${BASE_URL}/api/superadmin/dashboard/quick-actions`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/dashboard/export-report', () => {
    it('should export dashboard report', async () => {
      const reportData = {
        type: 'overview',
        format: 'pdf',
        dateRange: {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/dashboard/export-report`, reportData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('reportUrl');
    });

    it('should export dashboard report in different format', async () => {
      const reportData = {
        type: 'detailed',
        format: 'excel',
        dateRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          end: new Date().toISOString()
        }
      };

      const response = await axios.post(`${BASE_URL}/api/superadmin/dashboard/export-report`, reportData, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('reportUrl');
    });

    it('should reject export request without authentication', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/dashboard/export-report`, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });
});

module.exports = { authToken };
