import { 
  PrismaLogger, 
  enablePrismaLogging, 
  disablePrismaLogging, 
  isPrismaLoggingEnabled,
  measurePrismaQuery,
  measurePrismaBatch
} from '../src/lib/prismaLogger';
import { prisma } from '../src/lib/prisma';

async function testEnhancedLogging() {
  try {
    console.log('🧪 Testing Enhanced Prisma Logging Features...\n');

    // Test 1: Configuration
    console.log('📝 Test 1: Configuration');
    const config = PrismaLogger.getConfig();
    console.log('Configuration:', config);
    console.log('Logging enabled:', isPrismaLoggingEnabled());
    console.log('');

    // Test 2: Runtime control
    console.log('📝 Test 2: Runtime Control');
    console.log('Disabling logging...');
    disablePrismaLogging();
    console.log('Logging enabled:', isPrismaLoggingEnabled());
    
    console.log('Re-enabling logging...');
    enablePrismaLogging();
    console.log('Logging enabled:', isPrismaLoggingEnabled());
    console.log('');

    // Test 3: Custom logging
    console.log('📝 Test 3: Custom Logging');
    PrismaLogger.info('Custom info message', { test: true, timestamp: new Date().toISOString() });
    PrismaLogger.warn('Custom warning message', { level: 'warning' });
    PrismaLogger.error('Custom error message', { error: 'test error' });
    console.log('');

    // Test 4: Performance timing
    console.log('📝 Test 4: Performance Timing');
    PrismaLogger.time('test-query');
    await prisma.tenant.count();
    PrismaLogger.timeEnd('test-query');
    console.log('');

    // Test 5: Query measurement wrapper
    console.log('📝 Test 5: Query Measurement Wrapper');
    const tenantCount = await measurePrismaQuery(
      'Get tenant count',
      () => prisma.tenant.count(),
      { operation: 'count', table: 'tenants' }
    );
    console.log(`Tenant count: ${tenantCount}`);
    console.log('');

    // Test 6: Batch query measurement
    console.log('📝 Test 6: Batch Query Measurement');
    const batchResults = await measurePrismaBatch(
      'Dashboard data queries',
      [
        {
          name: 'Tenant statistics',
          fn: () => prisma.tenant.groupBy({
            by: ['isActive'],
            _count: { id: true },
          })
        },
        {
          name: 'User statistics',
          fn: () => prisma.user.groupBy({
            by: ['isActive'],
            _count: { id: true },
          })
        },
        {
          name: 'SuperAdmin count',
          fn: () => prisma.superAdmin.count({
            where: { isActive: true }
          })
        }
      ],
      { context: 'dashboard-data' }
    );
    console.log(`Batch results: ${batchResults.length} queries completed`);
    console.log('');

    // Test 7: Connection health check
    console.log('📝 Test 7: Connection Health Check');
    const connectionInfo = await PrismaLogger.getConnectionInfo();
    console.log('Connection info:', connectionInfo);
    console.log('');

    // Test 8: Complex query with detailed logging
    console.log('📝 Test 8: Complex Query with Detailed Logging');
    const complexResult = await measurePrismaQuery(
      'Complex tenant query with includes',
      () => prisma.tenant.findMany({
        take: 3,
        include: {
          _count: {
            select: {
              users: true,
              roles: true,
            },
          },
          users: {
            take: 2,
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      {
        operation: 'findMany',
        table: 'tenants',
        includes: ['users', 'roles'],
        limit: 3,
      }
    );
    console.log(`Complex query returned ${complexResult.length} tenants`);
    console.log('');

    // Test 9: Error handling
    console.log('📝 Test 9: Error Handling');
    try {
      await measurePrismaQuery(
        'Invalid query test',
        () => prisma.$queryRaw`SELECT * FROM non_existent_table`,
        { test: 'error-handling' }
      );
    } catch (error) {
      console.log('Expected error caught and logged');
    }
    console.log('');

    console.log('🎉 Enhanced Prisma Logging Test Completed Successfully!');
    console.log('\n📊 Features tested:');
    console.log('✅ Runtime logging control');
    console.log('✅ Custom logging messages');
    console.log('✅ Performance timing');
    console.log('✅ Query measurement wrapper');
    console.log('✅ Batch query monitoring');
    console.log('✅ Connection health checks');
    console.log('✅ Error handling and logging');
    console.log('✅ Complex query monitoring');

  } catch (error) {
    console.error('❌ Error testing enhanced logging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEnhancedLogging(); 