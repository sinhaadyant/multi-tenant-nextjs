import { prisma } from '@/lib/prisma';

// Declare global sendNotification function
declare global {
  var sendNotification: ((targetType: string, targetIds: string[], notificationData: any) => void) | undefined;
}

export interface SupportTicketNotificationData {
  ticketId: string;
  ticketTitle: string;
  action: 'created' | 'updated' | 'replied' | 'closed' | 'assigned';
  userId: string;
  userEmail: string;
  userName: string;
  tenantId: string;
  tenantSlug: string;
  targetUserId?: string; // For specific user notifications
  message?: string; // Custom message
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  updatedBy?: string; // ID of user who made the update
  updatedByEmail?: string; // Email of user who made the update
  updatedByName?: string; // Name of user who made the update
}

export async function createSupportTicketNotification(data: SupportTicketNotificationData) {
  try {
    const {
      ticketId,
      ticketTitle,
      action,
      userId,
      userEmail,
      userName,
      tenantId,
      tenantSlug,
      targetUserId,
      message,
      priority = 'medium',
      updatedBy,
      updatedByEmail,
      updatedByName
    } = data;

    // Determine notification type and content based on action
    let notificationType: 'info' | 'warning' | 'error' | 'success' | 'announcement' = 'info';
    let title = '';
    let notificationMessage = '';

    switch (action) {
      case 'created':
        notificationType = 'info';
        title = 'New Support Ticket Created';
        notificationMessage = message || `A new support ticket "${ticketTitle}" has been created.`;
        break;
      
      case 'updated':
        notificationType = 'info';
        title = 'Support Ticket Updated';
        if (updatedBy && updatedBy !== userId) {
          notificationMessage = message || `Support ticket "${ticketTitle}" has been updated by ${updatedByName || 'another user'}.`;
        } else {
          notificationMessage = message || `Support ticket "${ticketTitle}" has been updated.`;
        }
        break;
      
      case 'replied':
        notificationType = 'info';
        title = 'New Reply to Support Ticket';
        if (updatedBy && updatedBy !== userId) {
          notificationMessage = message || `A new reply has been added to support ticket "${ticketTitle}" by ${updatedByName || 'another user'}.`;
        } else {
          notificationMessage = message || `A new reply has been added to support ticket "${ticketTitle}".`;
        }
        break;
      
      case 'closed':
        notificationType = 'success';
        title = 'Support Ticket Closed';
        if (updatedBy && updatedBy !== userId) {
          notificationMessage = message || `Support ticket "${ticketTitle}" has been closed by ${updatedByName || 'another user'}.`;
        } else {
          notificationMessage = message || `Support ticket "${ticketTitle}" has been closed.`;
        }
        break;
      
      case 'assigned':
        notificationType = 'info';
        title = 'Support Ticket Assigned';
        notificationMessage = message || `Support ticket "${ticketTitle}" has been assigned to you.`;
        break;
      
      default:
        notificationType = 'info';
        title = 'Support Ticket Update';
        notificationMessage = message || `Support ticket "${ticketTitle}" has been updated.`;
    }

    // Create notification record
    const notification = await prisma.notification.create({
      data: {
        title,
        message: notificationMessage,
        type: notificationType,
        priority,
        targetType: targetUserId ? 'specific_users' : 'entire_tenant',
        targetTenantId: tenantId,
        status: 'sent',
        createdBy: updatedBy || userId,
        createdByType: 'user',
        isActive: true
      }
    });

    // Create notification recipients
    if (targetUserId) {
      // Send to specific user
      await prisma.userNotification.create({
        data: {
          notificationId: notification.id,
          userId: targetUserId,
          tenantId,
          isRead: false,
          isActive: true
        }
      });

      // Send Socket.io notification to specific user
      if (global.sendNotification) {
        console.log(`🔌 Sending real-time notification to user ${targetUserId}:`, {
          title,
          message: notificationMessage,
          type: notificationType
        });
        
        global.sendNotification('user', [targetUserId], {
          id: notification.id,
          title,
          message: notificationMessage,
          type: notificationType,
          priority,
          createdAt: notification.createdAt,
          createdBy: {
            id: updatedBy || userId,
            name: updatedByName || userName,
            email: updatedByEmail || userEmail,
          },
        });
      }
    } else {
      // Send to all tenant users with support permissions
      const tenantUsers = await prisma.user.findMany({
        where: {
          tenantId,
          isActive: true,
          userRoles: {
            some: {
              role: {
                permissions: {
                  some: {
                    moduleKey: 'support',
                    canRead: true
                  }
                }
              }
            }
          }
        },
        select: {
          id: true
        }
      });

      // Create recipients for all active tenant users with support permissions
      const recipients = tenantUsers.map(user => ({
        notificationId: notification.id,
        userId: user.id,
        tenantId,
        isRead: false,
        isActive: true
      }));

      if (recipients.length > 0) {
        await prisma.userNotification.createMany({
          data: recipients
        });

        // Send Socket.io notification to tenant room
        if (global.sendNotification) {
          global.sendNotification('tenant', [tenantId], {
            id: notification.id,
            title,
            message: notificationMessage,
            type: notificationType,
            priority,
            createdAt: notification.createdAt,
            createdBy: {
              id: updatedBy || userId,
              name: updatedByName || userName,
              email: updatedByEmail || userEmail,
            },
          });
        }
      }
    }

    // Create audit log for the notification
    await prisma.auditLog.create({
      data: {
        action: 'notification.created',
        details: `Support ticket notification created: ${title}`,
        userId: updatedBy || userId,
        tenantId,
        ipAddress: 'system',
        userAgent: 'system',
        resourceType: 'notification',
        resourceId: notification.id
      }
    });

    console.log(`✅ Support ticket notification created: ${title} for ticket ${ticketId}`);

    return notification;
  } catch (error) {
    console.error('❌ Error creating support ticket notification:', error);
    // Don't throw error to avoid breaking the main support ticket flow
    return null;
  }
}

// Helper function to create notification for ticket creator when someone else updates
export async function notifyTicketCreator(
  ticketId: string,
  ticketTitle: string,
  updatedBy: string,
  tenantId: string,
  action: 'replied' | 'closed' | 'updated',
  message?: string
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      tenant: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!ticket) return null;

  // Get the user who made the update
  const updatingUser = await prisma.user.findUnique({
    where: { id: updatedBy },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  return createSupportTicketNotification({
    ticketId,
    ticketTitle,
    action,
    userId: ticket.user?.id || '',
    userEmail: ticket.user?.email || '',
    userName: ticket.user?.name || '',
    tenantId,
    tenantSlug: ticket.tenant?.slug || '',
    targetUserId: ticket.user?.id, // Notify the ticket creator specifically
    message,
    priority: action === 'closed' ? 'high' : 'medium',
    updatedBy: updatingUser?.id,
    updatedByEmail: updatingUser?.email,
    updatedByName: updatingUser?.name
  });
}

// Helper function to notify other users when someone updates a ticket
export async function notifyOtherUsers(
  ticketId: string,
  ticketTitle: string,
  updatedBy: string,
  tenantId: string,
  action: 'replied' | 'closed' | 'updated',
  message?: string
) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true
        }
      },
      tenant: {
        select: {
          slug: true
        }
      }
    }
  });

  if (!ticket) return null;

  // Get the user who made the update
  const updatingUser = await prisma.user.findUnique({
    where: { id: updatedBy },
    select: {
      id: true,
      email: true,
      name: true
    }
  });

  // Get all users with support permissions except the ticket creator and the updating user
  const otherUsers = await prisma.user.findMany({
    where: {
      tenantId,
      isActive: true,
      id: {
        notIn: [ticket.user?.id || '', updatedBy]
      },
      userRoles: {
        some: {
          role: {
            permissions: {
              some: {
                moduleKey: 'support',
                canRead: true
              }
            }
          }
        }
      }
    },
    select: {
      id: true
    }
  });

  if (otherUsers.length === 0) return null;

  return createSupportTicketNotification({
    ticketId,
    ticketTitle,
    action,
    userId: ticket.user?.id || '',
    userEmail: ticket.user?.email || '',
    userName: ticket.user?.name || '',
    tenantId,
    tenantSlug: ticket.tenant?.slug || '',
    message,
    priority: action === 'closed' ? 'high' : 'medium',
    updatedBy: updatingUser?.id,
    updatedByEmail: updatingUser?.email,
    updatedByName: updatingUser?.name
  });
}

// Helper function to create notification for superadmin
export async function notifySuperAdmin(
  ticketId: string,
  ticketTitle: string,
  userId: string,
  userEmail: string,
  userName: string,
  tenantId: string,
  tenantSlug: string,
  action: 'created' | 'updated' | 'replied',
  message?: string
) {
  try {
    // Find superadmin users
    const superadmins = await prisma.superAdmin.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true
      }
    });

    if (superadmins.length === 0) return null;

    // Determine notification type and content based on action
    let notificationType: 'info' | 'warning' | 'error' | 'success' | 'announcement' = 'info';
    let title = '';
    let notificationMessage = '';

    switch (action) {
      case 'created':
        notificationType = 'info';
        title = 'New Support Ticket Created';
        notificationMessage = message || `A new support ticket "${ticketTitle}" has been created by ${userName} from tenant ${tenantSlug}.`;
        break;
      
      case 'updated':
        notificationType = 'info';
        title = 'Support Ticket Updated';
        notificationMessage = message || `Support ticket "${ticketTitle}" has been updated by ${userName}.`;
        break;
      
      case 'replied':
        notificationType = 'info';
        title = 'New Reply to Support Ticket';
        notificationMessage = message || `A new reply has been added to support ticket "${ticketTitle}" by ${userName}.`;
        break;
      
      default:
        notificationType = 'info';
        title = 'Support Ticket Update';
        notificationMessage = message || `Support ticket "${ticketTitle}" has been updated by ${userName}.`;
    }

    // Create notifications for each superadmin
    const notifications = await Promise.all(
      superadmins.map(async (superadmin) => {
        try {
          // Create notification record
          const notification = await prisma.notification.create({
            data: {
              title,
              message: notificationMessage,
              type: notificationType,
              priority: action === 'created' ? 'high' : 'medium',
              targetType: 'superadmin',
              status: 'sent',
              createdBy: userId,
              createdByType: 'user',
              isActive: true
            }
          });

          // Create user notification for superadmin
          await prisma.userNotification.create({
            data: {
              notificationId: notification.id,
              userId: superadmin.id,
              isRead: false,
              isActive: true
            }
          });

          // Send Socket.io notification to superadmin
          if (global.sendNotification) {
                      global.sendNotification('superadmin', [], {
            id: notification.id,
            title,
            message: notificationMessage,
            type: notificationType,
            priority: action === 'created' ? 'high' : 'medium',
            createdAt: notification.createdAt,
            createdBy: {
              id: userId,
              name: userName,
              email: userEmail,
            },
          });
          }

          // Create audit log for the notification
          await prisma.auditLog.create({
            data: {
              action: 'notification.created',
              details: `Support ticket notification created for superadmin: ${title}`,
              userId,
              ipAddress: 'system',
              userAgent: 'system',
              resourceType: 'notification',
              resourceId: notification.id
            }
          });

          console.log(`✅ Support ticket notification created for superadmin: ${title}`);
          return notification;
        } catch (error) {
          console.error('❌ Error creating superadmin notification:', error);
          return null;
        }
      })
    );

    return notifications.filter(Boolean);
  } catch (error) {
    console.error('❌ Error in notifySuperAdmin:', error);
    return null;
  }
}
