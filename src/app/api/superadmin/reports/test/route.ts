import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    console.log('🧪 Test API route called');
    
    // Simple test without authentication
    const reportCount = await prisma.report.count();
    
    return NextResponse.json({
      success: true,
      message: 'Test API route working',
      data: {
        reportCount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Test API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test API error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
