import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDashboardData() {
  console.log('🔍 Checking dashboard data...');

  try {
    // Check tenants
    const totalTenants = await prisma.tenant.count();
    const activeTenants = await prisma.tenant.count({ where: { isActive: true } });
    
    console.log('📊 Tenant Data:');
    console.log(`  Total Tenants: ${totalTenants}`);
    console.log(`  Active Tenants: ${activeTenants}`);

    // Check users
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true } });
    
    console.log('👥 User Data:');
    console.log(`  Total Users: ${totalUsers}`);
    console.log(`  Active Users: ${activeUsers}`);

    // Check superadmins
    const totalSuperAdmins = await prisma.superAdmin.count();
    const activeSuperAdmins = await prisma.superAdmin.count({ where: { isActive: true } });
    
    console.log('🛡️ SuperAdmin Data:');
    console.log(`  Total SuperAdmins: ${totalSuperAdmins}`);
    console.log(`  Active SuperAdmins: ${activeSuperAdmins}`);

    // Check roles
    const totalRoles = await prisma.role.count();
    const globalRoles = await prisma.role.count({ where: { isGlobal: true } });
    const tenantRoles = await prisma.role.count({ where: { isGlobal: false } });
    
    console.log('🎭 Role Data:');
    console.log(`  Total Roles: ${totalRoles}`);
    console.log(`  Global Roles: ${globalRoles}`);
    console.log(`  Tenant Roles: ${tenantRoles}`);

    // Check role permissions
    const totalRolePermissions = await prisma.rolePermission.count();
    console.log('🔐 Role Permission Data:');
    console.log(`  Total Role Permissions: ${totalRolePermissions}`);

    // Check user roles
    const totalUserRoles = await prisma.userRole.count();
    console.log('👤 User Role Data:');
    console.log(`  Total User Roles: ${totalUserRoles}`);

    // Check modules
    const totalModules = await prisma.module.count();
    const activeModules = await prisma.module.count({ where: { isActive: true } });
    
    console.log('📦 Module Data:');
    console.log(`  Total Modules: ${totalModules}`);
    console.log(`  Active Modules: ${activeModules}`);

    // Check tenant modules
    const totalTenantModules = await prisma.tenantModule.count();
    console.log('🏢 Tenant Module Data:');
    console.log(`  Total Tenant Modules: ${totalTenantModules}`);

    // Check audit logs
    const totalAuditLogs = await prisma.auditLog.count();
    console.log('📝 Audit Log Data:');
    console.log(`  Total Audit Logs: ${totalAuditLogs}`);

    // Get sample data
    console.log('\n📋 Sample Data:');
    
    const sampleTenants = await prisma.tenant.findMany({ take: 3 });
    console.log('Sample Tenants:', sampleTenants.map(t => ({ id: t.id, name: t.name, slug: t.slug, isActive: t.isActive })));
    
    const sampleUsers = await prisma.user.findMany({ take: 3 });
    console.log('Sample Users:', sampleUsers.map(u => ({ id: u.id, email: u.email, name: u.name, isActive: u.isActive })));
    
    const sampleRoles = await prisma.role.findMany({ take: 3 });
    console.log('Sample Roles:', sampleRoles.map(r => ({ id: r.id, name: r.name, isGlobal: r.isGlobal, isActive: r.isActive })));

    // Check if there are any issues with the data
    console.log('\n🔍 Data Integrity Check:');
    
    // Check for users without roles
    const usersWithoutRoles = await prisma.user.findMany({
      where: {
        userRoles: {
          none: {}
        }
      }
    });
    console.log(`Users without roles: ${usersWithoutRoles.length}`);
    
    // Check for roles without permissions
    const rolesWithoutPermissions = await prisma.role.findMany({
      where: {
        permissions: {
          none: {}
        }
      }
    });
    console.log(`Roles without permissions: ${rolesWithoutPermissions.length}`);

    // Check for tenants without modules
    const tenantsWithoutModules = await prisma.tenant.findMany({
      where: {
        tenantModules: {
          none: {}
        }
      }
    });
    console.log(`Tenants without modules: ${tenantsWithoutModules.length}`);

  } catch (error) {
    console.error('❌ Error checking dashboard data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
if (require.main === module) {
  checkDashboardData()
    .then(() => {
      console.log('\n✅ Dashboard data check completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Dashboard data check failed:', error);
      process.exit(1);
    });
}

export { checkDashboardData };
