import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetDatabase() {
  console.log('🔄 Starting database reset...');

  try {
    // Clear all data
    console.log('🗑️ Clearing existing data...');
    
    await prisma.auditLog.deleteMany({});
    await prisma.supportTicketCommentAttachment.deleteMany({});
    await prisma.supportTicketAttachment.deleteMany({});
    await prisma.supportTicketComment.deleteMany({});
    await prisma.supportTicket.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.report.deleteMany({});
    await prisma.rolePermission.deleteMany({});
    await prisma.userRole.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.role.deleteMany({});
    await prisma.permission.deleteMany({});
    await prisma.tenant.deleteMany({});
    await prisma.inviteToken.deleteMany({});
    await prisma.passwordResetToken.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.superAdmin.deleteMany({});

    console.log('✅ All data cleared');

    // Create SuperAdmin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email: 'admin@example.com',
        name: 'Super Administrator',
        password: await bcrypt.hash('admin123', 10),
        isActive: true
      }
    });

    // Create basic permissions
    const permissions = await prisma.permission.createMany({
      data: [
        { name: 'dashboard.view', module: 'dashboard', action: 'view' },
        { name: 'users.view', module: 'users', action: 'view' },
        { name: 'users.create', module: 'users', action: 'create' },
        { name: 'users.edit', module: 'users', action: 'edit' },
        { name: 'users.delete', module: 'users', action: 'delete' },
        { name: 'roles.view', module: 'roles', action: 'view' },
        { name: 'roles.create', module: 'roles', action: 'create' },
        { name: 'roles.edit', module: 'roles', action: 'edit' },
        { name: 'roles.delete', module: 'roles', action: 'delete' },
        { name: 'reports.view', module: 'reports', action: 'view' },
        { name: 'settings.view', module: 'settings', action: 'view' },
        { name: 'settings.edit', module: 'settings', action: 'edit' }
      ]
    });

    // Create tenants
    const tenants = await Promise.all([
      prisma.tenant.create({
        data: {
          name: 'Acme Corporation',
          slug: 'acme',
          description: 'Leading technology solutions provider',
          isActive: true,
          plan: 'enterprise',
          region: 'US East',
          features: JSON.stringify(['analytics', 'integrations'])
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'TechStart Inc',
          slug: 'techstart',
          description: 'Innovative startup',
          isActive: true,
          plan: 'professional',
          region: 'US West',
          features: JSON.stringify(['basic_analytics'])
        }
      }),
      prisma.tenant.create({
        data: {
          name: 'Disabled Company',
          slug: 'disabled-company',
          description: 'Suspended tenant',
          isActive: false,
          plan: 'starter',
          region: 'US East',
          features: JSON.stringify(['basic'])
        }
      })
    ]);

    // Create roles
    const roles = await Promise.all([
      // Template roles
      prisma.role.create({
        data: {
          name: 'Admin Template',
          description: 'Full admin access',
          isTemplate: true,
          isActive: true
        }
      }),
      prisma.role.create({
        data: {
          name: 'User Template',
          description: 'Basic user access',
          isTemplate: true,
          isActive: true,
          isDefault: true
        }
      }),
      // Tenant roles
      prisma.role.create({
        data: {
          name: 'Acme Admin',
          description: 'Acme administrator',
          isTemplate: false,
          isActive: true,
          tenantId: tenants[0].id
        }
      }),
      prisma.role.create({
        data: {
          name: 'Acme User',
          description: 'Acme user',
          isTemplate: false,
          isActive: true,
          isDefault: true,
          tenantId: tenants[0].id
        }
      }),
      prisma.role.create({
        data: {
          name: 'TechStart Admin',
          description: 'TechStart administrator',
          isTemplate: false,
          isActive: true,
          tenantId: tenants[1].id
        }
      })
    ]);

    // Create users
    const users = await Promise.all([
      prisma.user.create({
        data: {
          name: 'John Smith',
          email: 'admin@acme.com',
          password: await bcrypt.hash('admin123', 10),
          isActive: true,
          tenantId: tenants[0].id
        }
      }),
      prisma.user.create({
        data: {
          name: 'Sarah Johnson',
          email: 'user@acme.com',
          password: await bcrypt.hash('user123', 10),
          isActive: true,
          tenantId: tenants[0].id
        }
      }),
      prisma.user.create({
        data: {
          name: 'Disabled User',
          email: 'disabled@acme.com',
          password: await bcrypt.hash('user123', 10),
          isActive: false,
          tenantId: tenants[0].id
        }
      }),
      prisma.user.create({
        data: {
          name: 'Alex Chen',
          email: 'admin@techstart.io',
          password: await bcrypt.hash('admin123', 10),
          isActive: true,
          tenantId: tenants[1].id
        }
      })
    ]);

    // Assign roles to users
    await Promise.all([
      prisma.userRole.create({
        data: {
          userId: users[0].id,
          roleId: roles[2].id, // Acme Admin
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[1].id,
          roleId: roles[3].id, // Acme User
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[2].id,
          roleId: roles[3].id, // Acme User
          assignedBy: superAdmin.id
        }
      }),
      prisma.userRole.create({
        data: {
          userId: users[3].id,
          roleId: roles[4].id, // TechStart Admin
          assignedBy: superAdmin.id
        }
      })
    ]);

    console.log('✅ Database reset completed!');
    console.log('\n📋 Test Credentials:');
    console.log('├── SuperAdmin: admin@example.com / admin123');
    console.log('├── Acme Admin: admin@acme.com / admin123');
    console.log('├── Acme User: user@acme.com / user123');
    console.log('├── Acme Disabled: disabled@acme.com / user123');
    console.log('└── TechStart Admin: admin@techstart.io / admin123');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 