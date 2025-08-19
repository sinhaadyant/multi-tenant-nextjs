import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

async function testFrontendAuth() {
  console.log('🔐 Testing Frontend Authentication...');

  try {
    // Find the superadmin
    const superAdmin = await prisma.superAdmin.findFirst({
      where: { email: 'superadmin@example.com' }
    });

    if (!superAdmin) {
      console.log('❌ SuperAdmin not found');
      return;
    }

    console.log('✅ SuperAdmin found:', {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      isActive: superAdmin.isActive
    });

    // Generate token pair
    const tokenPair = generateTokenPair({
      id: superAdmin.id,
      email: superAdmin.email,
      role: 'superadmin'
    });

    console.log('🎫 Generated Token Pair:');
    console.log('Access Token:', tokenPair.accessToken);
    console.log('Expires At:', new Date(tokenPair.expiresAt).toISOString());

    // Test dashboard API with the token
    console.log('\n🌐 Testing Dashboard API...');
    
    const dashboardResponse = await fetch('http://localhost:3000/api/superadmin/dashboard', {
      headers: {
        'Authorization': `Bearer ${tokenPair.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Dashboard API Response Status:', dashboardResponse.status);
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      console.log('✅ Dashboard API Response:');
      console.log('Success:', dashboardData.success);
      console.log('Summary:', dashboardData.data?.summary);
      console.log('Total Tenants:', dashboardData.data?.summary?.totalTenants);
      console.log('Total Users:', dashboardData.data?.summary?.totalUsers);
      console.log('Total SuperAdmins:', dashboardData.data?.summary?.totalSuperAdmins);
    } else {
      const errorData = await dashboardResponse.text();
      console.log('❌ Dashboard API Error:', errorData);
    }

    // Test stats API with the token
    console.log('\n📊 Testing Stats API...');
    
    const statsResponse = await fetch('http://localhost:3000/api/superadmin/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${tokenPair.accessToken}`,
        'Content-Type': 'application/json'
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

    // Test roles API with the token
    console.log('\n🎭 Testing Roles API...');
    
    const rolesResponse = await fetch('http://localhost:3000/api/superadmin/roles', {
      headers: {
        'Authorization': `Bearer ${tokenPair.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Roles API Response Status:', rolesResponse.status);
    
    if (rolesResponse.ok) {
      const rolesData = await rolesResponse.json();
      console.log('✅ Roles API Response:');
      console.log('Success:', rolesData.success);
      console.log('Total Roles:', rolesData.data?.length);
      console.log('Sample Roles:', rolesData.data?.slice(0, 3).map((r: any) => ({ name: r.name, isGlobal: r.isGlobal })));
    } else {
      const errorData = await rolesResponse.text();
      console.log('❌ Roles API Error:', errorData);
    }

    // Test modules API with the token
    console.log('\n📦 Testing Modules API...');
    
    const modulesResponse = await fetch('http://localhost:3000/api/superadmin/modules', {
      headers: {
        'Authorization': `Bearer ${tokenPair.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📡 Modules API Response Status:', modulesResponse.status);
    
    if (modulesResponse.ok) {
      const modulesData = await modulesResponse.json();
      console.log('✅ Modules API Response:');
      console.log('Success:', modulesData.success);
      console.log('Total Modules:', modulesData.data?.length);
      console.log('Sample Modules:', modulesData.data?.slice(0, 3).map((m: any) => ({ moduleKey: m.moduleKey, moduleName: m.moduleName })));
    } else {
      const errorData = await modulesResponse.text();
      console.log('❌ Modules API Error:', errorData);
    }

  } catch (error) {
    console.error('❌ Error testing frontend auth:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testFrontendAuth()
    .then(() => {
      console.log('\n✅ Frontend auth test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Frontend auth test failed:', error);
      process.exit(1);
    });
}

export { testFrontendAuth };
