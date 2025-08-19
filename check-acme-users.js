const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAcmeUsers() {
  try {
    // Find the acme-corp tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'acme-corp' },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
            createdAt: true
          }
        }
      }
    });

    if (!tenant) {
      console.log('❌ Tenant acme-corp not found');
      return;
    }

    console.log('✅ Tenant found:', {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      userCount: tenant.users.length
    });

    console.log('\n👥 Users in acme-corp:');
    tenant.users.forEach(user => {
      console.log(`  - ${user.email} (${user.name}) - Active: ${user.isActive}`);
    });

    if (tenant.users.length === 0) {
      console.log('\n⚠️ No users found for acme-corp tenant');
      console.log('Creating a test user...');
      
      const newUser = await prisma.user.create({
        data: {
          email: 'admin@acme-corp.com',
          name: 'Admin User',
          password: '$2b$12$RydLBcnDqSYyupv.JgGxSOaHQAq0P7bYQBzk3DrhOv098e1/uSnw.', // admin123
          tenantId: tenant.id,
          isActive: true
        }
      });
      
      console.log('✅ Created test user:', newUser.email);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAcmeUsers();
