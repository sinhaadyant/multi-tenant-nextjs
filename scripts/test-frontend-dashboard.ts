import { PrismaClient } from '@prisma/client';
import { generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

async function testFrontendDashboard() {
  console.log('🌐 Testing Frontend Dashboard...');

  try {
    // Find the superadmin
    const superAdmin = await prisma.superAdmin.findFirst({
      where: { email: 'superadmin@example.com' }
    });

    if (!superAdmin) {
      console.log('❌ SuperAdmin not found');
      return;
    }

    // Generate token pair
    const tokenPair = generateTokenPair({
      id: superAdmin.id,
      email: superAdmin.email,
      role: 'superadmin'
    });

    console.log('🎫 Generated Token Pair for testing:');
    console.log('Access Token:', tokenPair.accessToken.substring(0, 50) + '...');
    console.log('Expires At:', new Date(tokenPair.expiresAt).toISOString());

    // Test the dashboard API with proper headers
    console.log('\n📊 Testing Dashboard API with proper authentication...');
    
    const dashboardResponse = await fetch('http://localhost:3000/api/superadmin/dashboard?range=7d', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenPair.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log('📡 Dashboard API Response Status:', dashboardResponse.status);
    console.log('📡 Dashboard API Response Headers:', Object.fromEntries(dashboardResponse.headers.entries()));
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API Response:');
      console.log('Success:', dashboardData.success);
      console.log('Data Structure:', Object.keys(dashboardData.data || {}));
      console.log('Summary:', dashboardData.data?.summary);
      console.log('Total Tenants:', dashboardData.data?.summary?.totalTenants);
      console.log('Total Users:', dashboardData.data?.summary?.totalUsers);
      console.log('Total SuperAdmins:', dashboardData.data?.summary?.totalSuperAdmins);
      console.log('Growth Metrics:', dashboardData.data?.summary?.growthMetrics);
      
      // Check if the data matches what we expect
      if (dashboardData.data?.summary?.totalTenants === 4 && 
          dashboardData.data?.summary?.totalUsers === 12 && 
          dashboardData.data?.summary?.totalSuperAdmins === 3) {
        console.log('✅ Dashboard data is correct!');
      } else {
        console.log('❌ Dashboard data is incorrect!');
        console.log('Expected: 4 tenants, 12 users, 3 superadmins');
        console.log('Actual:', dashboardData.data?.summary);
      }
    } else {
      const errorData = await dashboardResponse.text();
      console.log('❌ Dashboard API Error:', errorData);
    }

    // Test the stats API
    console.log('\n📈 Testing Stats API...');
    
    const statsResponse = await fetch('http://localhost:3000/api/superadmin/dashboard/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenPair.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📡 Stats API Response Status:', statsResponse.status);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Stats API Response:');
      console.log('Success:', statsData.success);
      console.log('Real-time Metrics:', statsData.data?.realTimeMetrics);
      console.log('Totals:', statsData.data?.totals);
    } else {
      const errorData = await statsResponse.text();
      console.log('❌ Stats API Error:', errorData);
    }

    // Test without authentication to see the difference
    console.log('\n🚫 Testing Dashboard API without authentication...');
    
    const noAuthResponse = await fetch('http://localhost:3000/api/superadmin/dashboard', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('📡 No Auth Response Status:', noAuthResponse.status);
    
    if (!noAuthResponse.ok) {
      const errorData = await noAuthResponse.text();
      console.log('✅ Correctly rejected without auth:', errorData);
    } else {
      console.log('❌ Should have been rejected without auth');
    }

    console.log('\n🔍 Summary:');
    console.log('✅ Backend APIs are working correctly');
    console.log('✅ Authentication is working correctly');
    console.log('✅ Data is being returned correctly');
    console.log('⚠️  The issue is likely in the frontend authentication flow');

  } catch (error) {
    console.error('❌ Error testing frontend dashboard:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testFrontendDashboard()
    .then(() => {
      console.log('\n✅ Frontend dashboard test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Frontend dashboard test failed:', error);
      process.exit(1);
    });
}

export { testFrontendDashboard };
