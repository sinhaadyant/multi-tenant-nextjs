const { PrismaClient } = require('@prisma/client');

async function findActiveTenant() {
  const prisma = new PrismaClient();
  
  try {
    // Find all active tenants
    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true
          }
        }
      }
    });
    
    console.log('🏢 Active Tenants:');
    tenants.forEach(tenant => {
      console.log(`  - ${tenant.name} (${tenant.slug})`);
      console.log(`    ID: ${tenant.id}`);
      console.log(`    Active: ${tenant.isActive}`);
      console.log(`    Users: ${tenant.users.length}`);
      
      if (tenant.users.length > 0) {
        console.log(`    User List:`);
        tenant.users.forEach(user => {
          console.log(`      * ${user.name} (${user.email}) - Active: ${user.isActive}`);
        });
      }
      console.log('');
    });
    
    // Find the specific user
    const testUser = await prisma.user.findFirst({
      where: { email: 'zehiboboko@mailinator.com' },
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
    
    if (testUser) {
      console.log('👤 Test User Details:');
      console.log(`  - Name: ${testUser.name}`);
      console.log(`  - Email: ${testUser.email}`);
      console.log(`  - Active: ${testUser.isActive}`);
      console.log(`  - Tenant: ${testUser.tenant?.name} (${testUser.tenant?.slug})`);
      console.log(`  - Tenant Active: ${testUser.tenant?.isActive}`);
      console.log(`  - Roles: ${testUser.userRoles.length}`);
      testUser.userRoles.forEach(ur => {
        console.log(`    * ${ur.role.name}`);
      });
    } else {
      console.log('❌ Test user not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findActiveTenant();
