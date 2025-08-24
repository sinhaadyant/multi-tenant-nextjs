const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function resetAnilPassword() {
  try {
    console.log('🔧 Resetting password for anil@cc.com...');
    
    // Find the user
    const user = await prisma.user.findFirst({
      where: { email: 'anil@cc.com' },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.log('❌ User anil@cc.com not found');
      return;
    }

    console.log('✅ Found user:', user.name, `(${user.email})`);

    // Hash the new password
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Update the password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    console.log('✅ Password reset successfully');
    console.log('📝 New credentials:');
    console.log('   Email: anil@cc.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetAnilPassword();
