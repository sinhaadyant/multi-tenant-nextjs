import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create modules
  console.log('Creating modules...');
  const modules = await Promise.all([
    prisma.module.create({
      data: {
        name: 'Dashboard',
        description: 'Main dashboard and analytics',
        orderIndex: 1,
      },
    }),
    prisma.module.create({
      data: {
        name: 'Users',
        description: 'User management and profiles',
        orderIndex: 2,
      },
    }),
    prisma.module.create({
      data: {
        name: 'Roles',
        description: 'Role and permission management',
        orderIndex: 3,
      },
    }),
    prisma.module.create({
      data: {
        name: 'Support',
        description: 'Support ticket system',
        orderIndex: 4,
      },
    }),
    prisma.module.create({
      data: {
        name: 'Notifications',
        description: 'System notifications and alerts',
        orderIndex: 5,
      },
    }),
  ]);

  console.log(`✅ Created ${modules.length} modules`);

  // Create submodules
  console.log('Creating submodules...');
  const submodules = await Promise.all([
    // Dashboard submodules
    prisma.submodule.create({
      data: {
        moduleId: modules[0].id,
        name: 'Overview',
        description: 'Dashboard overview',
        orderIndex: 1,
      },
    }),
    prisma.submodule.create({
      data: {
        moduleId: modules[0].id,
        name: 'Analytics',
        description: 'Analytics and reports',
        orderIndex: 2,
      },
    }),
    // Users submodules
    prisma.submodule.create({
      data: {
        moduleId: modules[1].id,
        name: 'User List',
        description: 'List and manage users',
        orderIndex: 1,
      },
    }),
    prisma.submodule.create({
      data: {
        moduleId: modules[1].id,
        name: 'User Profile',
        description: 'User profile management',
        orderIndex: 2,
      },
    }),
    // Roles submodules
    prisma.submodule.create({
      data: {
        moduleId: modules[2].id,
        name: 'Role List',
        description: 'List and manage roles',
        orderIndex: 1,
      },
    }),
    prisma.submodule.create({
      data: {
        moduleId: modules[2].id,
        name: 'Permissions',
        description: 'Permission management',
        orderIndex: 2,
      },
    }),
    // Support submodules
    prisma.submodule.create({
      data: {
        moduleId: modules[3].id,
        name: 'Tickets',
        description: 'Support tickets',
        orderIndex: 1,
      },
    }),
    prisma.submodule.create({
      data: {
        moduleId: modules[3].id,
        name: 'Knowledge Base',
        description: 'Knowledge base articles',
        orderIndex: 2,
      },
    }),
  ]);

  console.log(`✅ Created ${submodules.length} submodules`);

  // Create global roles
  console.log('Creating global roles...');
  const globalRoles = await Promise.all([
    prisma.role.create({
      data: {
        name: 'Superadmin',
        description: 'Global super administrator with full access',
        isGlobal: true,
      },
    }),
    prisma.role.create({
      data: {
        name: 'Global Support',
        description: 'Global support team member',
        isGlobal: true,
      },
    }),
  ]);

  console.log(`✅ Created ${globalRoles.length} global roles`);

  // Create tenants
  console.log('Creating tenants...');
  const tenants = await Promise.all([
    prisma.tenant.create({
      data: {
        name: 'Tenant A',
        domain: 'tenant-a.example.com',
        loginRestrictions: {
          allowedDomains: ['tenant-a.com'],
          maxUsers: 100,
        },
      },
    }),
    prisma.tenant.create({
      data: {
        name: 'Tenant B',
        domain: 'tenant-b.example.com',
        loginRestrictions: {
          allowedDomains: ['tenant-b.com'],
          maxUsers: 50,
        },
      },
    }),
  ]);

  console.log(`✅ Created ${tenants.length} tenants`);

  // Create tenant-specific roles
  console.log('Creating tenant roles...');
  const tenantRoles = await Promise.all([
    // Tenant A roles
    prisma.role.create({
      data: {
        tenantId: tenants[0].id,
        name: 'Tenant Admin',
        description: 'Tenant administrator',
      },
    }),
    prisma.role.create({
      data: {
        tenantId: tenants[0].id,
        name: 'Tenant User',
        description: 'Regular tenant user',
      },
    }),
    // Tenant B roles
    prisma.role.create({
      data: {
        tenantId: tenants[1].id,
        name: 'Tenant Admin',
        description: 'Tenant administrator',
      },
    }),
    prisma.role.create({
      data: {
        tenantId: tenants[1].id,
        name: 'Tenant User',
        description: 'Regular tenant user',
      },
    }),
  ]);

  console.log(`✅ Created ${tenantRoles.length} tenant roles`);

  // Hash password for users
  const hashedPassword = await bcrypt.hash('password123', 12);

  // Create superadmin user
  console.log('Creating superadmin user...');
  const superadmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'superadmin@example.com',
      passwordHash: hashedPassword,
      isSuperadmin: true,
    },
  });

  // Assign superadmin role to superadmin user
  await prisma.userRole.create({
    data: {
      userId: superadmin.id,
      roleId: globalRoles[0].id, // Superadmin role
    },
  });

  console.log('✅ Created superadmin user');

  // Create tenant admin users
  console.log('Creating tenant admin users...');
  const tenantAdmins = await Promise.all([
    prisma.user.create({
      data: {
        name: 'Tenant A Admin',
        email: 'admin@tenant-a.com',
        passwordHash: hashedPassword,
        tenantId: tenants[0].id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Tenant B Admin',
        email: 'admin@tenant-b.com',
        passwordHash: hashedPassword,
        tenantId: tenants[1].id,
      },
    }),
  ]);

  // Assign tenant admin roles
  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: tenantAdmins[0].id,
        roleId: tenantRoles[0].id, // Tenant A Admin role
      },
    }),
    prisma.userRole.create({
      data: {
        userId: tenantAdmins[1].id,
        roleId: tenantRoles[2].id, // Tenant B Admin role
      },
    }),
  ]);

  console.log('✅ Created tenant admin users');

  // Create sample tenant users
  console.log('Creating sample tenant users...');
  const tenantUsers = await Promise.all([
    prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'john@tenant-a.com',
        passwordHash: hashedPassword,
        tenantId: tenants[0].id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: 'jane@tenant-a.com',
        passwordHash: hashedPassword,
        tenantId: tenants[0].id,
      },
    }),
    prisma.user.create({
      data: {
        name: 'Bob Wilson',
        email: 'bob@tenant-b.com',
        passwordHash: hashedPassword,
        tenantId: tenants[1].id,
      },
    }),
  ]);

  // Assign tenant user roles
  await Promise.all([
    prisma.userRole.create({
      data: {
        userId: tenantUsers[0].id,
        roleId: tenantRoles[1].id, // Tenant A User role
      },
    }),
    prisma.userRole.create({
      data: {
        userId: tenantUsers[1].id,
        roleId: tenantRoles[1].id, // Tenant A User role
      },
    }),
    prisma.userRole.create({
      data: {
        userId: tenantUsers[2].id,
        roleId: tenantRoles[3].id, // Tenant B User role
      },
    }),
  ]);

  console.log('✅ Created sample tenant users');

  // Create role permissions for superadmin (full access to all modules)
  console.log('Creating role permissions...');
  const superadminPermissions = await Promise.all(
    modules.flatMap(module =>
      submodules
        .filter(sub => sub.moduleId === module.id)
        .map(sub =>
          prisma.rolePermission.create({
            data: {
              roleId: globalRoles[0].id, // Superadmin role
              moduleId: module.id,
              submoduleId: sub.id,
              canCreate: true,
              canRead: true,
              canUpdate: true,
              canDelete: true,
              canViewAll: true,
            },
          })
        )
    )
  );

  console.log(`✅ Created ${superadminPermissions.length} superadmin permissions`);

  // Create sample support tickets
  console.log('Creating sample support tickets...');
  const supportTickets = await Promise.all([
    prisma.supportTicket.create({
      data: {
        tenantId: tenants[0].id,
        userId: tenantUsers[0].id,
        title: 'Login Issue',
        description: 'Unable to login to the system',
        status: 'open',
      },
    }),
    prisma.supportTicket.create({
      data: {
        tenantId: tenants[1].id,
        userId: tenantUsers[2].id,
        title: 'Feature Request',
        description: 'Would like to add new reporting features',
        status: 'in_progress',
      },
    }),
  ]);

  console.log(`✅ Created ${supportTickets.length} sample support tickets`);

  // Create sample support replies
  console.log('Creating sample support replies...');
  const supportReplies = await Promise.all([
    prisma.supportReply.create({
      data: {
        ticketId: supportTickets[0].id,
        userId: tenantAdmins[0].id,
        replyText: 'We are investigating the login issue. Please try clearing your browser cache.',
      },
    }),
    prisma.supportReply.create({
      data: {
        ticketId: supportTickets[1].id,
        userId: superadmin.id,
        replyText: 'Thank you for the feature request. We will review this and get back to you.',
      },
    }),
  ]);

  console.log(`✅ Created ${supportReplies.length} sample support replies`);

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`- ${modules.length} modules created`);
  console.log(`- ${submodules.length} submodules created`);
  console.log(`- ${globalRoles.length} global roles created`);
  console.log(`- ${tenants.length} tenants created`);
  console.log(`- ${tenantRoles.length} tenant roles created`);
  console.log(`- 1 superadmin user created`);
  console.log(`- ${tenantAdmins.length} tenant admin users created`);
  console.log(`- ${tenantUsers.length} tenant users created`);
  console.log(`- ${superadminPermissions.length} permissions created`);
  console.log(`- ${supportTickets.length} support tickets created`);
  console.log(`- ${supportReplies.length} support replies created`);
  console.log('\n🔑 Default login credentials:');
  console.log('Superadmin: superadmin@example.com / password123');
  console.log('Tenant A Admin: admin@tenant-a.com / password123');
  console.log('Tenant B Admin: admin@tenant-b.com / password123');
  console.log('Tenant A User: john@tenant-a.com / password123');
  console.log('Tenant B User: bob@tenant-b.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
