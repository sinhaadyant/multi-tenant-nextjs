import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to get user input
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function clearUsersDataSafe() {
  console.log('🗑️ Clearing all users data (excluding superadmin)...');
  console.log('⚠️  SAFETY MODE: This script requires confirmation before proceeding.\n');

  try {
    // Get current statistics first
    console.log('📊 Getting current statistics...');
    
    const userCount = await prisma.user.count();
    const auditLogCount = await prisma.auditLog.count({
      where: {
        userId: {
          not: null
        }
      }
    });
    const supportTicketCount = await prisma.supportTicket.count({
      where: {
        userId: {
          not: null
        }
      }
    });
    const superAdminCount = await prisma.superAdmin.count();

    console.log(`📈 Current data counts:`);
    console.log(`   - Users: ${userCount}`);
    console.log(`   - User-related audit logs: ${auditLogCount}`);
    console.log(`   - User-related support tickets: ${supportTicketCount}`);
    console.log(`   - SuperAdmins: ${superAdminCount} (will be preserved)`);

    if (userCount === 0) {
      console.log('\n✅ No users to delete. Database is already clean.');
      return;
    }

    // First confirmation
    console.log('\n⚠️  WARNING: This will permanently delete all user data except superadmin users.');
    console.log('   This includes:');
    console.log('   - All regular users');
    console.log('   - All user-related audit logs');
    console.log('   - All user-related support tickets');
    console.log('   - User-role relationships');
    console.log('\n   Superadmin users and their data will be preserved.');
    
    const firstConfirm = await question('\n❓ Are you sure you want to proceed? (yes/no): ');
    
    if (firstConfirm.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled by user.');
      return;
    }

    // Second confirmation with data summary
    console.log('\n📋 Data to be deleted:');
    console.log(`   - ${userCount} users`);
    console.log(`   - ${auditLogCount} user-related audit logs`);
    console.log(`   - ${supportTicketCount} user-related support tickets`);
    
    const secondConfirm = await question('\n❓ Please type "DELETE" to confirm the deletion: ');
    
    if (secondConfirm !== 'DELETE') {
      console.log('❌ Operation cancelled. Incorrect confirmation text.');
      return;
    }

    // Final confirmation
    const finalConfirm = await question('\n⚠️  FINAL WARNING: This action cannot be undone. Type "CONFIRM" to proceed: ');
    
    if (finalConfirm !== 'CONFIRM') {
      console.log('❌ Operation cancelled. Final confirmation failed.');
      return;
    }

    console.log('\n🗑️ Starting deletion process...');

    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // 1. Delete user-related audit logs first (due to foreign key constraints)
      console.log('   Deleting user-related audit logs...');
      const deletedAuditLogs = await tx.auditLog.deleteMany({
        where: {
          userId: {
            not: null
          }
        }
      });
      console.log(`   ✅ Deleted ${deletedAuditLogs.count} audit logs`);

      // 2. Delete user-related support tickets
      console.log('   Deleting user-related support tickets...');
      const deletedSupportTickets = await tx.supportTicket.deleteMany({
        where: {
          userId: {
            not: null
          }
        }
      });
      console.log(`   ✅ Deleted ${deletedSupportTickets.count} support tickets`);

      // 3. Delete all users (this will also clear role relationships due to cascade)
      console.log('   Deleting all users...');
      const deletedUsers = await tx.user.deleteMany({});
      console.log(`   ✅ Deleted ${deletedUsers.count} users`);

      // 4. Verify superadmin data is still intact
      const remainingSuperAdmins = await tx.superAdmin.count();
      const superAdminAuditLogs = await tx.auditLog.count({
        where: {
          superAdminId: {
            not: null
          }
        }
      });

      console.log('\n✅ Deletion completed successfully!');
      console.log(`📊 Final statistics:`);
      console.log(`   - Remaining SuperAdmins: ${remainingSuperAdmins}`);
      console.log(`   - Remaining SuperAdmin audit logs: ${superAdminAuditLogs}`);
      console.log(`   - Users: 0`);
      console.log(`   - User-related audit logs: 0`);
      console.log(`   - User-related support tickets: 0`);

      // Verify no users remain
      const remainingUsers = await tx.user.count();
      if (remainingUsers > 0) {
        throw new Error(`Unexpected: ${remainingUsers} users still exist after deletion`);
      }

      console.log('\n🎉 All user data has been cleared successfully!');
      console.log('   Superadmin data has been preserved.');
    });

  } catch (error) {
    console.error('❌ Error clearing users data:', error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  clearUsersDataSafe()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { clearUsersDataSafe }; 