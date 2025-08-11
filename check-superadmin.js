const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSuperAdmin() {
  try {
    console.log('🔍 Checking SuperAdmin in database...');
    
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { email: 'admin@superadmin.com' }
    });
    
    if (superAdmin) {
      console.log('✅ SuperAdmin found:');
      console.log('  - ID:', superAdmin.id);
      console.log('  - Email:', superAdmin.email);
      console.log('  - Name:', superAdmin.name);
      console.log('  - Is Active:', superAdmin.isActive);
      console.log('  - Created At:', superAdmin.createdAt);
      console.log('  - Updated At:', superAdmin.updatedAt);
    } else {
      console.log('❌ SuperAdmin not found');
      
      // List all superadmins
      const allSuperAdmins = await prisma.superAdmin.findMany();
      console.log('📋 All SuperAdmins in database:');
      allSuperAdmins.forEach(admin => {
        console.log(`  - ${admin.email} (${admin.name}) - Active: ${admin.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking SuperAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdmin(); 