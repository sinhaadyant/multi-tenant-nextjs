import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  try {
    const { tenantSlug } = params;

    // Clear all authentication data
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );

    // Clear cookies
    response.cookies.delete('auth_token');
    response.cookies.delete('refresh_token');
    response.cookies.delete('superadmin_token');
    response.cookies.delete('tenant_token');

    return response;
  } catch (error) {
    console.error('Tenant logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { tenantSlug: string } }
) {
  return POST(request, { params });
} 