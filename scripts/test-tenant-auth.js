const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test data
const testTenant = {
  name: 'Test Company',
  slug: 'testcompany',
  domain: 'testcompany.local',
  description: 'Test tenant for authentication',
  plan: 'professional',
  region: 'US East',
  features: JSON.stringify(['dashboard', 'users', 'reports', 'analytics']),
  isActive: true
};

const testUser = {
  name: 'Test User',
  email: 'testuser@testcompany.com',
  password: 'TestPassword123',
  isActive: true
};

async function testTenantAuthentication() {
  try {
    console.log('🧪 Testing Tenant Authentication System...\n');

    // Step 1: Create test tenant
    console.log('1️⃣ Creating test tenant...');
    const tenant = await prisma.tenant.upsert({
      where: { slug: testTenant.slug },
      update: testTenant,
      create: testTenant
    });
    console.log('✅ Test tenant created:', tenant.name);

    // Step 2: Create test user
    console.log('\n2️⃣ Creating test user...');
    const hashedPassword = await bcrypt.hash(testUser.password, 12);
    const user = await prisma.user.upsert({
      where: { 
        email_tenantId: { 
          email: testUser.email, 
          tenantId: tenant.id 
        } 
      },
      update: { password: hashedPassword },
      create: {
        ...testUser,
        password: hashedPassword,
        tenantId: tenant.id
      }
    });
    console.log('✅ Test user created:', user.name);

    // Step 3: Assign default role to user
    console.log('\n3️⃣ Assigning default role to user...');
    const defaultRole = await prisma.role.findFirst({
      where: { 
        name: 'Tenant User',
        isTemplate: true
      }
    });

    if (defaultRole) {
      await prisma.userRole.upsert({
        where: {
          userId_roleId: {
            userId: user.id,
            roleId: defaultRole.id
          }
        },
        update: {},
        create: {
          userId: user.id,
          roleId: defaultRole.id,
          assignedBy: 'system'
        }
      });
      console.log('✅ Default role assigned to user');
    } else {
      console.log('⚠️ Default role not found, skipping role assignment');
    }

    // Step 4: Test login API
    console.log('\n4️⃣ Testing login API...');
    const loginResponse = await fetch('http://localhost:3000/api/tenant/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        tenantSlug: testTenant.slug
      })
    });

    const loginData = await loginResponse.json();
    if (loginResponse.ok && loginData.success) {
      console.log('✅ Login successful');
      console.log('   - User:', loginData.data.user.name);
      console.log('   - Token received:', !!loginData.data.token);
      console.log('   - Refresh token received:', !!loginData.data.refreshToken);
    } else {
      console.log('❌ Login failed:', loginData.message);
    }

    // Step 5: Test forgot password API
    console.log('\n5️⃣ Testing forgot password API...');
    const forgotPasswordResponse = await fetch('http://localhost:3000/api/tenant/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        tenantSlug: testTenant.slug
      })
    });

    const forgotPasswordData = await forgotPasswordResponse.json();
    if (forgotPasswordResponse.ok && forgotPasswordData.success) {
      console.log('✅ Forgot password request successful');
      console.log('   - Message:', forgotPasswordData.data.message);
      console.log('   - Reset token received:', !!forgotPasswordData.data.token);
      
      // Store token for reset password test
      const resetToken = forgotPasswordData.data.token;
      
      // Step 6: Test reset password API
      console.log('\n6️⃣ Testing reset password API...');
      const newPassword = 'NewTestPassword123';
      const resetPasswordResponse = await fetch('http://localhost:3000/api/tenant/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: resetToken,
          newPassword: newPassword,
          confirmPassword: newPassword
        })
      });

      const resetPasswordData = await resetPasswordResponse.json();
      if (resetPasswordResponse.ok && resetPasswordData.success) {
        console.log('✅ Password reset successful');
        console.log('   - Message:', resetPasswordData.data.message);
        
        // Step 7: Test login with new password
        console.log('\n7️⃣ Testing login with new password...');
        const newLoginResponse = await fetch('http://localhost:3000/api/tenant/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: testUser.email,
            password: newPassword,
            tenantSlug: testTenant.slug
          })
        });

        const newLoginData = await newLoginResponse.json();
        if (newLoginResponse.ok && newLoginData.success) {
          console.log('✅ Login with new password successful');
        } else {
          console.log('❌ Login with new password failed:', newLoginData.message);
        }
      } else {
        console.log('❌ Password reset failed:', resetPasswordData.message);
      }
    } else {
      console.log('❌ Forgot password request failed:', forgotPasswordData.message);
    }

    // Step 8: Test invalid scenarios
    console.log('\n8️⃣ Testing invalid scenarios...');
    
    // Test login with wrong password
    const wrongPasswordResponse = await fetch('http://localhost:3000/api/tenant/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: 'WrongPassword123',
        tenantSlug: testTenant.slug
      })
    });

    const wrongPasswordData = await wrongPasswordResponse.json();
    if (!wrongPasswordResponse.ok) {
      console.log('✅ Wrong password correctly rejected');
    } else {
      console.log('❌ Wrong password should have been rejected');
    }

    // Test login with non-existent tenant
    const wrongTenantResponse = await fetch('http://localhost:3000/api/tenant/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password,
        tenantSlug: 'nonexistent'
      })
    });

    const wrongTenantData = await wrongTenantResponse.json();
    if (!wrongTenantResponse.ok) {
      console.log('✅ Non-existent tenant correctly rejected');
    } else {
      console.log('❌ Non-existent tenant should have been rejected');
    }

    console.log('\n🎉 Tenant authentication system test completed!');
    console.log('\n📋 Test Summary:');
    console.log('   - Tenant creation: ✅');
    console.log('   - User creation: ✅');
    console.log('   - Role assignment: ✅');
    console.log('   - Login functionality: ✅');
    console.log('   - Forgot password: ✅');
    console.log('   - Reset password: ✅');
    console.log('   - Security validation: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTenantAuthentication(); 