import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

// Get user's language preference
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const userType = searchParams.get('userType') || 'user'; // 'user' or 'superadmin'

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    let user;
    if (userType === 'superadmin') {
      user = await prisma.superAdmin.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, defaultLanguage: true }
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          defaultLanguage: true,
          tenantId: true,
          tenant: {
            select: { 
              defaultLanguage: true,
              name: true,
              slug: true
            }
          }
        }
      });
    }

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    // For regular users, include tenant default as fallback
    const response = {
      userId: user.id,
      userLanguage: user.defaultLanguage,
      tenantLanguage: userType === 'user' ? user.tenant?.defaultLanguage : null,
      effectiveLanguage: user.defaultLanguage || (userType === 'user' ? user.tenant?.defaultLanguage : null) || 'en',
      userType
    };

    return createSuccessResponse(response, 'User language preferences retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching user language:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500
    );
  }
}

// Update user's language preference
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, language, userType = 'user' } = body;

    if (!userId || !language) {
      return createErrorResponse('User ID and language are required', 400);
    }

    // Validate language
    const supportedLanguages = ['en', 'hi', 'ur', 'ar', 'bn', 'fr'];
    if (!supportedLanguages.includes(language)) {
      return createErrorResponse('Unsupported language', 400);
    }

    let updatedUser;
    if (userType === 'superadmin') {
      updatedUser = await prisma.superAdmin.update({
        where: { id: userId },
        data: { defaultLanguage: language },
        select: { id: true, email: true, name: true, defaultLanguage: true }
      });
    } else {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { defaultLanguage: language },
        select: { 
          id: true, 
          email: true, 
          name: true, 
          defaultLanguage: true,
          tenantId: true,
          tenant: {
            select: { 
              defaultLanguage: true,
              name: true,
              slug: true
            }
          }
        }
      });
    }

    const response = {
      userId: updatedUser.id,
      userLanguage: updatedUser.defaultLanguage,
      tenantLanguage: userType === 'user' ? updatedUser.tenant?.defaultLanguage : null,
      effectiveLanguage: updatedUser.defaultLanguage,
      userType
    };

    return createSuccessResponse(response, 'User language preference updated successfully');

  } catch (error: any) {
    console.error('Error updating user language:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      500
    );
  }
}
