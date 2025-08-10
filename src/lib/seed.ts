import { prisma } from './prisma';
import { hashPassword } from './jwt';

export async function seedDatabase() {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌱 Starting database seeding...');
  }

  try {
    // Create SuperAdmin
    const superAdminEmail = 'admin@superadmin.com';
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: superAdminEmail }
    });

    if (!existingSuperAdmin) {
      const hashedPassword = await hashPassword('Admin123!');
      const superAdmin = await prisma.superAdmin.create({
        data: {
          email: superAdminEmail,
          name: 'Super Administrator',
          password: hashedPassword,
          contactNumber: '+1234567890',
          isActive: true
        }
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ SuperAdmin created:', superAdmin.email);
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('ℹ️ SuperAdmin already exists');
      }
    }

    // Create sample permissions
    const permissions = [
      { name: 'tenant.read', description: 'Read tenant information', module: 'tenant', action: 'read' },
      { name: 'tenant.create', description: 'Create new tenants', module: 'tenant', action: 'create' },
      { name: 'tenant.update', description: 'Update tenant information', module: 'tenant', action: 'update' },
      { name: 'tenant.delete', description: 'Delete tenants', module: 'tenant', action: 'delete' },
      { name: 'user.read', description: 'Read user information', module: 'user', action: 'read' },
      { name: 'user.create', description: 'Create new users', module: 'user', action: 'create' },
      { name: 'user.update', description: 'Update user information', module: 'user', action: 'update' },
      { name: 'user.delete', description: 'Delete users', module: 'user', action: 'delete' },
      { name: 'audit.read', description: 'Read audit logs', module: 'audit', action: 'read' },
      { name: 'system.settings', description: 'Manage system settings', module: 'system', action: 'settings' }
    ];

    for (const permission of permissions) {
      try {
        await prisma.permission.upsert({
          where: { name: permission.name },
          update: {},
          create: permission
        });
      } catch (error) {
        // If upsert fails, try to create directly
        try {
          await prisma.permission.create({
            data: permission
          });
        } catch (createError) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`ℹ️ Permission ${permission.name} already exists or could not be created`);
          }
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Permissions created/updated');
    }

    // Create sample roles
    const roles = [
      { name: 'Super Admin', description: 'Full system access', isGlobal: true },
      { name: 'Tenant Admin', description: 'Tenant-level administration', isGlobal: false },
      { name: 'User', description: 'Standard user access', isGlobal: false },
      { name: 'Manager', description: 'Team management access', isGlobal: false },
      { name: 'Viewer', description: 'Read-only access', isGlobal: false }
    ];

    for (const role of roles) {
      try {
        await prisma.role.upsert({
          where: { name: role.name },
          update: {},
          create: role
        });
      } catch (error) {
        // If upsert fails, try to create directly
        try {
          await prisma.role.create({
            data: role
          });
        } catch (createError) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`ℹ️ Role ${role.name} already exists or could not be created`);
          }
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Roles created/updated');
    }

    // Create sample tenants with historical data
    const sampleTenants = [
      {
        name: 'TechCorp Solutions',
        slug: 'techcorp',
        domain: 'techcorp.com',
        description: 'Leading technology solutions provider',
        plan: 'enterprise',
        region: 'US East',
        features: ['analytics', 'api', 'sso', 'backup'],
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
      },
      {
        name: 'Global Innovations',
        slug: 'global-innovations',
        domain: 'globalinnovations.com',
        description: 'Innovative global solutions',
        plan: 'professional',
        region: 'EU West',
        features: ['analytics', 'api'],
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) // 15 days ago
      },
      {
        name: 'DataFlow Systems',
        slug: 'dataflow',
        domain: 'dataflow.com',
        description: 'Advanced data processing solutions',
        plan: 'enterprise',
        region: 'US West',
        features: ['analytics', 'api', 'sso', 'backup', 'ml'],
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        name: 'CloudTech Solutions',
        slug: 'cloudtech',
        domain: 'cloudtech.com',
        description: 'Cloud infrastructure services',
        plan: 'starter',
        region: 'US East',
        features: ['analytics'],
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        name: 'Digital Dynamics',
        slug: 'digital-dynamics',
        domain: 'digitaldynamics.com',
        description: 'Digital transformation experts',
        plan: 'professional',
        region: 'EU West',
        features: ['analytics', 'api', 'sso'],
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    const createdTenants = [];
    for (const tenantData of sampleTenants) {
      const existingTenant = await prisma.tenant.findUnique({
        where: { slug: tenantData.slug }
      });

      if (!existingTenant) {
        const tenant = await prisma.tenant.create({
          data: {
            ...tenantData,
            features: JSON.stringify(tenantData.features)
          }
        });

        createdTenants.push(tenant);

        // Create admin user for each tenant
        const adminPassword = await hashPassword('admin123');
        await prisma.user.create({
          data: {
            email: `admin@${tenantData.slug}.com`,
            name: `Admin - ${tenantData.name}`,
            password: adminPassword,
            tenantId: tenant.id,
            createdAt: tenantData.createdAt
          }
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Tenant created: ${tenant.name}`);
        }
      } else {
        createdTenants.push(existingTenant);
      }
    }

    // Create sample users with historical data for charts
    const sampleUsers = [
      { email: 'john.doe@techcorp.com', name: 'John Doe', tenantSlug: 'techcorp', createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000) },
      { email: 'jane.smith@techcorp.com', name: 'Jane Smith', tenantSlug: 'techcorp', createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { email: 'mike.johnson@techcorp.com', name: 'Mike Johnson', tenantSlug: 'techcorp', createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { email: 'sarah.wilson@global-innovations.com', name: 'Sarah Wilson', tenantSlug: 'global-innovations', createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
      { email: 'david.brown@global-innovations.com', name: 'David Brown', tenantSlug: 'global-innovations', createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { email: 'emma.davis@dataflow.com', name: 'Emma Davis', tenantSlug: 'dataflow', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { email: 'alex.taylor@dataflow.com', name: 'Alex Taylor', tenantSlug: 'dataflow', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { email: 'lisa.anderson@cloudtech.com', name: 'Lisa Anderson', tenantSlug: 'cloudtech', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { email: 'tom.martinez@digital-dynamics.com', name: 'Tom Martinez', tenantSlug: 'digital-dynamics', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { email: 'anna.garcia@digital-dynamics.com', name: 'Anna Garcia', tenantSlug: 'digital-dynamics', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    ];

    for (const userData of sampleUsers) {
      const tenant = createdTenants.find(t => t.slug === userData.tenantSlug);
      if (tenant) {
        const existingUser = await prisma.user.findFirst({
          where: { email: userData.email, tenantId: tenant.id }
        });

        if (!existingUser) {
          const userPassword = await hashPassword('user123');
          await prisma.user.create({
            data: {
              email: userData.email,
              name: userData.name,
              password: userPassword,
              tenantId: tenant.id,
              createdAt: userData.createdAt
            }
          });
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Sample users created');
    }

    // Create sample audit logs for recent activity
    const auditLogs = [
      { action: 'tenant.create', tenantSlug: 'digital-dynamics', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'techcorp', createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { action: 'user.create', tenantSlug: 'dataflow', createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000) },
      { action: 'tenant.update', tenantSlug: 'global-innovations', createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'cloudtech', createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) },
      { action: 'system.backup', createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) },
      { action: 'user.update', tenantSlug: 'techcorp', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { action: 'tenant.create', tenantSlug: 'cloudtech', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { action: 'user.login', tenantSlug: 'global-innovations', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      { action: 'system.maintenance', createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
    ];

    for (const logData of auditLogs) {
      const tenant = logData.tenantSlug ? createdTenants.find(t => t.slug === logData.tenantSlug) : null;
      const user = tenant ? await prisma.user.findFirst({ where: { tenantId: tenant.id } }) : null;

      await prisma.auditLog.create({
        data: {
          action: logData.action,
          details: JSON.stringify({ description: `Sample audit log for ${logData.action}` }),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          tenantId: tenant?.id,
          userId: user?.id,
          superAdminId: existingSuperAdmin?.id,
          createdAt: logData.createdAt
        }
      });
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Sample audit logs created');
    }

    // Create sample system settings
    const systemSettings = [
      { key: 'site_title', value: 'Multi-Tenant Platform', type: 'string' },
      { key: 'default_theme', value: 'light', type: 'string' },
      { key: 'default_language', value: 'en', type: 'string' },
      { key: 'max_users_per_tenant', value: '1000', type: 'number' },
      { key: 'enable_audit_logs', value: 'true', type: 'boolean' }
    ];

    for (const setting of systemSettings) {
      try {
        await prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value },
          create: setting
        });
      } catch (error) {
        // If upsert fails, try to create directly
        try {
          await prisma.systemSetting.create({
            data: setting
          });
        } catch (createError) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`ℹ️ System setting ${setting.key} already exists or could not be created`);
          }
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ System settings created/updated');
    }

    // Create sample invite tokens
    const sampleInviteTokens = [
      {
        token: 'invite-superadmin-1',
        email: 'newadmin@example.com',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        createdBy: existingSuperAdmin?.id
      },
      {
        token: 'invite-superadmin-2',
        email: 'admin2@example.com',
        expiresAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        createdBy: existingSuperAdmin?.id
      }
    ];

    for (const tokenData of sampleInviteTokens) {
      const existingToken = await prisma.inviteToken.findUnique({
        where: { token: tokenData.token }
      });

      if (!existingToken) {
        await prisma.inviteToken.create({
          data: tokenData
        });

        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Invite token created: ${tokenData.email}`);
        }
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Invite tokens created/updated');
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('🎉 Database seeding completed successfully!');
      console.log('📧 SuperAdmin login: admin@superadmin.com / Admin123!');
      console.log('🔗 Sample invite tokens:');
      console.log('  - /superadmin/signin?token=invite-superadmin-1');
      console.log('  - /superadmin/signin?token=invite-superadmin-2');
      console.log('📊 Dashboard now has sample data for charts and analytics!');
    }

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error seeding database:', error);
    }
    throw error;
  }
} 