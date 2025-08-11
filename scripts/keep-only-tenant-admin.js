const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function keepOnlyTenantAdmin() {
  try {
    console.log('🔧 Keeping only Tenant Admin role...\n');

    // Get the user
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@techcorp.com'
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('✅ Found user:', user.name, `(${user.email})`);

    // Get all user roles
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true }
    });

    console.log('📊 Current user roles:');
    userRoles.forEach(ur => {
      console.log(`- ${ur.role.name} (${ur.role.tenantId || 'default'}) - ID: ${ur.id}`);
    });

    // Find the Admin role (tenant-specific) and Tenant Admin role
    const adminUserRole = userRoles.find(ur => ur.role.name === 'Admin' && ur.role.tenantId);
    const tenantAdminUserRole = userRoles.find(ur => ur.role.name === 'Tenant Admin' && !ur.role.tenantId);

    if (adminUserRole) {
      console.log(`🗑️ Removing Admin role (${adminUserRole.id})`);
      await prisma.userRole.delete({
        where: { id: adminUserRole.id }
      });
      console.log('✅ Admin role removed');
    }

    if (tenantAdminUserRole) {
      console.log(`✅ Keeping Tenant Admin role (${tenantAdminUserRole.id})`);
    }

    // Verify the result
    const finalUserRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true }
    });

    console.log('\n📊 Final user roles:');
    finalUserRoles.forEach(ur => {
      console.log(`- ${ur.role.name} (${ur.role.tenantId || 'default'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

keepOnlyTenantAdmin(); 