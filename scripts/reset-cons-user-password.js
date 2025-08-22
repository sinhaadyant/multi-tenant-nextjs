const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetPassword() {
  const prisma = new PrismaClient();
  
  try {
    const email = 'xocoqypizy@mailinator.com';
    const newPassword = 'password123';
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the user's password
    const user = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log(`✅ Password reset for user: ${user.name} (${user.email})`);
    console.log(`🔑 New password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetPassword();
