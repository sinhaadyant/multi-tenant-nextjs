const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // Find the acme-corp tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'acme-corp' }
    });

    if (!tenant) {
      console.log('❌ Tenant acme-corp not found');
      return;
    }

    // Create a test user with known password
    const password = 'test123';
    const hashedPassword = await bcrypt.hash(password, 12);

    const testUser = await prisma.user.create({
      data: {
        email: 'test@acme-corp.com',
        name: 'Test User',
        password: hashedPassword,
        tenantId: tenant.id,
        isActive: true
      }
    });

    console.log('✅ Created test user:', {
      id: testUser.id,
      email: testUser.email,
      name: testUser.name,
      password: password, // This is the plain text password for testing
      tenant: tenant.name
    });

    console.log('\n🔑 Login credentials:');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${password}`);
    console.log(`Tenant: acme-corp`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
