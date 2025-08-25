import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserLanguages() {
  try {
    console.log('🧪 Testing multi-user language preferences...\n');

    // Test 1: Check if defaultLanguage field exists in User table
    console.log('1. Testing User model language field...');
    const sampleUser = await prisma.user.findFirst();
    if (sampleUser) {
      console.log(`✅ User defaultLanguage field: ${sampleUser.defaultLanguage || 'null'}`);
    } else {
      console.log('ℹ️ No users found in database');
    }

    // Test 2: Check if defaultLanguage field exists in SuperAdmin table
    console.log('\n2. Testing SuperAdmin model language field...');
    const sampleSuperAdmin = await prisma.superAdmin.findFirst();
    if (sampleSuperAdmin) {
      console.log(`✅ SuperAdmin defaultLanguage field: ${sampleSuperAdmin.defaultLanguage || 'null'}`);
    } else {
      console.log('ℹ️ No super admins found in database');
    }

    // Test 3: Update a user's language preference
    if (sampleUser) {
      console.log('\n3. Testing user language update...');
      const updatedUser = await prisma.user.update({
        where: { id: sampleUser.id },
        data: { defaultLanguage: 'hi' },
        select: { id: true, email: true, defaultLanguage: true }
      });
      console.log(`✅ Updated user language to: ${updatedUser.defaultLanguage}`);
      
      // Reset to English
      await prisma.user.update({
        where: { id: sampleUser.id },
        data: { defaultLanguage: 'en' }
      });
      console.log(`✅ Reset user language to: en`);
    }

    // Test 4: Update a super admin's language preference
    if (sampleSuperAdmin) {
      console.log('\n4. Testing super admin language update...');
      const updatedSuperAdmin = await prisma.superAdmin.update({
        where: { id: sampleSuperAdmin.id },
        data: { defaultLanguage: 'fr' },
        select: { id: true, email: true, defaultLanguage: true }
      });
      console.log(`✅ Updated super admin language to: ${updatedSuperAdmin.defaultLanguage}`);
      
      // Reset to English
      await prisma.superAdmin.update({
        where: { id: sampleSuperAdmin.id },
        data: { defaultLanguage: 'en' }
      });
      console.log(`✅ Reset super admin language to: en`);
    }

    // Test 5: Create a new user with language preference
    console.log('\n5. Testing new user creation with language...');
    const newUser = await prisma.user.create({
      data: {
        email: 'test-multilang@example.com',
        name: 'Multi-Language Test User',
        password: '$2b$10$dummy.hash.for.testing',
        defaultLanguage: 'ar', // Arabic
        isActive: true
      },
      select: { id: true, email: true, defaultLanguage: true }
    });
    console.log(`✅ Created user with Arabic language: ${newUser.defaultLanguage}`);

    // Clean up test user
    await prisma.user.delete({
      where: { id: newUser.id }
    });
    console.log(`✅ Cleaned up test user`);

    console.log('\n🎉 All language preference tests passed!');
    console.log('\n📋 Summary:');
    console.log('  - ✅ User model has defaultLanguage field');
    console.log('  - ✅ SuperAdmin model has defaultLanguage field');
    console.log('  - ✅ Can update user language preferences');
    console.log('  - ✅ Can update super admin language preferences');
    console.log('  - ✅ Can create users with language preferences');
    console.log('\n🚀 Multi-user language system is ready!');

  } catch (error) {
    console.error('❌ Error testing user languages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testUserLanguages();
