import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    console.log('🔍 Creating superadmin user...');
    
    // Check if superadmin already exists
    const existingSuperAdmin = await prisma.superAdmin.findFirst({
      where: { email: 'admin@superadmin.com' }
    });
    
    if (existingSuperAdmin) {
      console.log('✅ Superadmin already exists:', existingSuperAdmin.email);
      return existingSuperAdmin;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create superadmin
    const superAdmin = await prisma.superAdmin.create({
      data: {
        email: 'admin@superadmin.com',
        name: 'Super Admin',
        password: hashedPassword,
        isActive: true,
        contactNumber: '+1234567890'
      }
    });
    
    console.log('✅ Superadmin created successfully:', superAdmin.email);
    console.log('📋 Login credentials:');
    console.log('   Email: admin@superadmin.com');
    console.log('   Password: admin123');
    
    return superAdmin;
    
  } catch (error) {
    console.error('❌ Error creating superadmin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('✅ Superadmin creation completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Superadmin creation failed:', error);
    process.exit(1);
  }); 