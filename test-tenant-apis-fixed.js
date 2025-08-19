const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'acme-corp';

// Test credentials
const TEST_USER = {
  email: 'test@acme-corp.com',
  password: 'test123',
  tenantSlug: 'acme-corp'
};

let authToken = null;

// Utility function to log results
const logResult = (testName, success, data = null, error = null) => {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}`);
  if (data) {
    console.log(`   Data:`, JSON.stringify(data, null, 2));
  }
  if (error) {
    console.log(`   Error:`, error.message || error);
  }
  console.log('');
};

// Test authentication
const testAuth = async () => {
  console.log('🔐 Testing Authentication...\n');
  
  try {
    const response = await axios.post(`${BASE_URL}/api/tenant/auth/login`, TEST_USER);
    authToken = response.data.data.token;
    logResult('Login', true, { token: authToken ? authToken.substring(0, 20) + '...' : 'No token' });
    return true;
  } catch (error) {
    logResult('Login', false, null, error);
    return false;
  }
};

// Test tenant info
const testTenantInfo = async () => {
  console.log('🏢 Testing Tenant Info...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/info`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Tenant Info', true, response.data);
    return true;
  } catch (error) {
    logResult('Get Tenant Info', false, null, error);
    return false;
  }
};

// Test user profile
const testUserProfile = async () => {
  console.log('👤 Testing User Profile...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/me`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get User Profile', true, response.data);
    return true;
  } catch (error) {
    logResult('Get User Profile', false, null, error);
    return false;
  }
};

// Test roles API
const testRolesAPI = async () => {
  console.log('🛡️ Testing Roles API...\n');
  
  try {
    // Get roles list
    const rolesResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Roles List', true, { count: rolesResponse.data.roles?.length || 0 });
    
    // Get role assignments
    const assignmentsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/assign`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Role Assignments', true, { count: assignmentsResponse.data.assignments?.length || 0 });
    
    // Get role analytics
    const analyticsResponse = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/analytics`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Role Analytics', true, analyticsResponse.data);
    
    return true;
  } catch (error) {
    logResult('Roles API', false, null, error);
    return false;
  }
};

// Test permissions API
const testPermissionsAPI = async () => {
  console.log('🔑 Testing Permissions API...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/permissions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Permissions', true, { 
      permissions: response.data.permissions?.length || 0,
      modules: response.data.modules?.length || 0
    });
    return true;
  } catch (error) {
    logResult('Get Permissions', false, null, error);
    return false;
  }
};

// Test users API
const testUsersAPI = async () => {
  console.log('👥 Testing Users API...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/users`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Users List', true, { count: response.data.users?.length || 0 });
    return true;
  } catch (error) {
    logResult('Get Users List', false, null, error);
    return false;
  }
};

// Test support tickets API
const testSupportTicketsAPI = async () => {
  console.log('🎫 Testing Support Tickets API...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Support Tickets', true, { count: response.data.tickets?.length || 0 });
    return true;
  } catch (error) {
    logResult('Get Support Tickets', false, null, error);
    return false;
  }
};

// Test dashboard API
const testDashboardAPI = async () => {
  console.log('📊 Testing Dashboard API...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Dashboard Data', true, response.data);
    return true;
  } catch (error) {
    logResult('Get Dashboard Data', false, null, error);
    return false;
  }
};

// Test modules API
const testModulesAPI = async () => {
  console.log('📦 Testing Modules API...\n');
  
  try {
    const response = await axios.get(`${BASE_URL}/api/tenant/${TENANT_SLUG}/modules`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Get Modules', true, { count: response.data.modules?.length || 0 });
    return true;
  } catch (error) {
    logResult('Get Modules', false, null, error);
    return false;
  }
};

// Test CRUD operations for roles
const testRoleCRUD = async () => {
  console.log('🔄 Testing Role CRUD Operations...\n');
  
  try {
    // Create a test role
    const newRole = {
      name: 'Test Role',
      description: 'A test role for API testing',
      color: '#3B82F6',
      permissions: []
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles`, newRole, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Create Role', true, { roleId: createResponse.data.role?.id });
    
    const roleId = createResponse.data.role?.id;
    
    if (roleId) {
      // Update the role
      const updateData = {
        name: 'Updated Test Role',
        description: 'Updated description'
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${roleId}`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logResult('Update Role', true, updateResponse.data);
      
      // Delete the role
      await axios.delete(`${BASE_URL}/api/tenant/${TENANT_SLUG}/roles/${roleId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logResult('Delete Role', true);
    }
    
    return true;
  } catch (error) {
    logResult('Role CRUD', false, null, error);
    return false;
  }
};

// Test CRUD operations for support tickets
const testSupportTicketCRUD = async () => {
  console.log('🎫 Testing Support Ticket CRUD Operations...\n');
  
  try {
    // Create a test ticket
    const newTicket = {
      title: 'Test Support Ticket',
      description: 'This is a test support ticket for API testing',
      priority: 'medium',
      category: 'general'
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support`, newTicket, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    logResult('Create Support Ticket', true, { ticketId: createResponse.data.ticket?.id });
    
    const ticketId = createResponse.data.ticket?.id;
    
    if (ticketId) {
      // Update the ticket
      const updateData = {
        title: 'Updated Test Support Ticket',
        status: 'in_progress'
      };
      
      const updateResponse = await axios.put(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${ticketId}`, updateData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logResult('Update Support Ticket', true, updateResponse.data);
      
      // Add a comment
      const commentData = {
        content: 'This is a test comment'
      };
      
      const commentResponse = await axios.post(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${ticketId}/comments`, commentData, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logResult('Add Comment', true, commentResponse.data);
      
      // Delete the ticket
      await axios.delete(`${BASE_URL}/api/tenant/${TENANT_SLUG}/support/${ticketId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      logResult('Delete Support Ticket', true);
    }
    
    return true;
  } catch (error) {
    logResult('Support Ticket CRUD', false, null, error);
    return false;
  }
};

// Main test function
const runAllTests = async () => {
  console.log('🚀 Starting API Tests...\n');
  console.log('=' * 50);
  
  const results = {
    auth: false,
    tenantInfo: false,
    userProfile: false,
    roles: false,
    permissions: false,
    users: false,
    supportTickets: false,
    dashboard: false,
    modules: false,
    roleCRUD: false,
    supportTicketCRUD: false
  };
  
  // Run tests in sequence
  results.auth = await testAuth();
  
  if (results.auth) {
    results.tenantInfo = await testTenantInfo();
    results.userProfile = await testUserProfile();
    results.roles = await testRolesAPI();
    results.permissions = await testPermissionsAPI();
    results.users = await testUsersAPI();
    results.supportTickets = await testSupportTicketsAPI();
    results.dashboard = await testDashboardAPI();
    results.modules = await testModulesAPI();
    results.roleCRUD = await testRoleCRUD();
    results.supportTicketCRUD = await testSupportTicketCRUD();
  }
  
  // Summary
  console.log('📋 Test Summary:');
  console.log('=' * 50);
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅' : '❌';
    console.log(`${status} ${test}`);
  });
  
  console.log(`\n🎯 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! The API fixes are working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Please check the errors above.');
  }
};

// Run the tests
runAllTests().catch(console.error);
