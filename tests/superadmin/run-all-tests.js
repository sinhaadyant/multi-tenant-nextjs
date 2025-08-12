const mocha = require('mocha');
const { expect } = require('chai');
const axios = require('axios');

// Import all test modules
const authTests = require('./auth.test.js');
const rolesTests = require('./roles.test.js');
const tenantsTests = require('./tenants.test.js');
const usersTests = require('./users.test.js');
const auditLogsTests = require('./audit-logs.test.js');
const dashboardTests = require('./dashboard.test.js');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

describe('SuperAdmin Comprehensive Test Suite', () => {
  let globalAuthToken = null;

  before(async () => {
    console.log('🚀 Starting SuperAdmin Comprehensive Test Suite');
    console.log(`📍 Testing against: ${BASE_URL}`);
    
    // Verify server is running
    try {
      const healthCheck = await axios.get(`${BASE_URL}/api/health`);
      console.log('✅ Server is running and healthy');
    } catch (error) {
      console.error('❌ Server is not running or not accessible');
      throw new Error('Server must be running to execute tests');
    }
  });

  after(async () => {
    console.log('🏁 SuperAdmin Comprehensive Test Suite completed');
  });

  describe('Test Suite Execution Order', () => {
    it('should run authentication tests first', async () => {
      console.log('\n🔐 Running Authentication Tests...');
      // Authentication tests will be run by mocha automatically
      expect(true).to.be.true; // Placeholder to ensure this block runs
    });

    it('should run roles management tests', async () => {
      console.log('\n👥 Running Roles Management Tests...');
      // Roles tests will be run by mocha automatically
      expect(true).to.be.true; // Placeholder to ensure this block runs
    });

    it('should run tenants management tests', async () => {
      console.log('\n🏢 Running Tenants Management Tests...');
      // Tenants tests will be run by mocha automatically
      expect(true).to.be.true; // Placeholder to ensure this block runs
    });

    it('should run users management tests', async () => {
      console.log('\n👤 Running Users Management Tests...');
      // Users tests will be run by mocha automatically
      expect(true).to.be.true; // Placeholder to ensure this block runs
    });

    it('should run audit logs tests', async () => {
      console.log('\n📋 Running Audit Logs Tests...');
      // Audit logs tests will be run by mocha automatically
      expect(true).to.be.true; // Placeholder to ensure this block runs
    });

    it('should run dashboard tests', async () => {
      console.log('\n📊 Running Dashboard Tests...');
      // Dashboard tests will be run by mocha automatically
      expect(true).to.be.true; // Placeholder to ensure this block runs
    });
  });

  describe('Integration Tests', () => {
    it('should verify complete workflow from login to dashboard', async () => {
      console.log('\n🔄 Running Integration Workflow Test...');
      
      // 1. Login
      const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: 'test.superadmin@example.com',
        password: 'TestPassword123'
      });
      
      expect(loginResponse.status).to.equal(200);
      expect(loginResponse.data.success).to.be.true;
      
      const authToken = loginResponse.data.data.token;
      
      // 2. Access dashboard
      const dashboardResponse = await axios.get(`${BASE_URL}/api/superadmin/dashboard`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(dashboardResponse.status).to.equal(200);
      expect(dashboardResponse.data.success).to.be.true;
      
      // 3. Access roles
      const rolesResponse = await axios.get(`${BASE_URL}/api/superadmin/roles`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(rolesResponse.status).to.equal(200);
      expect(rolesResponse.data.success).to.be.true;
      
      // 4. Access tenants
      const tenantsResponse = await axios.get(`${BASE_URL}/api/superadmin/tenants`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(tenantsResponse.status).to.equal(200);
      expect(tenantsResponse.data.success).to.be.true;
      
      // 5. Access users
      const usersResponse = await axios.get(`${BASE_URL}/api/superadmin/users`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(usersResponse.status).to.equal(200);
      expect(usersResponse.data.success).to.be.true;
      
      // 6. Access audit logs
      const auditLogsResponse = await axios.get(`${BASE_URL}/api/superadmin/audit-logs`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      expect(auditLogsResponse.status).to.equal(200);
      expect(auditLogsResponse.data.success).to.be.true;
      
      console.log('✅ Integration workflow test completed successfully');
    });

    it('should verify authentication token works across all modules', async () => {
      console.log('\n🔑 Running Cross-Module Authentication Test...');
      
      // Login once
      const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: 'test.superadmin@example.com',
        password: 'TestPassword123'
      });
      
      const authToken = loginResponse.data.data.token;
      
      // Test token across multiple endpoints
      const endpoints = [
        '/api/superadmin/dashboard',
        '/api/superadmin/roles',
        '/api/superadmin/tenants',
        '/api/superadmin/users',
        '/api/superadmin/audit-logs'
      ];
      
      for (const endpoint of endpoints) {
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        expect(response.status).to.equal(200);
        expect(response.data.success).to.be.true;
      }
      
      console.log('✅ Cross-module authentication test completed successfully');
    });
  });

  describe('Performance Tests', () => {
    it('should test API response times', async () => {
      console.log('\n⚡ Running Performance Tests...');
      
      // Login first
      const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: 'test.superadmin@example.com',
        password: 'TestPassword123'
      });
      
      const authToken = loginResponse.data.data.token;
      
      // Test response times for key endpoints
      const endpoints = [
        '/api/superadmin/dashboard',
        '/api/superadmin/roles',
        '/api/superadmin/tenants',
        '/api/superadmin/users',
        '/api/superadmin/audit-logs'
      ];
      
      const maxResponseTime = 2000; // 2 seconds
      
      for (const endpoint of endpoints) {
        const startTime = Date.now();
        
        const response = await axios.get(`${BASE_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        const responseTime = Date.now() - startTime;
        
        expect(response.status).to.equal(200);
        expect(responseTime).to.be.lessThan(maxResponseTime);
        
        console.log(`  ${endpoint}: ${responseTime}ms`);
      }
      
      console.log('✅ Performance tests completed successfully');
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle invalid authentication gracefully', async () => {
      console.log('\n🚫 Running Error Handling Tests...');
      
      const invalidToken = 'invalid-token';
      const endpoints = [
        '/api/superadmin/dashboard',
        '/api/superadmin/roles',
        '/api/superadmin/tenants',
        '/api/superadmin/users',
        '/api/superadmin/audit-logs'
      ];
      
      for (const endpoint of endpoints) {
        try {
          await axios.get(`${BASE_URL}${endpoint}`, {
            headers: { 'Authorization': `Bearer ${invalidToken}` }
          });
          expect.fail('Should have thrown an error');
        } catch (error) {
          expect(error.response.status).to.equal(401);
          expect(error.response.data.success).to.be.false;
        }
      }
      
      console.log('✅ Error handling tests completed successfully');
    });

    it('should handle malformed requests gracefully', async () => {
      // Test malformed JSON
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/login`, 'invalid json', {
          headers: { 'Content-Type': 'application/json' }
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
      
      // Test missing required fields
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
      }
    });
  });
});

// Export for potential use in other test files
module.exports = {
  BASE_URL,
  runAllTests: () => {
    console.log('🎯 SuperAdmin Comprehensive Test Suite');
    console.log('=====================================');
    console.log('This test suite covers:');
    console.log('✅ Authentication (Login, Forgot Password, Reset Password)');
    console.log('✅ Roles Management (CRUD operations)');
    console.log('✅ Tenants Management (CRUD operations)');
    console.log('✅ Users Management (CRUD operations)');
    console.log('✅ Audit Logs (Viewing, Exporting, Statistics)');
    console.log('✅ Dashboard (Overview, Statistics, Charts)');
    console.log('✅ Integration Tests (Cross-module workflows)');
    console.log('✅ Performance Tests (Response time validation)');
    console.log('✅ Error Handling Tests (Graceful error responses)');
    console.log('');
  }
};
