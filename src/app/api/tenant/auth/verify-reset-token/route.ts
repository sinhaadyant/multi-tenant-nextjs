import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || token.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }

    // Additional validation - check if token looks valid (basic format check)
    if (token.length < 10) {
      return NextResponse.json(
        { success: false, message: 'Invalid token format' },
        { status: 400 }
      );
    }

    const resetTokenRecord = await prisma.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetTokenRecord) {
      return NextResponse.json(
        { success: false, message: 'Invalid reset token' },
        { status: 400 }
      );
    }

    if (resetTokenRecord.used) {
      return NextResponse.json(
        { success: false, message: 'Reset token has already been used' },
        { status: 400 }
      );
    }

    if (resetTokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Reset token has expired' },
        { status: 400 }
      );
    }

    // Check if this is a tenant user token
    if (resetTokenRecord.type !== 'tenant') {
      return NextResponse.json(
        { success: false, message: 'Invalid token type' },
        { status: 400 }
      );
    }

    // Find the user in the tenant
    const user = await prisma.user.findFirst({
      where: {
        email: resetTokenRecord.email,
        isActive: true
      },
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 400 }
      );
    }

    if (!user.tenant || !user.tenant.isActive) {
      return NextResponse.json(
        { success: false, message: 'Tenant is inactive' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: user.email,
        expiresAt: resetTokenRecord.expiresAt,
        tenantSlug: user.tenant.slug
      }
    });

  } catch (error) {
    console.error('Tenant token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 