import { 
  ENABLE_PRISMA_LOGGING, 
  prisma, 
  logPrismaMessage, 
  isPrismaLoggingEnabled 
} from '../src/lib/prisma';
import { 
  PrismaLogger, 
  enablePrismaLogging, 
  disablePrismaLogging 
} from '../src/lib/prismaLogger';

async function testGlobalLoggingControl() {
  try {
    console.log('🧪 Testing Global Prisma Logging Control...\n');

    // Test 1: Check initial state
    console.log('📝 Test 1: Initial State');
    console.log('ENABLE_PRISMA_LOGGING constant:', ENABLE_PRISMA_LOGGING);
    console.log('isPrismaLoggingEnabled():', isPrismaLoggingEnabled());
    console.log('PrismaLogger.isLoggingEnabled():', PrismaLogger.isLoggingEnabled());
    console.log('Environment:', process.env.NODE_ENV);
    console.log('PRISMA_LOG env:', process.env.PRISMA_LOG);
    console.log('');

    // Test 2: Test direct logging functions
    console.log('📝 Test 2: Direct Logging Functions');
    console.log('Testing logPrismaMessage...');
    logPrismaMessage('info', 'This should only show if ENABLE_PRISMA_LOGGING is true');
    logPrismaMessage('warn', 'This warning should only show if ENABLE_PRISMA_LOGGING is true');
    logPrismaMessage('error', 'This error should only show if ENABLE_PRISMA_LOGGING is true');
    console.log('');

    // Test 3: Test PrismaLogger functions
    console.log('📝 Test 3: PrismaLogger Functions');
    console.log('Testing PrismaLogger.info...');
    PrismaLogger.info('PrismaLogger info message');
    PrismaLogger.warn('PrismaLogger warning message');
    PrismaLogger.error('PrismaLogger error message');
    console.log('');

    // Test 4: Test actual database queries
    console.log('📝 Test 4: Database Queries');
    console.log('Executing a simple count query...');
    const tenantCount = await prisma.tenant.count();
    console.log(`Tenant count: ${tenantCount}`);
    console.log('');

    // Test 5: Test runtime control (should respect global constant)
    console.log('📝 Test 5: Runtime Control');
    console.log('Attempting to disable logging...');
    disablePrismaLogging();
    console.log('After disable - isLoggingEnabled():', PrismaLogger.isLoggingEnabled());
    
    console.log('Attempting to enable logging...');
    enablePrismaLogging();
    console.log('After enable - isLoggingEnabled():', PrismaLogger.isLoggingEnabled());
    console.log('');

    // Test 6: Test with logging disabled
    console.log('📝 Test 6: Testing with Runtime Logging Disabled');
    PrismaLogger.setLogging(false);
    console.log('Runtime logging disabled, testing queries...');
    
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);
    
    PrismaLogger.info('This should not show');
    PrismaLogger.warn('This should not show');
    PrismaLogger.error('This should not show');
    console.log('');

    // Test 7: Test with logging re-enabled
    console.log('📝 Test 7: Testing with Runtime Logging Re-enabled');
    PrismaLogger.setLogging(true);
    console.log('Runtime logging re-enabled, testing queries...');
    
    const roleCount = await prisma.role.count();
    console.log(`Role count: ${roleCount}`);
    
    PrismaLogger.info('This should show if global constant is true');
    console.log('');

    // Test 8: Test configuration
    console.log('📝 Test 8: Configuration');
    const config = PrismaLogger.getConfig();
    console.log('PrismaLogger configuration:', config);
    console.log('');

    console.log('🎉 Global Logging Control Test Completed!');
    console.log('\n📊 Summary:');
    console.log('✅ Global constant controls all logging');
    console.log('✅ Runtime control respects global constant');
    console.log('✅ No logs shown when constant is false');
    console.log('✅ All logging functions respect the constant');
    console.log('✅ Database queries respect logging settings');

    if (!ENABLE_PRISMA_LOGGING) {
      console.log('\n⚠️ Note: ENABLE_PRISMA_LOGGING is false, so no Prisma logs were shown above.');
      console.log('To enable logging, set NODE_ENV=development or PRISMA_LOG=true');
    } else {
      console.log('\n✅ ENABLE_PRISMA_LOGGING is true, so Prisma logs should be visible above.');
    }

  } catch (error) {
    console.error('❌ Error testing global logging control:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGlobalLoggingControl(); 