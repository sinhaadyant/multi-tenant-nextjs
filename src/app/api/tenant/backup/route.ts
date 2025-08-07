import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// Validation schemas
const backupSchema = z.object({
  excludeAuditLogs: z.boolean().default(false)
});

// POST /api/tenant/backup - Generate and download database backup
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Generating database backup');
  }

  // Authenticate Tenant
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const tenant = authResult as any;
  const body = await req.json();

  // Validate request body
  const validatedData = backupSchema.parse(body);
  const { excludeAuditLogs } = validatedData;

  try {
    // Get tenant data for backup
    const tenantData = await prisma.tenant.findUnique({
      where: { id: tenant.id },
      include: {
        users: true,
        supportTickets: {
          include: {
            comments: true,
            attachments: true
          }
        },
        notifications: {
          where: { targetTenantId: tenant.id }
        },
        auditLogs: excludeAuditLogs ? undefined : true
      }
    });

    if (!tenantData) {
      return createErrorResponse('Tenant not found', 404);
    }

    // Create backup directory if it doesn't exist
    const backupDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Generate backup filename
    const timestamp = new Date().toISOString().split('T')[0];
    const backupFileName = `tenant_backup_${tenant.slug}_${timestamp}.sql`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Generate SQL backup content
    let sqlContent = `-- Database Backup for Tenant: ${tenant.name} (${tenant.slug})\n`;
    sqlContent += `-- Generated on: ${new Date().toISOString()}\n`;
    sqlContent += `-- Exclude Audit Logs: ${excludeAuditLogs}\n\n`;

    // Add tenant data
    sqlContent += `-- Tenant Data\n`;
    sqlContent += `INSERT INTO tenants (id, name, slug, domain, description, isActive, plan, region, features, createdAt, updatedAt, metadata) VALUES `;
    sqlContent += `('${tenantData.id}', '${tenantData.name.replace(/'/g, "''")}', '${tenantData.slug}', `;
    sqlContent += `${tenantData.domain ? `'${tenantData.domain.replace(/'/g, "''")}'` : 'NULL'}, `;
    sqlContent += `${tenantData.description ? `'${tenantData.description.replace(/'/g, "''")}'` : 'NULL'}, `;
    sqlContent += `${tenantData.isActive ? 1 : 0}, '${tenantData.plan}', '${tenantData.region}', `;
    sqlContent += `'${tenantData.features.replace(/'/g, "''")}', '${tenantData.createdAt.toISOString()}', `;
    sqlContent += `'${tenantData.updatedAt.toISOString()}', `;
    sqlContent += `${tenantData.metadata ? `'${tenantData.metadata.replace(/'/g, "''")}'` : 'NULL'});\n\n`;

    // Add users data
    if (tenantData.users.length > 0) {
      sqlContent += `-- Users Data\n`;
      sqlContent += `INSERT INTO users (id, email, name, password, isActive, lastLogin, createdAt, updatedAt, tenantId, roleId, contactNumber) VALUES\n`;
      const userValues = tenantData.users.map(user => {
        return `('${user.id}', '${user.email.replace(/'/g, "''")}', '${user.name.replace(/'/g, "''")}', `;
        return `${user.password.replace(/'/g, "''")}', ${user.isActive ? 1 : 0}, `;
        return `${user.lastLogin ? `'${user.lastLogin.toISOString()}'` : 'NULL'}, `;
        return `'${user.createdAt.toISOString()}', '${user.updatedAt.toISOString()}', `;
        return `'${user.tenantId}', ${user.roleId ? `'${user.roleId}'` : 'NULL'}, `;
        return `${user.contactNumber ? `'${user.contactNumber.replace(/'/g, "''")}'` : 'NULL'})`;
      }).join(',\n');
      sqlContent += userValues + ';\n\n';
    }

    // Add support tickets data
    if (tenantData.supportTickets.length > 0) {
      sqlContent += `-- Support Tickets Data\n`;
      sqlContent += `INSERT INTO support_tickets (id, title, description, category, status, priority, isForwarded, createdAt, updatedAt, tenantId, userId) VALUES\n`;
      const ticketValues = tenantData.supportTickets.map(ticket => {
        return `('${ticket.id}', '${ticket.title.replace(/'/g, "''")}', '${ticket.description.replace(/'/g, "''")}', `;
        return `'${ticket.category}', '${ticket.status}', '${ticket.priority}', ${ticket.isForwarded ? 1 : 0}, `;
        return `'${ticket.createdAt.toISOString()}', '${ticket.updatedAt.toISOString()}', `;
        return `'${ticket.tenantId}', ${ticket.userId ? `'${ticket.userId}'` : 'NULL'})`;
      }).join(',\n');
      sqlContent += ticketValues + ';\n\n';

      // Add ticket comments
      const allComments = tenantData.supportTickets.flatMap(ticket => ticket.comments);
      if (allComments.length > 0) {
        sqlContent += `-- Support Ticket Comments Data\n`;
        sqlContent += `INSERT INTO support_ticket_comments (id, text, createdAt, updatedAt, ticketId, commentedBy, commenterType) VALUES\n`;
        const commentValues = allComments.map(comment => {
          return `('${comment.id}', '${comment.text.replace(/'/g, "''")}', `;
          return `'${comment.createdAt.toISOString()}', '${comment.updatedAt.toISOString()}', `;
          return `'${comment.ticketId}', '${comment.commentedBy}', '${comment.commenterType}')`;
        }).join(',\n');
        sqlContent += commentValues + ';\n\n';
      }

      // Add ticket attachments
      const allAttachments = tenantData.supportTickets.flatMap(ticket => ticket.attachments);
      if (allAttachments.length > 0) {
        sqlContent += `-- Support Ticket Attachments Data\n`;
        sqlContent += `INSERT INTO support_ticket_attachments (id, filename, originalName, mimeType, size, path, createdAt, ticketId) VALUES\n`;
        const attachmentValues = allAttachments.map(attachment => {
          return `('${attachment.id}', '${attachment.filename.replace(/'/g, "''")}', `;
          return `'${attachment.originalName.replace(/'/g, "''")}', '${attachment.mimeType}', `;
          return `${attachment.size}, '${attachment.path.replace(/'/g, "''")}', `;
          return `'${attachment.createdAt.toISOString()}', '${attachment.ticketId}')`;
        }).join(',\n');
        sqlContent += attachmentValues + ';\n\n';
      }
    }

    // Add notifications data
    if (tenantData.notifications.length > 0) {
      sqlContent += `-- Notifications Data\n`;
      sqlContent += `INSERT INTO notifications (id, title, message, isRead, isActive, createdAt, updatedAt, createdBy, priority, targetTenantId, targetType) VALUES\n`;
      const notificationValues = tenantData.notifications.map(notification => {
        return `('${notification.id}', '${notification.title.replace(/'/g, "''")}', `;
        return `'${notification.message.replace(/'/g, "''")}', ${notification.isRead ? 1 : 0}, `;
        return `${notification.isActive ? 1 : 0}, '${notification.createdAt.toISOString()}', `;
        return `'${notification.updatedAt.toISOString()}', ${notification.createdBy ? `'${notification.createdBy}'` : 'NULL'}, `;
        return `'${notification.priority}', '${notification.targetTenantId}', '${notification.targetType}')`;
      }).join(',\n');
      sqlContent += notificationValues + ';\n\n';
    }

    // Add audit logs data (if not excluded)
    if (!excludeAuditLogs && tenantData.auditLogs && tenantData.auditLogs.length > 0) {
      sqlContent += `-- Audit Logs Data\n`;
      sqlContent += `INSERT INTO audit_logs (id, action, details, ipAddress, userAgent, createdAt, tenantId, userId, superAdminId) VALUES\n`;
      const auditValues = tenantData.auditLogs.map(log => {
        return `('${log.id}', '${log.action.replace(/'/g, "''")}', `;
        return `${log.details ? `'${log.details.replace(/'/g, "''")}'` : 'NULL'}, `;
        return `${log.ipAddress ? `'${log.ipAddress.replace(/'/g, "''")}'` : 'NULL'}, `;
        return `${log.userAgent ? `'${log.userAgent.replace(/'/g, "''")}'` : 'NULL'}, `;
        return `'${log.createdAt.toISOString()}', '${log.tenantId}', `;
        return `${log.userId ? `'${log.userId}'` : 'NULL'}, ${log.superAdminId ? `'${log.superAdminId}'` : 'NULL'})`;
      }).join(',\n');
      sqlContent += auditValues + ';\n\n';
    }

    // Write backup file
    fs.writeFileSync(backupFilePath, sqlContent);

    // Log the action in audit logs
    await prisma.auditLog.create({
      data: {
        action: 'download_backup',
        details: `Database backup generated: ${backupFileName} (${excludeAuditLogs ? 'excluding' : 'including'} audit logs)`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        tenantId: tenant.id,
        createdAt: new Date()
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database backup generated successfully');
    }

    // Return the backup file
    const fileBuffer = fs.readFileSync(backupFilePath);
    
    // Clean up the file after reading
    fs.unlinkSync(backupFilePath);

    const headers = new Headers();
    headers.set('Content-Type', 'application/sql');
    headers.set('Content-Disposition', `attachment; filename="${backupFileName}"`);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error generating backup:', error);
    }
    throw error;
  }
}); 