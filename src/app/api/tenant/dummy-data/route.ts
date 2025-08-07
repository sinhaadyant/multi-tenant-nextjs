import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireTenantAuth } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { z } from 'zod';
import { faker } from '@faker-js/faker';

// Validation schemas
const generateDummyDataSchema = z.object({
  dataRange: z.enum(['7', '30', '90']),
  userCount: z.number().min(1).max(100),
  tenantCount: z.number().min(0).max(10).optional(),
  includeSupportTickets: z.boolean().default(true)
});

const clearDataSchema = z.object({
  confirm: z.boolean().refine(val => val === true, {
    message: 'Confirmation is required'
  })
});

// GET /api/tenant/dummy-data - Get dummy data generation status
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Fetching dummy data generation status');
  }

  // Authenticate Tenant
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const tenant = authResult as any;

  try {
    // Get current data counts
    const [userCount, ticketCount, auditCount, notificationCount] = await Promise.all([
      prisma.user.count({ where: { tenantId: tenant.id } }),
      prisma.supportTicket.count({ where: { tenantId: tenant.id } }),
      prisma.auditLog.count({ where: { tenantId: tenant.id } }),
      prisma.notification.count({ where: { targetTenantId: tenant.id } })
    ]);

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Dummy data status fetched successfully');
    }

    return createSuccessResponse({
      currentData: {
        users: userCount,
        tickets: ticketCount,
        auditLogs: auditCount,
        notifications: notificationCount
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching dummy data status:', error);
    }
    throw error;
  }
});

// POST /api/tenant/dummy-data - Generate dummy data
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Generating dummy data');
  }

  // Authenticate Tenant
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const tenant = authResult as any;
  const body = await req.json();

  // Validate request body
  const validatedData = generateDummyDataSchema.parse(body);

  try {
    const { dataRange, userCount, tenantCount = 0, includeSupportTickets } = validatedData;
    
    // Calculate date range
    const days = parseInt(dataRange);
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Generate dummy users
    const generatedUsers = [];
    for (let i = 0; i < userCount; i++) {
      const user = await prisma.user.create({
        data: {
          email: faker.internet.email(),
          name: faker.person.fullName(),
          password: '$2a$10$dummy.hash.for.testing', // Dummy hash
          isActive: faker.datatype.boolean(0.8), // 80% active
          lastLogin: faker.date.between({ from: startDate, to: endDate }),
          tenantId: tenant.id,
          contactNumber: faker.phone.number(),
          createdAt: faker.date.between({ from: startDate, to: endDate }),
          updatedAt: faker.date.between({ from: startDate, to: endDate })
        }
      });
      generatedUsers.push(user);
    }

    // Generate dummy audit logs
    const auditLogCount = userCount * 5; // 5 logs per user
    for (let i = 0; i < auditLogCount; i++) {
      const user = generatedUsers[Math.floor(Math.random() * generatedUsers.length)];
      await prisma.auditLog.create({
        data: {
          action: faker.helpers.arrayElement(['login', 'logout', 'create', 'update', 'delete', 'view']),
          details: faker.lorem.sentence(),
          ipAddress: faker.internet.ip(),
          userAgent: faker.internet.userAgent(),
          tenantId: tenant.id,
          userId: user.id,
          createdAt: faker.date.between({ from: startDate, to: endDate })
        }
      });
    }

    // Generate dummy notifications
    const notificationCount = Math.floor(userCount / 2);
    for (let i = 0; i < notificationCount; i++) {
      await prisma.notification.create({
        data: {
          title: faker.lorem.sentence(3),
          message: faker.lorem.paragraph(),
          isRead: faker.datatype.boolean(0.3), // 30% read
          isActive: true,
          priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
          targetType: 'specific_tenant',
          targetTenantId: tenant.id,
          createdAt: faker.date.between({ from: startDate, to: endDate }),
          updatedAt: faker.date.between({ from: startDate, to: endDate })
        }
      });
    }

    // Generate support tickets if requested
    if (includeSupportTickets) {
      const ticketCount = Math.floor(userCount / 3);
      for (let i = 0; i < ticketCount; i++) {
        const user = generatedUsers[Math.floor(Math.random() * generatedUsers.length)];
        const ticket = await prisma.supportTicket.create({
          data: {
            title: faker.lorem.sentence(4),
            description: faker.lorem.paragraphs(2),
            category: faker.helpers.arrayElement(['general', 'technical', 'billing', 'feature_request']),
            status: faker.helpers.arrayElement(['open', 'in_progress', 'resolved', 'closed']),
            priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
            isForwarded: faker.datatype.boolean(0.2), // 20% forwarded
            tenantId: tenant.id,
            userId: user.id,
            createdAt: faker.date.between({ from: startDate, to: endDate }),
            updatedAt: faker.date.between({ from: startDate, to: endDate })
          }
        });

        // Generate ticket comments
        const commentCount = faker.number.int({ min: 1, max: 5 });
        for (let j = 0; j < commentCount; j++) {
          await prisma.supportTicketComment.create({
            data: {
              text: faker.lorem.paragraph(),
              ticketId: ticket.id,
              commentedBy: user.id,
              commenterType: 'user',
              createdAt: faker.date.between({ from: ticket.createdAt, to: endDate })
            }
          });
        }
      }
    }

    // Log the action in audit logs
    await prisma.auditLog.create({
      data: {
        action: 'generate_dummy_data',
        details: `Generated dummy data: ${userCount} users, ${dataRange} days range, ${includeSupportTickets ? 'with' : 'without'} support tickets`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        tenantId: tenant.id,
        createdAt: new Date()
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Dummy data generated successfully');
    }

    return createSuccessResponse({
      message: `Dummy data for ${dataRange} days generated successfully`,
      generated: {
        users: userCount,
        auditLogs: auditLogCount,
        notifications: notificationCount,
        tickets: includeSupportTickets ? Math.floor(userCount / 3) : 0
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error generating dummy data:', error);
    }
    throw error;
  }
});

// DELETE /api/tenant/dummy-data - Clear all data
export const DELETE = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Clearing all dummy data');
  }

  // Authenticate Tenant
  const authResult = await requireTenantAuth(req);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const tenant = authResult as any;
  const body = await req.json();

  // Validate request body
  const validatedData = clearDataSchema.parse(body);

  try {
    // Get counts before deletion for logging
    const [userCount, ticketCount, auditCount, notificationCount] = await Promise.all([
      prisma.user.count({ where: { tenantId: tenant.id } }),
      prisma.supportTicket.count({ where: { tenantId: tenant.id } }),
      prisma.auditLog.count({ where: { tenantId: tenant.id } }),
      prisma.notification.count({ where: { targetTenantId: tenant.id } })
    ]);

    // Delete all tenant data
    await Promise.all([
      prisma.supportTicketComment.deleteMany({
        where: {
          ticket: { tenantId: tenant.id }
        }
      }),
      prisma.supportTicketAttachment.deleteMany({
        where: {
          ticket: { tenantId: tenant.id }
        }
      }),
      prisma.supportTicket.deleteMany({
        where: { tenantId: tenant.id }
      }),
      prisma.auditLog.deleteMany({
        where: { tenantId: tenant.id }
      }),
      prisma.notification.deleteMany({
        where: { targetTenantId: tenant.id }
      }),
      prisma.user.deleteMany({
        where: { tenantId: tenant.id }
      })
    ]);

    // Log the action in audit logs
    await prisma.auditLog.create({
      data: {
        action: 'clear_all_data',
        details: `Cleared all data: ${userCount} users, ${ticketCount} tickets, ${auditCount} audit logs, ${notificationCount} notifications`,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown',
        tenantId: tenant.id,
        createdAt: new Date()
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ All data cleared successfully');
    }

    return createSuccessResponse({
      message: 'All data cleared successfully',
      cleared: {
        users: userCount,
        tickets: ticketCount,
        auditLogs: auditCount,
        notifications: notificationCount
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error clearing data:', error);
    }
    throw error;
  }
}); 