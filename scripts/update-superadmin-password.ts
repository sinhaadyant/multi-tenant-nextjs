import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/jwt';

async function updateSuperAdminPassword() {
  try {
    console.log('🔐 Updating SuperAdmin password...');
    
    const email = 'admin@superadmin.com';
    const newPassword = 'Admin123!';
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the SuperAdmin password
    const updatedSuperAdmin = await prisma.superAdmin.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ SuperAdmin password updated successfully!');
    console.log(`📧 Email: ${updatedSuperAdmin.email}`);
    console.log(`🔑 New password: ${newPassword}`);
    
  } catch (error) {
    console.error('❌ Error updating SuperAdmin password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

updateSuperAdminPassword(); 