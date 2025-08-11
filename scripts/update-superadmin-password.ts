import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/jwt';
import * as readline from 'readline';

async function promptForPassword(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Enter new password for admin@superadmin.com: ', (password) => {
      rl.close();
      resolve(password);
    });
  });
}

async function updateSuperAdminPassword() {
  try {
    console.log('🔐 Updating SuperAdmin password...');
    
    const email = 'admin@superadmin.com';
    
    // Get new password from command line argument or prompt
    let newPassword = process.argv[2];
    
    if (!newPassword) {
      console.log('No password provided as argument. Please enter the new password:');
      newPassword = await promptForPassword();
    }
    
    if (!newPassword || newPassword.trim() === '') {
      console.error('❌ Password cannot be empty');
      process.exit(1);
    }
    
    // Validate password strength (optional)
    if (newPassword.length < 6) {
      console.warn('⚠️  Warning: Password is less than 6 characters long');
    }
    
    console.log(`📧 Updating password for: ${email}`);
    console.log(`🔑 New password: ${newPassword}`);
    
    // Hash the new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update the SuperAdmin password
    const updatedSuperAdmin = await prisma.superAdmin.update({
      where: { email },
      data: { password: hashedPassword }
    });
    
    console.log('✅ SuperAdmin password updated successfully!');
    console.log(`📧 Email: ${updatedSuperAdmin.email}`);
    console.log(`🕒 Updated at: ${updatedSuperAdmin.updatedAt}`);
    
    // Test the new password
    console.log('\n🧪 Testing new password...');
    const testLogin = await prisma.superAdmin.findUnique({
      where: { email }
    });
    
    if (testLogin) {
      console.log('✅ Password update verified - user account is accessible');
    }
    
  } catch (error) {
    console.error('❌ Error updating SuperAdmin password:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Show usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🔐 SuperAdmin Password Update Script

Usage:
  npm run ts-node scripts/update-superadmin-password.ts [new_password]

Examples:
  npm run ts-node scripts/update-superadmin-password.ts MyNewPassword123!
  npm run ts-node scripts/update-superadmin-password.ts
  
If no password is provided as argument, you will be prompted to enter one.

Security Notes:
- Password will be hashed using bcrypt
- Minimum 6 characters recommended
- Use strong passwords with letters, numbers, and special characters
`);
  process.exit(0);
}

updateSuperAdminPassword(); 