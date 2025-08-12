import { NextRequest, NextResponse } from 'next/server';
import { filterDashboardData } from '@/middleware/moduleDataFilter';

// GET /api/dashboard - Get dashboard data based on user role
export async function GET(request: NextRequest) {
  try {
    // In a real application, you would get the user ID from authentication
    // For now, we'll use a query parameter or header
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get dashboard data filtered by user permissions
    const result = await filterDashboardData(request, userId, 'dashboard');

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status || 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      userType: result.userType
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
