const { PrismaClient } = require('@prisma/client');

async function checkSuperAdminAccounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking superadmin accounts...');
    
    const superadmins = await prisma.superAdmin.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true
      }
    });
    
    console.log(`✅ Found ${superadmins.length} superadmin accounts:`);
    
    superadmins.forEach((admin, index) => {
      console.log(`${index + 1}. ${admin.name} (${admin.email}) - ${admin.isActive ? 'Active' : 'Inactive'}`);
    });
    
    if (superadmins.length === 0) {
      console.log('⚠️ No superadmin accounts found. You may need to create one.');
    }
    
  } catch (error) {
    console.error('❌ Error checking superadmin accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSuperAdminAccounts();
