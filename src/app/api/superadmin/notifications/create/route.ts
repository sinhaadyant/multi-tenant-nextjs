import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { asyncHandler } from '@/lib/errorHandler';
import { createAuditLogFromRequest } from '@/lib/audit';

// POST /api/superadmin/notifications/create - Create notification with multiple recipient options
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📢 Creating notification with multiple recipients');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (!authResult.success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ Authentication failed:', authResult.error);
      }
      return createErrorResponse(`Authentication failed: ${authResult.error}`, 401);
    }

    const body = await req.json();
    const {
      title,
      message,
      type = 'info',
      priority = 'normal',
      sendToAllSuperadmins = false,
      sendToAllTenants = false,
      selectedTenants = [],
      selectedUsers = [],
      customEmails = [],
      scheduledAt = null
    } = body;

    // Validate required fields
    if (!title || !message) {
      return createErrorResponse('Title and message are required', 400);
    }

    // Validate at least one recipient option is selected
    if (!sendToAllSuperadmins && !sendToAllTenants && selectedTenants.length === 0 && selectedUsers.length === 0 && customEmails.length === 0) {
      return createErrorResponse('At least one recipient option must be selected', 400);
    }

    // Collect all recipient emails
    const recipientEmails = new Set<string>();

    // 1. Add all superadmin emails if selected
    if (sendToAllSuperadmins) {
      const superadmins = await prisma.superAdmin.findMany({
        where: { isActive: true },
        select: { email: true }
      });
      superadmins.forEach(sa => recipientEmails.add(sa.email));
    }

    // 2. Add all tenant admin emails if selected
    if (sendToAllTenants) {
      const tenants = await prisma.tenant.findMany({
        where: { isActive: true },
        select: { id: true }
      });
      
      for (const tenant of tenants) {
        const tenantUsers = await prisma.user.findMany({
          where: { 
            tenantId: tenant.id,
            isActive: true,
            userRoles: {
              some: {
                role: {
                  name: { in: ['Admin', 'Owner', 'Administrator'] }
                }
              }
            }
          },
          select: { email: true }
        });
        tenantUsers.forEach(user => recipientEmails.add(user.email));
      }
    }

    // 3. Add selected tenant admin emails
    if (selectedTenants.length > 0) {
      for (const tenantId of selectedTenants) {
        const tenantUsers = await prisma.user.findMany({
          where: { 
            tenantId,
            isActive: true,
            userRoles: {
              some: {
                role: {
                  name: { in: ['Admin', 'Owner', 'Administrator'] }
                }
              }
            }
          },
          select: { email: true }
        });
        tenantUsers.forEach(user => recipientEmails.add(user.email));
      }
    }

    // 4. Add selected user emails
    if (selectedUsers.length > 0) {
      const users = await prisma.user.findMany({
        where: { 
          id: { in: selectedUsers },
          isActive: true
        },
        select: { email: true }
      });
      users.forEach(user => recipientEmails.add(user.email));
    }

    // 5. Add custom emails
    customEmails.forEach(email => {
      if (email && typeof email === 'string') {
        recipientEmails.add(email.trim());
      }
    });

    // Convert to array and remove duplicates
    const finalRecipientEmails = Array.from(recipientEmails);

    if (finalRecipientEmails.length === 0) {
      return createErrorResponse('No valid recipients found', 400);
    }

    // Create the notification
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type,
        priority,
        status: 'sent',
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        sentAt: new Date(),
        createdBy: authResult.user.id,
        createdByType: 'superadmin',
        targetType: 'superadmin',
        metadata: JSON.stringify({
          sendToAllSuperadmins,
          sendToAllTenants,
          selectedTenants,
          selectedUsers,
          customEmails,
          totalRecipients: finalRecipientEmails.length,
          recipientEmails: finalRecipientEmails
        })
      }
    });

    // Create UserNotification records for tracking
    const userNotifications = [];
    for (const email of finalRecipientEmails) {
      // Find or create user record for this email
      let user = await prisma.user.findFirst({
        where: { email }
      });

      if (!user) {
        // Create a placeholder user record for external emails
        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0], // Use email prefix as name
            password: '', // Empty password for external users
            isActive: true,
            tenantId: null
          }
        });
      }

      userNotifications.push({
        userId: user.id,
        notificationId: notification.id,
        isRead: false,
        readAt: null
      });
    }

    // Bulk create user notifications
    await prisma.userNotification.createMany({
      data: userNotifications
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      authResult.user,
      'notification.created',
      {
        notificationId: notification.id,
        title,
        totalRecipients: finalRecipientEmails.length,
        sendToAllSuperadmins,
        sendToAllTenants,
        selectedTenantsCount: selectedTenants.length,
        selectedUsersCount: selectedUsers.length,
        customEmailsCount: customEmails.length
      }
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Notification created successfully');
      console.log(`📧 Sent to ${finalRecipientEmails.length} recipients`);
    }

    return createSuccessResponse({
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        status: notification.status,
        createdAt: notification.createdAt,
        totalRecipients: finalRecipientEmails.length,
        recipientEmails: finalRecipientEmails
      }
    }, `Notification sent to ${finalRecipientEmails.length} recipients successfully`);

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating notification:', error);
    }
    throw error;
  }
});
