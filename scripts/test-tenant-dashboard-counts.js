// Test script to verify tenant dashboard counts are working
// Run this in your browser console while on a tenant dashboard

console.log('🧪 Testing Tenant Dashboard Counts...');

const TENANT_SLUG = window.location.pathname.split('/')[1]; // Get tenant slug from URL

// Test 1: Check if we're on a tenant dashboard
function testCurrentPage() {
  console.log('\n📋 Test 1: Current Page Check');
  console.log('Current URL:', window.location.href);
  console.log('Tenant Slug:', TENANT_SLUG);
  console.log('Is Dashboard:', window.location.pathname.includes('/dashboard'));
  
  if (!TENANT_SLUG || TENANT_SLUG === 'superadmin') {
    console.log('❌ Not on a tenant dashboard page');
    return false;
  }
  
  console.log('✅ On tenant dashboard page');
  return true;
}

// Test 2: Check if dashboard stats API is accessible
async function testDashboardStatsAPI() {
  console.log('\n📋 Test 2: Dashboard Stats API');
  try {
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/dashboard/stats`);
    const data = await response.json();
    
    console.log('API Response:', data);
    
    if (data.success) {
      console.log('✅ API call successful');
      console.log('Stats data:', data.data);
      
      // Check if counts are present
      const summary = data.data?.summary;
      if (summary) {
        console.log('📊 Counts found:');
        console.log('- Total Users:', summary.totalUsers);
        console.log('- Active Users:', summary.activeUsers);
        console.log('- Total Roles:', summary.totalRoles);
        console.log('- Total Audit Events:', summary.totalAuditEvents);
      } else {
        console.log('❌ No summary data found');
      }
      
      return data.data;
    } else {
      console.log('❌ API call failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ API call error:', error);
    return null;
  }
}

// Test 3: Check if dashboard stats API with range parameter
async function testDashboardStatsWithRange() {
  console.log('\n📋 Test 3: Dashboard Stats API with Range');
  try {
    const response = await fetch(`/api/tenant/${TENANT_SLUG}/dashboard/stats?range=7d`);
    const data = await response.json();
    
    console.log('API Response with range:', data);
    
    if (data.success) {
      console.log('✅ API call with range successful');
      return data.data;
    } else {
      console.log('❌ API call with range failed:', data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ API call with range error:', error);
    return null;
  }
}

// Test 4: Check if permissions are working
async function testPermissions() {
  console.log('\n📋 Test 4: Permissions Check');
  try {
    // Check if user has any permissions by looking at the dashboard elements
    const countCards = document.querySelectorAll('[class*="CountCard"]');
    const overviewCards = document.querySelectorAll('[class*="TenantDashboardOverviewCards"]');
    
    console.log('Count Cards found:', countCards.length);
    console.log('Overview Cards found:', overviewCards.length);
    
    // Check for permission debug info
    const debugPermissions = document.querySelector('[class*="Debug Permissions"]');
    if (debugPermissions) {
      console.log('✅ Permission debug info found');
      console.log('Debug content:', debugPermissions.textContent);
    } else {
      console.log('⚠️ No permission debug info found');
    }
    
    return {
      countCards: countCards.length,
      overviewCards: overviewCards.length,
      hasDebugInfo: !!debugPermissions
    };
  } catch (error) {
    console.error('❌ Permissions check error:', error);
    return null;
  }
}

// Test 5: Check React Query cache
function testReactQueryCache() {
  console.log('\n📋 Test 5: React Query Cache Check');
  try {
    // Check if React Query DevTools are available
    if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_KEY__) {
      console.log('✅ React Query DevTools available');
    } else {
      console.log('⚠️ React Query DevTools not available');
    }
    
    // Check if we can access the query cache
    if (window.__REACT_QUERY_DEVTOOLS_GLOBAL_KEY__) {
      const queryCache = window.__REACT_QUERY_DEVTOOLS_GLOBAL_KEY__.queryCache;
      const queries = queryCache.getAll();
      
      console.log('Total queries in cache:', queries.length);
      
      // Look for dashboard-related queries
      const dashboardQueries = queries.filter(query => 
        query.queryKey.some(key => 
          typeof key === 'string' && key.includes('dashboard')
        )
      );
      
      console.log('Dashboard queries found:', dashboardQueries.length);
      dashboardQueries.forEach(query => {
        console.log('- Query:', query.queryKey, 'State:', query.state.status);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ React Query cache check error:', error);
    return false;
  }
}

// Test 6: Check DOM elements for counts
function testDOMElements() {
  console.log('\n📋 Test 6: DOM Elements Check');
  
  // Look for count elements
  const countElements = document.querySelectorAll('[class*="text-2xl"], [class*="font-bold"]');
  const potentialCounts = Array.from(countElements).filter(el => {
    const text = el.textContent?.trim();
    return text && /^\d+$/.test(text) && parseInt(text) >= 0;
  });
  
  console.log('Potential count elements found:', potentialCounts.length);
  potentialCounts.forEach((el, index) => {
    console.log(`- Count ${index + 1}:`, el.textContent?.trim());
  });
  
  // Look for card titles
  const cardTitles = document.querySelectorAll('h3, [class*="title"]');
  const dashboardTitles = Array.from(cardTitles).filter(el => {
    const text = el.textContent?.trim();
    return text && (
      text.includes('Users') || 
      text.includes('Roles') || 
      text.includes('Audit') || 
      text.includes('Activity')
    );
  });
  
  console.log('Dashboard card titles found:', dashboardTitles.length);
  dashboardTitles.forEach((el, index) => {
    console.log(`- Title ${index + 1}:`, el.textContent?.trim());
  });
  
  return {
    countElements: potentialCounts.length,
    cardTitles: dashboardTitles.length
  };
}

// Run all tests
async function runAllTests() {
  console.log(`Testing tenant dashboard for: ${TENANT_SLUG}`);
  
  // Test 1: Check current page
  const isOnDashboard = testCurrentPage();
  if (!isOnDashboard) {
    console.log('❌ Stopping tests - not on tenant dashboard');
    return;
  }
  
  // Test 2: Check API
  const statsData = await testDashboardStatsAPI();
  
  // Test 3: Check API with range
  await testDashboardStatsWithRange();
  
  // Test 4: Check permissions
  const permissions = testPermissions();
  
  // Test 5: Check React Query cache
  testReactQueryCache();
  
  // Test 6: Check DOM elements
  const domElements = testDOMElements();
  
  // Summary
  console.log('\n📋 Test Summary:');
  console.log('- API Working:', !!statsData);
  console.log('- Has Stats Data:', !!(statsData?.summary));
  console.log('- Count Elements Found:', domElements.countElements);
  console.log('- Card Titles Found:', domElements.cardTitles);
  
  if (statsData?.summary) {
    console.log('\n✅ Dashboard counts should be working!');
    console.log('If counts are not showing, check:');
    console.log('1. Permissions in the debug section');
    console.log('2. React Query cache for failed queries');
    console.log('3. Browser console for errors');
  } else {
    console.log('\n❌ Dashboard counts are not working!');
    console.log('Check the API response above for errors.');
  }
}

// Run tests
runAllTests();
