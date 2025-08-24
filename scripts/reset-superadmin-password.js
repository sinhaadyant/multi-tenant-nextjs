const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function resetSuperAdminPassword() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Resetting superadmin password...');
    
    const email = 'sinhaadyant74@gmail.com';
    const newPassword = 'password123';
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update the superadmin password
    const updatedAdmin = await prisma.superAdmin.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ Superadmin password reset successfully');
    console.log(`   Email: ${updatedAdmin.email}`);
    console.log(`   New password: ${newPassword}`);
    console.log(`   Active: ${updatedAdmin.isActive ? 'Yes' : 'No'}`);
    
  } catch (error) {
    console.error('❌ Error resetting superadmin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetSuperAdminPassword();
