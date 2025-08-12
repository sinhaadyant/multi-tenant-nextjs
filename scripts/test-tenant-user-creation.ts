import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTenantUserCreation() {
  console.log('🧪 Testing Tenant User Creation API...\n');

  try {
    // Test 1: Check if there are tenants
    const tenants = await prisma.tenant.findMany({
      take: 3,
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      }
    });

    console.log('📊 Available Tenants:');
    console.log(`Total tenants found: ${tenants.length}\n`);

    if (tenants.length > 0) {
      tenants.forEach((tenant, index) => {
        console.log(`Tenant ${index + 1}:`);
        console.log(`  ID: ${tenant.id}`);
        console.log(`  Name: ${tenant.name}`);
        console.log(`  Slug: ${tenant.slug}`);
        console.log(`  Active: ${tenant.isActive}`);
        console.log('');
      });

      // Test 2: Check roles for the first tenant
      const firstTenant = tenants[0];
      const roles = await prisma.role.findMany({
        where: { tenantId: firstTenant.id },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true
        }
      });

      console.log(`👥 Roles for Tenant "${firstTenant.name}":`);
      console.log(`Total roles found: ${roles.length}\n`);

      if (roles.length > 0) {
        roles.forEach((role, index) => {
          console.log(`Role ${index + 1}:`);
          console.log(`  ID: ${role.id}`);
          console.log(`  Name: ${role.name}`);
          console.log(`  Description: ${role.description || 'N/A'}`);
          console.log(`  Active: ${role.isActive}`);
          console.log('');
        });
      } else {
        console.log('⚠️  No roles found for this tenant. User creation will fail without roles.\n');
      }

      // Test 3: Check existing users for the first tenant
      const users = await prisma.user.findMany({
        where: { tenantId: firstTenant.id },
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          createdAt: true
        },
        take: 5
      });

      console.log(`👤 Existing Users for Tenant "${firstTenant.name}":`);
      console.log(`Total users found: ${users.length}\n`);

      if (users.length > 0) {
        users.forEach((user, index) => {
          console.log(`User ${index + 1}:`);
          console.log(`  ID: ${user.id}`);
          console.log(`  Name: ${user.name}`);
          console.log(`  Email: ${user.email}`);
          console.log(`  Active: ${user.isActive}`);
          console.log(`  Created: ${user.createdAt.toISOString()}`);
          console.log('');
        });
      }

      // Test 4: Check database schema
      console.log('🗄️ Database Schema Check:');
      
      const tenantCount = await prisma.tenant.count();
      const roleCount = await prisma.role.count();
      const userCount = await prisma.user.count();
      const userRoleCount = await prisma.userRole.count();
      
      console.log(`Tenants: ${tenantCount}`);
      console.log(`Roles: ${roleCount}`);
      console.log(`Users: ${userCount}`);
      console.log(`User-Role Assignments: ${userRoleCount}\n`);

    } else {
      console.log('❌ No tenants found. User creation requires at least one tenant.\n');
    }

    console.log('✅ Tenant User Creation API test completed!');

  } catch (error) {
    console.error('❌ Error testing Tenant User Creation API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testTenantUserCreation();
