import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get tenant from user
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      include: { tenant: true },
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Return tenant settings
    return NextResponse.json({
      defaultLanguage: user.tenant.defaultLanguage || 'en',
      // Add other tenant settings as needed
    });
  } catch (error) {
    console.error('Error fetching tenant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { defaultLanguage } = body;

    // Validate language
    const validLanguages = ['en', 'hi', 'ur', 'ar', 'bn', 'fr'];
    if (defaultLanguage && !validLanguages.includes(defaultLanguage)) {
      return NextResponse.json(
        { error: 'Invalid language code' },
        { status: 400 }
      );
    }

    // Get user and tenant
    const user = await prisma.user.findFirst({
      where: { email: session.user.email },
      include: { tenant: true },
    });

    if (!user?.tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    // Update tenant settings
    const updatedTenant = await prisma.tenant.update({
      where: { id: user.tenant.id },
      data: {
        defaultLanguage: defaultLanguage || 'en',
      },
    });

    return NextResponse.json({
      defaultLanguage: updatedTenant.defaultLanguage,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating tenant settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
