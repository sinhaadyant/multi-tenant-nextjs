import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearUsersData() {
  console.log('🗑️ Clearing all users data (excluding superadmin)...');

  try {
    // Start a transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      console.log('📊 Getting current statistics...');
      
      // Get counts before deletion
      const userCount = await tx.user.count();
      const auditLogCount = await tx.auditLog.count({
        where: {
          userId: {
            not: null
          }
        }
      });
      const supportTicketCount = await tx.supportTicket.count({
        where: {
          userId: {
            not: null
          }
        }
      });
      const superAdminCount = await tx.superAdmin.count();

      console.log(`📈 Current data counts:`);
      console.log(`   - Users: ${userCount}`);
      console.log(`   - User-related audit logs: ${auditLogCount}`);
      console.log(`   - User-related support tickets: ${supportTicketCount}`);
      console.log(`   - SuperAdmins: ${superAdminCount} (will be preserved)`);

      // Confirm with user
      console.log('\n⚠️  WARNING: This will permanently delete all user data except superadmin users.');
      console.log('   This includes:');
      console.log('   - All regular users');
      console.log('   - All user-related audit logs');
      console.log('   - All user-related support tickets');
      console.log('   - User-role relationships');
      console.log('\n   Superadmin users and their data will be preserved.');
      
      // In a real scenario, you might want to add a confirmation prompt here
      // For now, we'll proceed with the deletion

      console.log('\n🗑️ Starting deletion process...');

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
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  clearUsersData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

export { clearUsersData }; 