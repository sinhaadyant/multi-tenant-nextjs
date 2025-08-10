import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { requireSuperAdmin } from '@/middleware/auth';
import { z } from 'zod';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

// Validation schemas
const importSchema = z.object({
  importTenants: z.boolean().default(true),
  importUsers: z.boolean().default(true),
  importNotifications: z.boolean().default(false),
  importSupportTickets: z.boolean().default(false),
  importSystemSettings: z.boolean().default(false),
  skipDuplicates: z.boolean().default(true),
  validateData: z.boolean().default(true)
});

// POST /api/superadmin/import - Import data from SQL file
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📥 Starting data import');
  }

  // Authenticate SuperAdmin
  const authResult = await requireSuperAdmin(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const superAdmin = authResult as any;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const optionsString = formData.get('options') as string;

    if (!file) {
      return createErrorResponse('No file provided', 400);
    }

    // Validate file type
    if (!file.name.endsWith('.sql')) {
      return createErrorResponse('Only SQL files are supported', 400);
    }

    // Parse import options
    let importOptions;
    try {
      const parsedOptions = JSON.parse(optionsString);
      importOptions = importSchema.parse(parsedOptions);
    } catch (error) {
      return createErrorResponse('Invalid import options', 400);
    }

    // Save uploaded file temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tempFilePath = path.join(process.cwd(), 'temp', `import_${Date.now()}.sql`);
    
    // Ensure temp directory exists
    const tempDir = path.dirname(tempFilePath);
    await writeFile(tempFilePath, buffer);

    if (process.env.NODE_ENV === 'development') {
      console.log('📁 File saved temporarily:', tempFilePath);
      console.log('⚙️ Import options:', importOptions);
    }

    // Read and parse SQL file
    const sqlContent = buffer.toString('utf-8');
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let importedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process SQL statements
    for (const statement of sqlStatements) {
      try {
        if (statement.toLowerCase().includes('insert into')) {
          // Extract table name
          const tableMatch = statement.match(/insert into (\w+)/i);
          if (tableMatch) {
            const tableName = tableMatch[1];

            // Check if we should import this table based on options
            let shouldImport = false;
            switch (tableName) {
              case 'tenants':
                shouldImport = importOptions.importTenants;
                break;
              case 'users':
                shouldImport = importOptions.importUsers;
                break;
              case 'notifications':
                shouldImport = importOptions.importNotifications;
                break;
              case 'support_tickets':
              case 'support_ticket_comments':
              case 'support_ticket_attachments':
                shouldImport = importOptions.importSupportTickets;
                break;
              case 'system_settings':
                shouldImport = importOptions.importSystemSettings;
                break;
              default:
                shouldImport = true; // Import other tables by default
            }

            if (shouldImport) {
              // Execute the SQL statement
              await prisma.$executeRawUnsafe(statement);
              importedCount++;
            } else {
              skippedCount++;
            }
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Error executing SQL statement:', error);
          console.error('Statement:', statement);
        }
        errorCount++;
      }
    }

    // Clean up temporary file
    try {
      await unlink(tempFilePath);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Could not delete temporary file:', error);
      }
    }

    // Log the import action
    await prisma.auditLog.create({
      data: {
        action: 'import_data',
        details: `Data import completed: ${importedCount} records imported, ${skippedCount} skipped, ${errorCount} errors. File: ${file.name}`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        superAdminId: superAdmin.id,
        createdAt: new Date()
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Data import completed successfully');
      console.log(`📊 Import stats: ${importedCount} imported, ${skippedCount} skipped, ${errorCount} errors`);
    }

    return createSuccessResponse({
      message: 'Data imported successfully',
      stats: {
        imported: importedCount,
        skipped: skippedCount,
        errors: errorCount,
        total: importedCount + skippedCount + errorCount
      }
    }, 'Import completed successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error during data import:', error);
    }
    throw error;
  }
}); 