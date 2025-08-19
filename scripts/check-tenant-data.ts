import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTenantData() {
  try {
    console.log('🔍 Checking tenant data...\n');

    // Get all tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        plan: true,
        createdAt: true,
        _count: {
          select: {
            users: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    console.log('📋 Available Tenants:');
    console.log('=====================');
    
    tenants.forEach((tenant, index) => {
      console.log(`${index + 1}. ${tenant.name}`);
      console.log(`   Slug: ${tenant.slug}`);
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Active: ${tenant.isActive ? '✅' : '❌'}`);
      console.log(`   Plan: ${tenant.plan}`);
      console.log(`   Users: ${tenant._count.users}`);
      console.log(`   Created: ${tenant.createdAt.toISOString()}`);
      console.log('');
    });

    // Get users for each tenant
    console.log('👥 Users by Tenant:');
    console.log('==================');
    
    for (const tenant of tenants) {
      const users = await prisma.user.findMany({
        where: {
          tenantId: tenant.id
        },
        select: {
          id: true,
          email: true,
          name: true,
          isActive: true,
          lastLogin: true
        },
        orderBy: {
          createdAt: 'asc'
        }
      });

      console.log(`\n${tenant.name} (${tenant.slug}):`);
      users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    console.log('\n✅ Tenant data check completed!');
  } catch (error) {
    console.error('❌ Error checking tenant data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTenantData();
