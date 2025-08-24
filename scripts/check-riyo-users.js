const { PrismaClient } = require('@prisma/client');

async function checkRiyoUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Riyo tenant users...');
    
    const users = await prisma.user.findMany({
      where: {
        tenant: {
          slug: 'riyo'
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });
    
    console.log('✅ Riyo users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Active: ${user.isActive}`);
    });
    
    // Also check the tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: 'riyo' },
      select: { id: true, name: true, slug: true }
    });
    
    console.log('\n🏢 Tenant info:', tenant);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRiyoUsers();
