# Database Scripts

This directory contains various database management scripts for the multi-tenant Next.js application.

## User Data Management Scripts

### Clear Users Data

These scripts allow you to clear all user data while preserving superadmin data.

#### Quick Clear (No Confirmation)
```bash
npm run db:clear-users
```
⚠️ **Warning**: This script will immediately delete all user data without confirmation.

#### Safe Clear (With Confirmation)
```bash
npm run db:clear-users-safe
```
✅ **Recommended**: This script includes multiple confirmation prompts to prevent accidental data loss.

### What Gets Deleted

When running the clear users scripts, the following data will be **permanently deleted**:

- All regular users (from the `users` table)
- All user-related audit logs
- All user-related support tickets
- User-role relationships

### What Gets Preserved

The following data will **NOT be deleted**:

- All superadmin users (from the `super_admins` table)
- Superadmin-related audit logs
- Superadmin-related notifications
- All tenant data
- All role definitions
- All permission definitions
- System settings
- Invite tokens
- System logs

### Safety Features

The safe version (`db:clear-users-safe`) includes:

1. **Statistics Display**: Shows current data counts before deletion
2. **Multiple Confirmations**: Requires three separate confirmations
3. **Transaction Safety**: Uses database transactions to ensure consistency
4. **Verification**: Confirms successful deletion and data preservation
5. **Early Exit**: Cancels operation if no users exist to delete

### Example Output

```
🗑️ Clearing all users data (excluding superadmin)...
⚠️  SAFETY MODE: This script requires confirmation before proceeding.

📊 Getting current statistics...
📈 Current data counts:
   - Users: 25
   - User-related audit logs: 150
   - User-related support tickets: 8
   - SuperAdmins: 3 (will be preserved)

⚠️  WARNING: This will permanently delete all user data except superadmin users.
   This includes:
   - All regular users
   - All user-related audit logs
   - All user-related support tickets
   - User-role relationships

   Superadmin users and their data will be preserved.

❓ Are you sure you want to proceed? (yes/no): yes

📋 Data to be deleted:
   - 25 users
   - 150 user-related audit logs
   - 8 user-related support tickets

❓ Please type "DELETE" to confirm the deletion: DELETE

⚠️  FINAL WARNING: This action cannot be undone. Type "CONFIRM" to proceed: CONFIRM

🗑️ Starting deletion process...
   Deleting user-related audit logs...
   ✅ Deleted 150 audit logs
   Deleting user-related support tickets...
   ✅ Deleted 8 support tickets
   Deleting all users...
   ✅ Deleted 25 users

✅ Deletion completed successfully!
📊 Final statistics:
   - Remaining SuperAdmins: 3
   - Remaining SuperAdmin audit logs: 45
   - Users: 0
   - User-related audit logs: 0
   - User-related support tickets: 0

🎉 All user data has been cleared successfully!
   Superadmin data has been preserved.
```

### Database Schema Reference

The scripts work with the following database structure:

- `users` - Regular tenant users
- `super_admins` - Superadmin users (preserved)
- `audit_logs` - Activity logs (user-related ones deleted)
- `support_tickets` - Support tickets (user-related ones deleted)
- `tenants` - Tenant information (preserved)
- `roles` - Role definitions (preserved)
- `permissions` - Permission definitions (preserved)

### Prerequisites

Before running these scripts, ensure:

1. Database connection is properly configured
2. Prisma client is generated (`npm run db:generate`)
3. You have the necessary permissions to modify the database
4. You have a backup of your data (recommended)

### Error Handling

The scripts include comprehensive error handling:

- Database transaction rollback on errors
- Detailed error messages
- Graceful cleanup of resources
- Proper exit codes for automation

### Automation

For automated deployments or CI/CD pipelines, use the non-interactive version:

```bash
npm run db:clear-users
```

For manual operations, always use the safe version:

```bash
npm run db:clear-users-safe
``` 