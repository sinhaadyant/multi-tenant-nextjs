const { PrismaClient } = require('@prisma/client');

console.log('🗄️ Testing Database Connection...\n');

async function testDatabase() {
  try {
    console.log('✅ Creating Prisma client...');
    const prisma = new PrismaClient();

    console.log('✅ Connecting to database...');
    await prisma.$connect();
    console.log('Database connection successful!');

    console.log('✅ Testing basic query...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Query result:', result);

    console.log('✅ Disconnecting from database...');
    await prisma.$disconnect();
    console.log('Database disconnected successfully!');

    console.log('\n🎉 Database tests completed successfully!');
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n💡 To fix database issues:');
    console.log('1. Ensure MySQL is running');
    console.log('2. Check database credentials in .env file');
    console.log('3. Run: npx prisma migrate reset --force');
  }
}

testDatabase();
