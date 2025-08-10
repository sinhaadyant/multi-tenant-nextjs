import { prisma, ENABLE_PRISMA_LOGGING, logPrismaMessage, getPrismaLoggingStatus } from '../src/lib/prisma';

async function testPrismaLogging() {
  try {
    console.log('🧪 Testing Prisma Query Logging...');
    console.log('📊 Logging Status:', getPrismaLoggingStatus());
    console.log('🔧 Environment:', process.env.NODE_ENV);
    console.log('🔧 PRISMA_LOG:', process.env.PRISMA_LOG);
    
    if (!ENABLE_PRISMA_LOGGING) {
      console.log('⚠️ Prisma logging is disabled. Set NODE_ENV=development or PRISMA_LOG=true to enable.');
      return;
    }

    console.log('\n🔍 Starting Prisma query tests...\n');

    // Test 1: Simple count query
    console.log('📝 Test 1: Counting tenants...');
    const tenantCount = await prisma.tenant.count();
    console.log(`✅ Tenant count: ${tenantCount}\n`);

    // Test 2: Complex query with joins
    console.log('📝 Test 2: Complex query with user count...');
    const tenantsWithUsers = await prisma.tenant.findMany({
      take: 3,
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
    console.log(`✅ Found ${tenantsWithUsers.length} tenants with user counts\n`);

    // Test 3: Group by query
    console.log('📝 Test 3: Group by query for role distribution...');
    const roleDistribution = await prisma.role.groupBy({
      by: ['name'],
      _count: {
        id: true,
      },
    });
    console.log(`✅ Role distribution: ${roleDistribution.length} roles\n`);

    // Test 4: Recent activity query
    console.log('📝 Test 4: Recent activity with includes...');
    const recentActivity = await prisma.auditLog.findMany({
      take: 5,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        tenant: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });
    console.log(`✅ Recent activity: ${recentActivity.length} logs\n`);

    // Test 5: Custom logging
    console.log('📝 Test 5: Custom logging...');
    logPrismaMessage('info', 'Custom info message from test script');
    logPrismaMessage('warn', 'Custom warning message from test script');
    logPrismaMessage('error', 'Custom error message from test script', { test: true });

    console.log('\n🎉 Prisma logging test completed successfully!');
    console.log('📊 You should see detailed query logs above with:');
    console.log('   - Query SQL statements');
    console.log('   - Query parameters');
    console.log('   - Query execution time');
    console.log('   - Target database');

  } catch (error) {
    console.error('❌ Error testing Prisma logging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaLogging(); 