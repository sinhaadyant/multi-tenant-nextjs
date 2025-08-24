const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TENANT_SLUG = 'cons';
const TEST_USER = 'test11@gmail.com';
const TEST_PASSWORD = 'password123';

async function testSupportPermissions() {
  console.log('🧪 Testing Support Module Permissions...\n');

  try {
    // Step 1: Login
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/api/tenant/auth/login`, {
      email: TEST_USER,
      password: TEST_PASSWORD,
      tenantSlug: TENANT_SLUG
    });

    if (!loginResponse.data.success) {
      throw new Error(`Login failed: ${loginResponse.data.message}`);
    }

    const { token } = loginResponse.data.data;
    console.log('✅ Login successful\n');

    // Set up axios with auth token
    const api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 2: Get user profile to check permissions
    console.log('2️⃣ Checking user permissions...');
    const profileResponse = await api.get(`/api/tenant/${TENANT_SLUG}/profile`);
    
    if (!profileResponse.data.success) {
      throw new Error(`Profile fetch failed: ${profileResponse.data.message}`);
    }

    const userData = profileResponse.data.data;
    console.log('✅ Profile fetch successful');
    
    // Check support permissions
    const supportPermissions = userData.permissions?.filter(p => p.moduleKey === 'support') || [];
    console.log('🔐 Support permissions:', supportPermissions.map(p => ({
      moduleKey: p.moduleKey,
      canRead: p.canRead,
      canViewAll: p.canViewAll,
      canCreate: p.canCreate,
      canUpdate: p.canUpdate,
      canDelete: p.canDelete
    })));

    // Step 3: Test support module access
    console.log('\n3️⃣ Testing support module access...');
    
    // Check if user has any support permissions
    const hasViewPermission = supportPermissions.some(p => p.canRead);
    const hasViewAllPermission = supportPermissions.some(p => p.canViewAll);
    
    console.log('📋 Permission analysis:', {
      hasViewPermission,
      hasViewAllPermission,
      canViewOwnTickets: hasViewPermission && !hasViewAllPermission,
      canViewAllTickets: hasViewAllPermission,
      recommendedAccess: hasViewAllPermission ? 'All tenant support tickets' : hasViewPermission ? 'Own support tickets only' : 'No access'
    });

    // Step 4: Test API access based on permissions
    if (hasViewPermission || hasViewAllPermission) {
      console.log('\n4️⃣ Testing API access...');
      
      try {
        const supportResponse = await api.get(`/api/tenant/${TENANT_SLUG}/support`);
        
        if (supportResponse.data.success) {
          const supportData = supportResponse.data.data;
          console.log('✅ Support tickets API accessible');
          console.log('📊 Available tickets:', {
            totalTickets: supportData.tickets?.length || 0,
            stats: supportData.stats
          });
          
          // Check if tickets are filtered based on permissions
          if (supportData.tickets && supportData.tickets.length > 0) {
            const ticketCreators = supportData.tickets.map(t => t.createdBy?.id).filter(Boolean);
            const uniqueCreators = [...new Set(ticketCreators)];
            
            console.log('🎫 Ticket access analysis:', {
              totalTickets: supportData.tickets.length,
              uniqueCreators: uniqueCreators.length,
              currentUserId: userData.id,
              showingOnlyOwnTickets: uniqueCreators.length === 1 && uniqueCreators[0] === userData.id,
              showingAllTickets: uniqueCreators.length > 1 || (uniqueCreators.length === 1 && uniqueCreators[0] !== userData.id)
            });
          }
        } else {
          console.log('❌ Support tickets API not accessible:', supportResponse.data.message);
        }
      } catch (apiError) {
        console.log('❌ Support tickets API error:', apiError.response?.data?.message || apiError.message);
      }
    } else {
      console.log('\n4️⃣ User has no support permissions - API access should be denied');
    }

    // Step 5: Check modules API for support visibility
    console.log('\n5️⃣ Checking support module visibility...');
    
    const modulesResponse = await api.get(`/api/tenant/${TENANT_SLUG}/modules`);
    if (modulesResponse.data.success) {
      const modules = modulesResponse.data.data.modules || [];
      const supportModule = modules.find(m => m.moduleKey === 'support');
      
      if (supportModule) {
        console.log('✅ Support module is available:', {
          moduleKey: supportModule.moduleKey,
          moduleName: supportModule.moduleName,
          isEnabled: supportModule.isEnabled,
          isVisible: supportModule.isVisible,
          isVisibleInTenant: supportModule.isVisibleInTenant
        });
      } else {
        console.log('⚠️ Support module not found in available modules');
      }
    }

    console.log('\n🎉 Support permissions test completed!');
    console.log('\n📋 Summary:');
    console.log(`- User: ${userData.name} (${userData.email})`);
    console.log(`- Support View Permission: ${hasViewPermission ? '✅' : '❌'}`);
    console.log(`- Support View All Permission: ${hasViewAllPermission ? '✅' : '❌'}`);
    console.log(`- Recommended Access Level: ${hasViewAllPermission ? 'All tenant tickets' : hasViewPermission ? 'Own tickets only' : 'No access'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSupportPermissions();
