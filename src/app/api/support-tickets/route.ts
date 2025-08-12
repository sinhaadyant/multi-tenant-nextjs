import { NextRequest, NextResponse } from 'next/server';
import { filterSupportData } from '@/middleware/moduleDataFilter';

// GET /api/support-tickets - Get support tickets based on user role
export async function GET(request: NextRequest) {
  try {
    // In a real application, you would get the user ID from authentication
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get support data filtered by user permissions
    const result = await filterSupportData(request, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      userType: result.userType,
      count: Array.isArray(result.data) ? result.data.length : 0
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch support tickets' },
      { status: 500 }
    );
  }
}

// POST /api/support-tickets - Create a new support ticket
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, priority = 'medium', userId } = body;

    if (!title || !description || !userId) {
      return NextResponse.json(
        { success: false, message: 'Title, description, and userId are required' },
        { status: 400 }
      );
    }

    // Get user to determine tenant
    const { prisma } = await import('@/lib/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tenantId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // Create support ticket
    const ticket = await prisma.supportTicket.create({
      data: {
        title,
        description,
        priority,
        status: 'open',
        createdBy: userId,
        tenantId: user.tenantId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

export const PUT = asyncHandler(async (request: NextRequest) => {
  // This method should be handled by the [id]/route.ts file
  return createErrorResponse('Method not allowed. Use PUT /api/support-tickets/[id] to update a ticket', 405);
});

export const DELETE = asyncHandler(async (request: NextRequest) => {
  // This method should be handled by the [id]/route.ts file
  return createErrorResponse('Method not allowed. Use DELETE /api/support-tickets/[id] to delete a ticket', 405);
});
