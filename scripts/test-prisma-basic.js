const { PrismaClient } = require('@prisma/client');

async function testPrismaBasic() {
  const prisma = new PrismaClient();

  try {
    console.log('🔍 Testing Basic Prisma Queries');
    console.log('===============================');

    // Test 1: Count users
    console.log('\n1. Testing user count...');
    const userCount = await prisma.user.count();
    console.log('✅ User count:', userCount);

    // Test 2: Find one user
    console.log('\n2. Testing find one user...');
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    console.log('✅ Found user:', user);

    // Test 3: Search users with contains
    console.log('\n3. Testing user search...');
    const searchUsers = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { email: { contains: 'test', mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    console.log('✅ Search results:', searchUsers.length, 'users found');

    // Test 4: Test tenant search
    console.log('\n4. Testing tenant search...');
    const searchTenants = await prisma.tenant.findMany({
      where: {
        OR: [
          { name: { contains: 'test', mode: 'insensitive' } },
          { slug: { contains: 'test', mode: 'insensitive' } },
        ],
      },
      take: 5,
      select: {
        id: true,
        name: true,
        slug: true
      }
    });
    console.log('✅ Tenant search results:', searchTenants.length, 'tenants found');

    console.log('\n🎯 All Prisma tests passed!');

  } catch (error) {
    console.error('❌ Prisma test failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      stack: error.stack
    });
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaBasic();
