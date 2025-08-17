const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Checking database users...\n');

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        isSuperadmin: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            id: true,
            name: true,
            domain: true,
          },
        },
      },
    });

    console.log(`Found ${users.length} users:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Superadmin: ${user.isSuperadmin}`);
      console.log(
        `   Tenant: ${user.tenant?.name || 'None'} (${user.tenantId || 'null'})`
      );
      console.log(`   Created: ${user.createdAt.toISOString()}`);
      console.log('');
    });

    // Also check tenants
    const tenants = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        domain: true,
        isActive: true,
      },
    });

    console.log(`Found ${tenants.length} tenants:\n`);

    tenants.forEach((tenant, index) => {
      console.log(
        `${index + 1}. ${tenant.name} (${tenant.domain || 'No domain'})`
      );
      console.log(`   ID: ${tenant.id}`);
      console.log(`   Active: ${tenant.isActive}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
