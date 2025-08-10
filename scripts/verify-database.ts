import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('🔍 Verifying database contents...');

  try {
    // Count all records
    const [
      superAdminCount,
      tenantCount,
      roleCount,
      permissionCount,
      userCount,
      userRoleCount,
      auditLogCount,
      notificationCount,
      supportTicketCount,
      reportCount
    ] = await Promise.all([
      prisma.superAdmin.count(),
      prisma.tenant.count(),
      prisma.role.count(),
      prisma.permission.count(),
      prisma.user.count(),
      prisma.userRole.count(),
      prisma.auditLog.count(),
      prisma.notification.count(),
      prisma.supportTicket.count(),
      prisma.report.count()
    ]);

    console.log('\n📊 Database Summary:');
    console.log(`├── SuperAdmins: ${superAdminCount}`);
    console.log(`├── Tenants: ${tenantCount}`);
    console.log(`├── Roles: ${roleCount}`);
    console.log(`├── Permissions: ${permissionCount}`);
    console.log(`├── Users: ${userCount}`);
    console.log(`├── User Roles: ${userRoleCount}`);
    console.log(`├── Audit Logs: ${auditLogCount}`);
    console.log(`├── Notifications: ${notificationCount}`);
    console.log(`├── Support Tickets: ${supportTicketCount}`);
    console.log(`└── Reports: ${reportCount}`);

    // Get tenant details
    const tenants = await prisma.tenant.findMany({
      include: {
        _count: {
          select: {
            users: true,
            roles: true
          }
        }
      }
    });

    console.log('\n🏢 Tenant Details:');
    tenants.forEach(tenant => {
      console.log(`├── ${tenant.name} (${tenant.slug})`);
      console.log(`│   ├── Status: ${tenant.isActive ? '✅ Active' : '❌ Disabled'}`);
      console.log(`│   ├── Plan: ${tenant.plan}`);
      console.log(`│   ├── Users: ${tenant._count.users}`);
      console.log(`│   └── Roles: ${tenant._count.roles}`);
    });

    // Get role details
    const roles = await prisma.role.findMany({
      include: {
        _count: {
          select: {
            userRoles: true,
            permissions: true
          }
        }
      }
    });

    console.log('\n🎭 Role Details:');
    roles.forEach(role => {
      const type = role.isTemplate ? 'Template' : 'Tenant';
      console.log(`├── ${role.name} (${type})`);
      console.log(`│   ├── Active: ${role.isActive ? '✅' : '❌'}`);
      console.log(`│   ├── Default: ${role.isDefault ? '✅' : '❌'}`);
      console.log(`│   ├── Users: ${role._count.userRoles}`);
      console.log(`│   └── Permissions: ${role._count.permissions}`);
    });

    // Get user details
    const users = await prisma.user.findMany({
      include: {
        tenant: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    console.log('\n👥 User Details:');
    users.forEach(user => {
      console.log(`├── ${user.name} (${user.email})`);
      console.log(`│   ├── Tenant: ${user.tenant?.name || 'N/A'}`);
      console.log(`│   ├── Active: ${user.isActive ? '✅' : '❌'}`);
      console.log(`│   └── Roles: ${user.userRoles.map(ur => ur.role.name).join(', ')}`);
    });

    console.log('\n✅ Database verification completed!');
    console.log('\n🔗 Test URLs:');
    console.log('├── SuperAdmin: http://localhost:3000/superadmin/login');
    console.log('├── Acme: http://localhost:3000/acme/login');
    console.log('└── TechStart: http://localhost:3000/techstart/login');

  } catch (error) {
    console.error('❌ Error during verification:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 