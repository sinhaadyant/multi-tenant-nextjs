#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import { comparePassword } from '../src/lib/jwt';
import bcrypt from 'bcrypt';

async function testPasswordHash() {
  console.log('🔍 Testing password hash...');

  try {
    // Get the user's password hash
    const user = await prisma.user.findFirst({
      where: {
        email: 'admin@techcorp.com',
        tenant: {
          slug: 'techcorp'
        }
      },
      select: {
        password: true
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('Testing password: admin123');
    console.log('Stored hash:', user.password);

    // Test with our comparePassword function
    const isValidWithOurFunction = await comparePassword('admin123', user.password);
    console.log('Our comparePassword function result:', isValidWithOurFunction);

    // Test with bcrypt directly
    const isValidWithBcrypt = await bcrypt.compare('admin123', user.password);
    console.log('Bcrypt compare result:', isValidWithBcrypt);

    // Test with wrong password
    const isWrongPasswordValid = await comparePassword('wrongpassword', user.password);
    console.log('Wrong password test:', isWrongPasswordValid);

    // Generate a new hash for comparison
    const newHash = await bcrypt.hash('admin123', 12);
    console.log('New hash for admin123:', newHash);
    
    const isNewHashValid = await comparePassword('admin123', newHash);
    console.log('New hash test result:', isNewHashValid);

  } catch (error) {
    console.error('❌ Error testing password hash:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswordHash(); 