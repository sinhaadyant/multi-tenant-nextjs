import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'API is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
}

export async function POST() {
  return NextResponse.json({
    success: true,
    message: 'POST API is working',
    timestamp: new Date().toISOString()
  });
}
