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
      include: {
        superAdmin: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          }
        }
      }
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

    if (!resetTokenRecord.superAdmin) {
      return NextResponse.json(
        { success: false, message: 'Associated SuperAdmin not found' },
        { status: 400 }
      );
    }

    if (!resetTokenRecord.superAdmin.isActive) {
      return NextResponse.json(
        { success: false, message: 'Account is inactive' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        email: resetTokenRecord.superAdmin.email,
        expiresAt: resetTokenRecord.expiresAt
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 