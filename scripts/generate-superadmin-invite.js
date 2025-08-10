#!/usr/bin/env node

/**
 * Generate SuperAdmin Invite Link Script
 * 
 * This script generates a SuperAdmin invite link with a 24-hour expiration
 * Usage: node scripts/generate-superadmin-invite.js <email>
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function generateSuperAdminInvite(email) {
  try {
    console.log('🎫 Generating SuperAdmin invite link...\n');

    // Validate email
    if (!email) {
      console.error('❌ Error: Email is required');
      console.log('Usage: node scripts/generate-superadmin-invite.js <email>');
      process.exit(1);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Error: Invalid email format');
      process.exit(1);
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if SuperAdmin already exists
    const existingSuperAdmin = await prisma.superAdmin.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingSuperAdmin) {
      console.error('❌ Error: SuperAdmin account already exists for this email');
      process.exit(1);
    }

    // Check if there's already an unused invite token
    const existingToken = await prisma.inviteToken.findFirst({
      where: {
        email: normalizedEmail,
        type: 'superadmin',
        isUsed: false,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (existingToken) {
      console.log('⚠️  Warning: An active invite token already exists for this email');
      console.log(`   Token: ${existingToken.token}`);
      console.log(`   Expires: ${existingToken.expiresAt.toISOString()}`);
      
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteLink = `${baseUrl}/superadmin/signup?token=${existingToken.token}&email=${encodeURIComponent(normalizedEmail)}`;
      
      console.log(`   Invite Link: ${inviteLink}\n`);
      return;
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Calculate expiration date (24 hours from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 1);

    // Create invite token
    const inviteToken = await prisma.inviteToken.create({
      data: {
        email: normalizedEmail,
        token,
        type: 'superadmin',
        expiresAt,
        // Note: createdBy is null for CLI-generated tokens
      }
    });

    // Generate invite link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/superadmin/signup?token=${token}&email=${encodeURIComponent(normalizedEmail)}`;

    console.log('✅ SuperAdmin invite link generated successfully!\n');
    console.log('📧 Email:', normalizedEmail);
    console.log('🔗 Token:', token);
    console.log('⏰ Expires:', expiresAt.toISOString());
    console.log('🔗 Invite Link:', inviteLink);
    console.log('\n📋 Copy the invite link above and share it with the SuperAdmin user.');
    console.log('⚠️  The link will expire in 24 hours.');

  } catch (error) {
    console.error('❌ Error generating invite link:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Get email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Email is required');
  console.log('Usage: node scripts/generate-superadmin-invite.js <email>');
  console.log('Example: node scripts/generate-superadmin-invite.js admin@example.com');
  process.exit(1);
}

generateSuperAdminInvite(email); 