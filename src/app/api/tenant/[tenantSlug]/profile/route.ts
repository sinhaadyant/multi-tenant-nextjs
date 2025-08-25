import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    const userId = req.user!.id;

    // Get user profile
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        contactNumber: true,
        preferences: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true,
        isActive: true,
        userRoles: {
          include: {
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found', 404);
    }

    const profile = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      contactNumber: user.contactNumber,
      preferences: user.preferences || {
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        notifications: {
          email: true,
          push: true,
          sms: false
        }
      },
      roles: user.userRoles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name,
        description: ur.role.description
      })),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      lastLogin: user.lastLogin,
      isActive: user.isActive
    };

    return createSuccessResponse(profile, 'User profile retrieved successfully');

  } catch (error: any) {
    console.error('User Profile API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});

export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  try {
    const { tenantSlug } = await params;
    const userId = req.user!.id;
    const body = await req.json();

    // Validate required fields
    if (!body.name || !body.email) {
      return createErrorResponse('Name and email are required', 400);
    }

    // Check if email is already taken by another user in the same tenant
    const existingUser = await prisma.user.findFirst({
      where: {
        email: body.email,
        tenantId: req.user!.tenantId,
        id: { not: userId }
      }
    });

    if (existingUser) {
      return createErrorResponse('Email is already taken by another user', 400);
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: body.name,
        email: body.email,
        contactNumber: body.contactNumber,
        preferences: body.preferences
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        contactNumber: true,
        preferences: true,
        updatedAt: true
      }
    });

    return createSuccessResponse(updatedUser, 'Profile updated successfully');

  } catch (error: any) {
    console.error('Update User Profile API Error:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
});