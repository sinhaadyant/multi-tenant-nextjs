import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/jwt';

const prisma = new PrismaClient();

async function seedUsers() {
  console.log('🌱 Seeding users, tenants, and roles...');

  try {
    // Create roles
    const roles = await Promise.all([
      prisma.role.upsert({
        where: { name: 'Tenant Admin' },
        update: {},
        create: {
          name: 'Tenant Admin',
          description: 'Full access to tenant resources',
          isGlobal: false,
          isActive: true,
        },
      }),
      prisma.role.upsert({
        where: { name: 'User' },
        update: {},
        create: {
          name: 'User',
          description: 'Standard user access',
          isGlobal: false,
          isActive: true,
        },
      }),
      prisma.role.upsert({
        where: { name: 'Viewer' },
        update: {},
        create: {
          name: 'Viewer',
          description: 'Read-only access',
          isGlobal: false,
          isActive: true,
        },
      }),
      prisma.role.upsert({
        where: { name: 'Manager' },
        update: {},
        create: {
          name: 'Manager',
          description: 'Management level access',
          isGlobal: false,
          isActive: true,
        },
      }),
    ]);

    console.log('✅ Roles created:', roles.length);

    // Create tenants
    const tenants = await Promise.all([
      prisma.tenant.upsert({
        where: { slug: 'techcorp' },
        update: {},
        create: {
          name: 'TechCorp Solutions',
          slug: 'techcorp',
          domain: 'techcorp.example.com',
          description: 'Technology consulting company',
          isActive: true,
          plan: 'enterprise',
          region: 'US East',
          features: JSON.stringify(['analytics', 'api', 'support']),
        },
      }),
      prisma.tenant.upsert({
        where: { slug: 'global-innovations' },
        update: {},
        create: {
          name: 'Global Innovations',
          slug: 'global-innovations',
          domain: 'global.example.com',
          description: 'Innovation and research firm',
          isActive: true,
          plan: 'professional',
          region: 'US West',
          features: JSON.stringify(['analytics', 'api']),
        },
      }),
      prisma.tenant.upsert({
        where: { slug: 'dataflow' },
        update: {},
        create: {
          name: 'DataFlow Systems',
          slug: 'dataflow',
          domain: 'dataflow.example.com',
          description: 'Data processing and analytics',
          isActive: true,
          plan: 'professional',
          region: 'EU West',
          features: JSON.stringify(['analytics']),
        },
      }),
      prisma.tenant.upsert({
        where: { slug: 'cloudtech' },
        update: {},
        create: {
          name: 'CloudTech Pro',
          slug: 'cloudtech',
          domain: 'cloudtech.example.com',
          description: 'Cloud infrastructure provider',
          isActive: true,
          plan: 'starter',
          region: 'US East',
          features: JSON.stringify(['api']),
        },
      }),
      prisma.tenant.upsert({
        where: { slug: 'innovatelabs' },
        update: {},
        create: {
          name: 'Innovate Labs',
          slug: 'innovatelabs',
          domain: 'innovate.example.com',
          description: 'Startup incubator',
          isActive: false,
          plan: 'starter',
          region: 'US West',
          features: JSON.stringify([]),
        },
      }),
    ]);

    console.log('✅ Tenants created:', tenants.length);

    // Get role IDs
    const tenantAdminRole = await prisma.role.findUnique({ where: { name: 'Tenant Admin' } });
    const userRole = await prisma.role.findUnique({ where: { name: 'User' } });
    const viewerRole = await prisma.role.findUnique({ where: { name: 'Viewer' } });
    const managerRole = await prisma.role.findUnique({ where: { name: 'Manager' } });

    // Create users
    const users = [
      // TechCorp Solutions users
      {
        email: 'john.doe@techcorp.com',
        name: 'John Doe',
        password: 'password123',
        tenantId: tenants[0].id,
        roleId: tenantAdminRole?.id,
        isActive: true,
      },
      {
        email: 'jane.smith@techcorp.com',
        name: 'Jane Smith',
        password: 'password123',
        tenantId: tenants[0].id,
        roleId: managerRole?.id,
        isActive: true,
      },
      {
        email: 'bob.wilson@techcorp.com',
        name: 'Bob Wilson',
        password: 'password123',
        tenantId: tenants[0].id,
        roleId: userRole?.id,
        isActive: true,
      },
      {
        email: 'alice.brown@techcorp.com',
        name: 'Alice Brown',
        password: 'password123',
        tenantId: tenants[0].id,
        roleId: viewerRole?.id,
        isActive: false,
      },

      // Global Innovations users
      {
        email: 'mike.johnson@global.com',
        name: 'Mike Johnson',
        password: 'password123',
        tenantId: tenants[1].id,
        roleId: tenantAdminRole?.id,
        isActive: true,
      },
      {
        email: 'sarah.davis@global.com',
        name: 'Sarah Davis',
        password: 'password123',
        tenantId: tenants[1].id,
        roleId: managerRole?.id,
        isActive: true,
      },
      {
        email: 'david.lee@global.com',
        name: 'David Lee',
        password: 'password123',
        tenantId: tenants[1].id,
        roleId: userRole?.id,
        isActive: true,
      },

      // DataFlow Systems users
      {
        email: 'emma.garcia@dataflow.com',
        name: 'Emma Garcia',
        password: 'password123',
        tenantId: tenants[2].id,
        roleId: tenantAdminRole?.id,
        isActive: true,
      },
      {
        email: 'carlos.rodriguez@dataflow.com',
        name: 'Carlos Rodriguez',
        password: 'password123',
        tenantId: tenants[2].id,
        roleId: userRole?.id,
        isActive: true,
      },
      {
        email: 'lisa.chen@dataflow.com',
        name: 'Lisa Chen',
        password: 'password123',
        tenantId: tenants[2].id,
        roleId: viewerRole?.id,
        isActive: false,
      },

      // CloudTech Pro users
      {
        email: 'tom.anderson@cloudtech.com',
        name: 'Tom Anderson',
        password: 'password123',
        tenantId: tenants[3].id,
        roleId: tenantAdminRole?.id,
        isActive: true,
      },
      {
        email: 'rachel.green@cloudtech.com',
        name: 'Rachel Green',
        password: 'password123',
        tenantId: tenants[3].id,
        roleId: userRole?.id,
        isActive: true,
      },

      // Innovate Labs users (inactive tenant)
      {
        email: 'alex.kumar@innovate.com',
        name: 'Alex Kumar',
        password: 'password123',
        tenantId: tenants[4].id,
        roleId: tenantAdminRole?.id,
        isActive: false,
      },
      {
        email: 'priya.sharma@innovate.com',
        name: 'Priya Sharma',
        password: 'password123',
        tenantId: tenants[4].id,
        roleId: userRole?.id,
        isActive: false,
      },
    ];

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await hashPassword(user.password),
      }))
    );

    // Create users in batches to avoid conflicts
    for (const userData of hashedUsers) {
      await prisma.user.upsert({
        where: { 
          email_tenantId: { 
            email: userData.email, 
            tenantId: userData.tenantId 
          } 
        },
        update: {
          name: userData.name,
          password: userData.password,
          isActive: userData.isActive,
          roleId: userData.roleId,
        },
        create: {
          email: userData.email,
          name: userData.name,
          password: userData.password,
          tenantId: userData.tenantId,
          roleId: userData.roleId,
          isActive: userData.isActive,
        },
      });
    }

    console.log('✅ Users created:', hashedUsers.length);

    // Update some users with last login dates
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    for (const user of recentUsers) {
      const daysAgo = Math.floor(Math.random() * 30);
      const lastLogin = new Date();
      lastLogin.setDate(lastLogin.getDate() - daysAgo);

      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin },
      });
    }

    console.log('✅ Last login dates updated for recent users');

    console.log('🎉 Database seeding completed successfully!');
    console.log(`📊 Created ${roles.length} roles, ${tenants.length} tenants, and ${hashedUsers.length} users`);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding function
seedUsers()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }); 