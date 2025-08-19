import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateTokenPair } from '@/lib/jwt';

const prisma = new PrismaClient();

async function testSuperadminLogin() {
  console.log('🔐 Testing SuperAdmin login...');

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

    // Test password verification
    const password = 'SuperAdmin123!';
    const isValidPassword = await bcrypt.compare(password, superAdmin.password);
    
    console.log('🔑 Password verification:', isValidPassword ? '✅ Valid' : '❌ Invalid');

    if (isValidPassword) {
      // Generate token pair
      const tokenPair = generateTokenPair({
        id: superAdmin.id,
        email: superAdmin.email,
        role: 'superadmin'
      });

      console.log('🎫 Generated Token Pair:');
      console.log('Access Token:', tokenPair.accessToken);
      console.log('Refresh Token:', tokenPair.refreshToken);
      console.log('Expires At:', new Date(tokenPair.expiresAt).toISOString());
      console.log('Refresh Expires At:', new Date(tokenPair.refreshExpiresAt).toISOString());

      // Test API call with the token
      console.log('\n🌐 Testing API call...');
      
      const response = await fetch('http://localhost:3000/api/superadmin/dashboard', {
        headers: {
          'Authorization': `Bearer ${tokenPair.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 API Response Status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ API Response Data:');
        console.log('Summary:', data.data?.summary);
        console.log('Total Tenants:', data.data?.summary?.totalTenants);
        console.log('Total Users:', data.data?.summary?.totalUsers);
      } else {
        const errorData = await response.text();
        console.log('❌ API Error:', errorData);
      }
    }

  } catch (error) {
    console.error('❌ Error testing SuperAdmin login:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testSuperadminLogin()
    .then(() => {
      console.log('\n✅ SuperAdmin login test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ SuperAdmin login test failed:', error);
      process.exit(1);
    });
}

export { testSuperadminLogin };
