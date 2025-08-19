const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkAdminPassword() {
  try {
    // Find the admin user
    const user = await prisma.user.findFirst({
      where: { 
        email: 'admin@acme-corp.com',
        tenant: {
          slug: 'acme-corp'
        }
      },
      include: {
        tenant: true
      }
    });

    if (!user) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log('✅ Admin user found:', {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      tenant: user.tenant.name
    });

    console.log('\n🔐 Password hash:', user.password);

    // Test common passwords
    const testPasswords = [
      'admin123',
      'password',
      '123456',
      'admin',
      'test',
      'acme123',
      'acme-corp',
      'admin@acme-corp.com'
    ];

    console.log('\n🧪 Testing passwords:');
    for (const password of testPasswords) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`  ${isValid ? '✅' : '❌'} "${password}"`);
      if (isValid) {
        console.log(`  🎉 Found correct password: "${password}"`);
        break;
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminPassword();
