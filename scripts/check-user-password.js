/**
 * Script to check and reset user password for testing
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function checkAndResetUserPassword() {
  try {
    console.log('🔍 Checking user password for zehiboboko@mailinator.com...\n');

    // Find the user
    const user = await prisma.user.findFirst({
      where: {
        email: 'zehiboboko@mailinator.com'
      },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isActive: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found: zehiboboko@mailinator.com');
      return;
    }

    console.log('✅ User found:');
    console.log(`  - Name: ${user.name}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Tenant: ${user.tenant?.name} (${user.tenant?.slug})`);
    console.log(`  - Active: ${user.isActive}`);
    console.log(`  - Has Password: ${!!user.password}`);

    // Reset password to a known value for testing
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('\n✅ Password reset successfully!');
    console.log(`  - New Password: ${newPassword}`);
    console.log(`  - Use this password for testing`);

  } catch (error) {
    console.error('❌ Error checking/resetting user password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkAndResetUserPassword();
