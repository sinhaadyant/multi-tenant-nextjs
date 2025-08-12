import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearAndReseed() {
  console.log('🧹 Clearing all data except SuperAdmin...\n');

  try {
    // Step 1: Clear all data except SuperAdmin
    console.log('1. Clearing tenant role overrides...');
    await prisma.tenantRoleOverride.deleteMany({});
    console.log('   ✅ Tenant role overrides cleared');

    console.log('2. Clearing user role assignments...');
    await prisma.userRole.deleteMany({});
    console.log('   ✅ User role assignments cleared');

    console.log('3. Clearing role permissions...');
    await prisma.rolePermission.deleteMany({});
    console.log('   ✅ Role permissions cleared');

    console.log('4. Clearing roles...');
    await prisma.role.deleteMany({});
    console.log('   ✅ Roles cleared');

    console.log('5. Clearing user notifications...');
    await prisma.userNotification.deleteMany({});
    console.log('   ✅ User notifications cleared');

    console.log('6. Clearing support ticket comments...');
    await prisma.supportTicketComment.deleteMany({});
    console.log('   ✅ Support ticket comments cleared');

    console.log('7. Clearing support ticket attachments...');
    await prisma.supportTicketAttachment.deleteMany({});
    console.log('   ✅ Support ticket attachments cleared');

    console.log('8. Clearing support tickets...');
    await prisma.supportTicket.deleteMany({});
    console.log('   ✅ Support tickets cleared');

    console.log('9. Clearing notifications...');
    await prisma.notification.deleteMany({});
    console.log('   ✅ Notifications cleared');

    console.log('10. Clearing audit logs...');
    await prisma.auditLog.deleteMany({});
    console.log('   ✅ Audit logs cleared');

    console.log('11. Clearing reports...');
    await prisma.report.deleteMany({});
    console.log('   ✅ Reports cleared');

    console.log('12. Clearing tenant modules...');
    await prisma.tenantModule.deleteMany({});
    console.log('   ✅ Tenant modules cleared');

    console.log('13. Clearing users...');
    await prisma.user.deleteMany({});
    console.log('   ✅ Users cleared');

    console.log('14. Clearing tenants...');
    await prisma.tenant.deleteMany({});
    console.log('   ✅ Tenants cleared');

    console.log('15. Clearing permissions...');
    await prisma.permission.deleteMany({});
    console.log('   ✅ Permissions cleared');

    console.log('16. Clearing modules...');
    await prisma.module.deleteMany({});
    console.log('   ✅ Modules cleared');

    console.log('17. Clearing system settings...');
    await prisma.systemSetting.deleteMany({});
    console.log('   ✅ System settings cleared');

    console.log('18. Clearing system logs...');
    await prisma.systemLog.deleteMany({});
    console.log('   ✅ System logs cleared');

    console.log('19. Clearing invite tokens...');
    await prisma.inviteToken.deleteMany({});
    console.log('   ✅ Invite tokens cleared');

    console.log('20. Clearing password reset tokens...');
    await prisma.passwordResetToken.deleteMany({});
    console.log('   ✅ Password reset tokens cleared');

    console.log('21. Clearing refresh tokens...');
    await prisma.refreshToken.deleteMany({});
    console.log('   ✅ Refresh tokens cleared');

    console.log('22. Clearing backups...');
    await prisma.backup.deleteMany({});
    console.log('   ✅ Backups cleared');

    // Step 2: Insert fresh data
    console.log('\n🌱 Inserting fresh data...\n');

    // Create basic modules
    console.log('1. Creating modules...');
    const modules = await prisma.module.createMany({
      data: [
        {
          moduleKey: 'dashboard',
          moduleName: 'Dashboard',
          path: '/dashboard',
          icon: 'home',
          description: 'Main dashboard module',
          isActive: true,
          isVisible: true,
          orderIndex: 1
        },
        {
          moduleKey: 'users',
          moduleName: 'User Management',
          path: '/users',
          icon: 'users',
          description: 'User management module',
          isActive: true,
          isVisible: true,
          orderIndex: 2
        },
        {
          moduleKey: 'roles',
          moduleName: 'Roles & Permissions',
          path: '/roles',
          icon: 'shield',
          description: 'Role and permission management',
          isActive: true,
          isVisible: true,
          orderIndex: 3
        },
        {
          moduleKey: 'audit',
          moduleName: 'Audit Logs',
          path: '/audit',
          icon: 'activity',
          description: 'Audit log management',
          isActive: true,
          isVisible: true,
          orderIndex: 4
        },
        {
          moduleKey: 'notifications',
          moduleName: 'Notifications',
          path: '/notifications',
          icon: 'bell',
          description: 'Notification management',
          isActive: true,
          isVisible: true,
          orderIndex: 5
        }
      ]
    });
    console.log('   ✅ Modules created');

    // Create basic permissions
    console.log('2. Creating permissions...');
    const createdModules = await prisma.module.findMany();
    const permissions = [];
    
    createdModules.forEach(module => {
      permissions.push(
        {
          name: `${module.moduleKey}.read`,
          description: `Read ${module.moduleName}`,
          action: 'read',
          moduleKey: module.moduleKey,
          category: 'access',
          isActive: true
        },
        {
          name: `${module.moduleKey}.write`,
          description: `Write ${module.moduleName}`,
          action: 'write',
          moduleKey: module.moduleKey,
          category: 'access',
          isActive: true
        },
        {
          name: `${module.moduleKey}.delete`,
          description: `Delete ${module.moduleName}`,
          action: 'delete',
          moduleKey: module.moduleKey,
          category: 'access',
          isActive: true
        }
      );
    });

    await prisma.permission.createMany({
      data: permissions
    });
    console.log('   ✅ Permissions created');

    // Create global roles
    console.log('3. Creating global roles...');
    const allPermissions = await prisma.permission.findMany();
    
    const adminRole = await prisma.role.create({
      data: {
        name: 'Global Admin',
        description: 'Global administrator with full system access',
        scope: 'GLOBAL',
        tenantId: null,
        isActive: true,
        isSystem: true,
        priority: 1
      }
    });

    const editorRole = await prisma.role.create({
      data: {
        name: 'Global Editor',
        description: 'Global editor with content management permissions',
        scope: 'GLOBAL',
        tenantId: null,
        isActive: true,
        isSystem: true,
        priority: 2
      }
    });

    const viewerRole = await prisma.role.create({
      data: {
        name: 'Global Viewer',
        description: 'Global viewer with read-only access',
        scope: 'GLOBAL',
        tenantId: null,
        isActive: true,
        isSystem: true,
        priority: 3
      }
    });

    // Assign permissions to roles
    await prisma.rolePermission.createMany({
      data: [
        // Admin gets all permissions
        ...allPermissions.map(permission => ({
          roleId: adminRole.id,
          permissionId: permission.id
        })),
        // Editor gets read and write permissions
        ...allPermissions.filter(p => p.action !== 'delete').map(permission => ({
          roleId: editorRole.id,
          permissionId: permission.id
        })),
        // Viewer gets only read permissions
        ...allPermissions.filter(p => p.action === 'read').map(permission => ({
          roleId: viewerRole.id,
          permissionId: permission.id
        }))
      ]
    });
    console.log('   ✅ Global roles created with permissions');

    // Create sample tenants
    console.log('4. Creating sample tenants...');
    const tenant1 = await prisma.tenant.create({
      data: {
        name: 'TechCorp Solutions',
        slug: 'techcorp',
        description: 'Technology solutions company',
        isActive: true,
        plan: 'professional',
        region: 'US East',
        features: JSON.stringify(['dashboard', 'users', 'roles', 'audit', 'notifications'])
      }
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        name: 'Global Retail Inc',
        slug: 'globalretail',
        description: 'Global retail corporation',
        isActive: true,
        plan: 'enterprise',
        region: 'US West',
        features: JSON.stringify(['dashboard', 'users', 'roles', 'audit', 'notifications'])
      }
    });
    console.log('   ✅ Sample tenants created');

    // Create tenant-specific roles
    console.log('5. Creating tenant-specific roles...');
    const tenantAdminRole = await prisma.role.create({
      data: {
        name: 'Tenant Admin',
        description: 'Tenant administrator',
        scope: 'TENANT',
        tenantId: tenant1.id,
        isActive: true,
        isSystem: true,
        priority: 1
      }
    });

    const tenantUserRole = await prisma.role.create({
      data: {
        name: 'Tenant User',
        description: 'Regular tenant user',
        scope: 'TENANT',
        tenantId: tenant1.id,
        isActive: true,
        isSystem: true,
        priority: 2
      }
    });

    // Assign permissions to tenant roles
    await prisma.rolePermission.createMany({
      data: [
        // Tenant admin gets most permissions
        ...allPermissions.filter(p => p.action !== 'delete' || p.moduleKey === 'users').map(permission => ({
          roleId: tenantAdminRole.id,
          permissionId: permission.id
        })),
        // Tenant user gets read permissions
        ...allPermissions.filter(p => p.action === 'read').map(permission => ({
          roleId: tenantUserRole.id,
          permissionId: permission.id
        }))
      ]
    });
    console.log('   ✅ Tenant-specific roles created');

    // Create sample users
    console.log('6. Creating sample users...');
    const user1 = await prisma.user.create({
      data: {
        email: 'admin@techcorp.com',
        name: 'TechCorp Admin',
        password: '$2b$10$example.hash', // You'll need to hash this properly
        isActive: true,
        tenantId: tenant1.id
      }
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'user@techcorp.com',
        name: 'TechCorp User',
        password: '$2b$10$example.hash', // You'll need to hash this properly
        isActive: true,
        tenantId: tenant1.id
      }
    });

    const user3 = await prisma.user.create({
      data: {
        email: 'admin@globalretail.com',
        name: 'Global Retail Admin',
        password: '$2b$10$example.hash', // You'll need to hash this properly
        isActive: true,
        tenantId: tenant2.id
      }
    });
    console.log('   ✅ Sample users created');

    // Assign roles to users
    console.log('7. Assigning roles to users...');
    await prisma.userRole.createMany({
      data: [
        {
          userId: user1.id,
          roleId: tenantAdminRole.id,
          assignedBy: null
        },
        {
          userId: user2.id,
          roleId: tenantUserRole.id,
          assignedBy: null
        },
        {
          userId: user3.id,
          roleId: adminRole.id, // Give global admin role
          assignedBy: null
        }
      ]
    });
    console.log('   ✅ Roles assigned to users');

    // Create system settings
    console.log('8. Creating system settings...');
    await prisma.systemSetting.createMany({
      data: [
        { key: 'app_name', value: 'Multi-Tenant Admin Dashboard' },
        { key: 'app_version', value: '2.0.2' },
        { key: 'maintenance_mode', value: 'false' },
        { key: 'default_tenant_plan', value: 'starter' },
        { key: 'max_users_per_tenant', value: '100' },
        { key: 'session_timeout', value: '3600' }
      ]
    });
    console.log('   ✅ System settings created');

    console.log('\n✅ Clear and reseed completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Modules: ${createdModules.length}`);
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Global Roles: 3`);
    console.log(`   - Tenant Roles: 2`);
    console.log(`   - Tenants: 2`);
    console.log(`   - Users: 3`);
    console.log(`   - System Settings: 6`);

  } catch (error) {
    console.error('❌ Clear and reseed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script if executed directly
if (require.main === module) {
  clearAndReseed()
    .then(() => {
      console.log('\n🎉 Clear and reseed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Clear and reseed script failed:', error);
      process.exit(1);
    });
}

export { clearAndReseed };
