const { PrismaClient } = require('@prisma/client');

async function checkUserAccounts() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking user accounts...');
    
    // Check for anil@cc.com specifically
    const targetUser = await prisma.user.findFirst({
      where: {
        email: 'anil@cc.com'
      },
      include: {
        tenant: true
      }
    });
    
    if (targetUser) {
      console.log('✅ Found target user:');
      console.log(`   Name: ${targetUser.name}`);
      console.log(`   Email: ${targetUser.email}`);
      console.log(`   ID: ${targetUser.id}`);
      console.log(`   Tenant: ${targetUser.tenant?.name} (${targetUser.tenant?.slug})`);
      console.log(`   Active: ${targetUser.isActive ? 'Yes' : 'No'}`);
    } else {
      console.log('❌ User anil@cc.com not found');
      
      // List all users
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          tenant: {
            select: {
              name: true,
              slug: true
            }
          }
        },
        take: 10
      });
      
      console.log('\n📋 Available users (first 10):');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.tenant?.name || 'No tenant'} - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking user accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserAccounts();
