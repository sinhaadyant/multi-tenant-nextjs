#!/usr/bin/env tsx

import { prisma } from '../src/lib/prisma';
import { comparePassword } from '../src/lib/jwt';
import bcrypt from 'bcrypt';

async function testAdminPassword() {
  console.log('🔍 Testing admin password...');

  try {
    // Get the admin user's password hash
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
      console.log('❌ Admin user not found');
      return;
    }

    console.log('Stored hash:', user.password);

    // Test different passwords
    const passwordsToTest = [
      'admin123',
      'password123',
      'Password123',
      'PASSWORD123',
      'admin',
      'password',
      '123456',
      'admin@techcorp.com',
      'techcorp',
      'TechCorp'
    ];

    for (const password of passwordsToTest) {
      const isValid = await bcrypt.compare(password, user.password);
      console.log(`Password "${password}": ${isValid ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.error('❌ Error testing admin password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAdminPassword(); 