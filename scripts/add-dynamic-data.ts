import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addDynamicData() {
  try {
    console.log('🌱 Adding dynamic test data...');

    // Create SuperAdmin if not exists
    const superAdminEmail = 'superadmin@example.com';
    let superAdmin = await prisma.superAdmin.findUnique({
      where: { email: superAdminEmail }
    });

    if (!superAdmin) {
      const hashedPassword = await bcrypt.hash('password123', 12);
      superAdmin = await prisma.superAdmin.create({
        data: {
          email: superAdminEmail,
          name: 'Super Admin',
          password: hashedPassword,
          isActive: true,
          contactNumber: '+1234567890'
        }
      });
      console.log('✅ SuperAdmin created');
    }

    // Create sample tenants
    const tenantData = [
      {
        name: 'Acme Corporation',
        slug: 'acme-corp',
        domain: 'acme.example.com',
        description: 'Leading technology company',
        plan: 'enterprise',
        region: 'US East'
      },
      {
        name: 'TechStart Inc',
        slug: 'techstart',
        domain: 'techstart.example.com',
        description: 'Innovative startup',
        plan: 'pro',
        region: 'US West'
      },
      {
        name: 'Global Solutions',
        slug: 'global-solutions',
        domain: 'global.example.com',
        description: 'International consulting firm',
        plan: 'enterprise',
        region: 'EU West'
      },
      {
        name: 'Local Business',
        slug: 'local-business',
        domain: 'local.example.com',
        description: 'Small local business',
        plan: 'starter',
        region: 'US East'
      },
      {
        name: 'Digital Agency',
        slug: 'digital-agency',
        domain: 'digital.example.com',
        description: 'Creative digital agency',
        plan: 'pro',
        region: 'US West'
      }
    ];

    const tenants = [];
    for (const tenantInfo of tenantData) {
      let tenant = await prisma.tenant.findUnique({
        where: { slug: tenantInfo.slug }
      });

      if (!tenant) {
        tenant = await prisma.tenant.create({
          data: {
            ...tenantInfo,
            isActive: true,
            features: JSON.stringify(['dashboard', 'users', 'analytics']),
            metadata: JSON.stringify({ industry: 'technology' })
          }
        });
        console.log(`✅ Tenant created: ${tenant.name}`);
      }
      tenants.push(tenant);
    }

    // Create sample users for each tenant
    const userData = [
      { name: 'John Doe', email: 'john@example.com', role: 'admin' },
      { name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
      { name: 'Bob Johnson', email: 'bob@example.com', role: 'manager' },
      { name: 'Alice Brown', email: 'alice@example.com', role: 'user' },
      { name: 'Charlie Wilson', email: 'charlie@example.com', role: 'user' }
    ];

    for (const tenant of tenants) {
      for (let i = 0; i < userData.length; i++) {
        const userInfo = userData[i];
        const email = `${userInfo.email.split('@')[0]}+${tenant.slug}@example.com`;
        
        let user = await prisma.user.findFirst({
          where: { 
            email,
            tenantId: tenant.id
          }
        });

        if (!user) {
          const hashedPassword = await bcrypt.hash('password123', 12);
          user = await prisma.user.create({
            data: {
              email,
              name: userInfo.name,
              password: hashedPassword,
              isActive: true,
              tenantId: tenant.id,
              contactNumber: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`
            }
          });
          console.log(`✅ User created: ${user.name} for ${tenant.name}`);
        }
      }
    }

    // Create sample audit logs
    const auditActions = [
      'USER_LOGIN',
      'USER_SIGNUP',
      'TENANT_CREATED',
      'USER_UPDATED',
      'SETTINGS_CHANGED',
      'PASSWORD_RESET',
      'ROLE_ASSIGNED',
      'PERMISSION_GRANTED'
    ];

    for (let i = 0; i < 20; i++) {
      const randomTenant = tenants[Math.floor(Math.random() * tenants.length)];
      const randomAction = auditActions[Math.floor(Math.random() * auditActions.length)];
      const randomDate = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Last 7 days

      await prisma.auditLog.create({
        data: {
          action: randomAction,
          details: JSON.stringify({ 
            description: `Sample audit log for ${randomAction.toLowerCase()}`,
            timestamp: randomDate.toISOString()
          }),
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          createdAt: randomDate,
          tenantId: randomTenant.id,
          superAdminId: superAdmin.id
        }
      });
    }
    console.log('✅ Audit logs created');

    // Create sample roles
    const roleData = [
      { name: 'Admin', description: 'Full access to tenant resources' },
      { name: 'Manager', description: 'Team management capabilities' },
      { name: 'User', description: 'Standard user access' },
      { name: 'Viewer', description: 'Read-only access' }
    ];

    for (const tenant of tenants) {
      for (const roleInfo of roleData) {
        let role = await prisma.role.findFirst({
          where: {
            name: roleInfo.name,
            tenant: {
              id: tenant.id
            }
          }
        });

        if (!role) {
          role = await prisma.role.create({
            data: {
              name: roleInfo.name,
              description: roleInfo.description,
              isActive: true,
              isDefault: roleInfo.name === 'User',
              tenantId: tenant.id
            }
          });
          console.log(`✅ Role created: ${role.name} for ${tenant.name}`);
        }
      }
    }

    console.log('🎉 Dynamic test data added successfully!');
    console.log('\n📊 Dashboard should now show:');
    console.log('- 5 tenants with different plans');
    console.log('- 25 users (5 per tenant)');
    console.log('- 20 audit log entries');
    console.log('- Role distribution data');
    console.log('- Recent activity data');

  } catch (error) {
    console.error('❌ Error adding dynamic data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addDynamicData(); 