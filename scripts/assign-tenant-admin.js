const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTenantAdmin() {
  try {
    console.log('🔧 Assigning Tenant Admin role...\n');

    // Get the Tenant Admin role
    const tenantAdminRole = await prisma.role.findFirst({
      where: { name: 'Tenant Admin' }
    });

    if (!tenantAdminRole) {
      console.log('❌ Tenant Admin role not found');
      return;
    }

    console.log('✅ Found Tenant Admin role:', tenantAdminRole.id);

    // Get a user to assign (using the admin user from techcorp)
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

    // Check if user already has this role
    const existingUserRole = await prisma.userRole.findFirst({
      where: {
        userId: user.id,
        roleId: tenantAdminRole.id
      }
    });

    if (existingUserRole) {
      console.log('ℹ️ User already has Tenant Admin role');
      return;
    }

    // Assign the Tenant Admin role
    const newUserRole = await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: tenantAdminRole.id
      }
    });

    console.log('✅ Successfully assigned Tenant Admin role to user');
    console.log('📋 New UserRole ID:', newUserRole.id);

    // Verify the assignment
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: { role: true }
    });

    console.log('\n📊 User roles after assignment:');
    userRoles.forEach(ur => {
      console.log(`- ${ur.role.name} (${ur.role.tenantId || 'default'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTenantAdmin(); 