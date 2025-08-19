import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// GET /api/superadmin/menu - Get menu data
export const GET = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Fetching menu data');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get menu items from database
    const menuItems = await prisma.menuItem.findMany({
      where: {
        isActive: true,
        parentId: null // Get only top-level items
      },
      include: {
        children: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      },
      orderBy: {
        order: 'asc'
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Menu data fetched successfully:', menuItems.length);
    }

    return createSuccessResponse(menuItems, 'Menu data fetched successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error fetching menu data:', error);
    }
    throw error;
  }
});

// POST /api/superadmin/menu - Create menu item
export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Creating menu item');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const { label, path, icon, parentId, order, isActive = true } = body;

    // Validate required fields
    if (!label) {
      return createErrorResponse('Label is required', 400);
    }

    // Create menu item
    const menuItem = await prisma.menuItem.create({
      data: {
        label,
        path: path || null,
        icon: icon || null,
        parentId: parentId || null,
        order: order || 0,
        isActive,
        createdBy: authResult.id
      },
      include: {
        children: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Menu item created successfully:', menuItem.id);
    }

    return createSuccessResponse(menuItem, 'Menu item created successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating menu item:', error);
    }
    throw error;
  }
});

// PUT /api/superadmin/menu - Update menu item
export const PUT = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('📝 Updating menu item');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await req.json();
    const { id, label, path, icon, parentId, order, isActive } = body;

    // Validate required fields
    if (!id) {
      return createErrorResponse('Menu item ID is required', 400);
    }

    // Update menu item
    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: {
        label,
        path: path || null,
        icon: icon || null,
        parentId: parentId || null,
        order: order || 0,
        isActive,
        updatedBy: authResult.id
      },
      include: {
        children: {
          where: {
            isActive: true
          },
          orderBy: {
            order: 'asc'
          }
        }
      }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Menu item updated successfully:', menuItem.id);
    }

    return createSuccessResponse(menuItem, 'Menu item updated successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error updating menu item:', error);
    }
    throw error;
  }
});

// DELETE /api/superadmin/menu - Delete menu item
export const DELETE = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️ Deleting menu item');
  }

  try {
    // Authenticate SuperAdmin
    const authResult = await requireSuperAdmin(req);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return createErrorResponse('Menu item ID is required', 400);
    }

    // Check if menu item has children
    const children = await prisma.menuItem.findMany({
      where: { parentId: id }
    });

    if (children.length > 0) {
      return createErrorResponse('Cannot delete menu item with children. Please delete children first.', 400);
    }

    // Delete menu item
    await prisma.menuItem.delete({
      where: { id }
    });

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Menu item deleted successfully:', id);
    }

    return createSuccessResponse(null, 'Menu item deleted successfully');

  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error deleting menu item:', error);
    }
    throw error;
  }
});
