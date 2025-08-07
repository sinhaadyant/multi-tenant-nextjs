import { seedDatabase } from '../src/lib/seed';

async function main() {
  try {
    console.log('🌱 Starting database seeding...');
    await seedDatabase();
    console.log('✅ Database seeding completed!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

main(); 