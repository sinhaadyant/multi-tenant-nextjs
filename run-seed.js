const { seedDatabase } = require('./src/lib/seed.ts');

async function runSeed() {
  try {
    console.log('🌱 Starting database seeding...');
    await seedDatabase();
    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  }
}

runSeed();
