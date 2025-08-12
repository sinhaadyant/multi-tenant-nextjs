import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateTokenPair, verifyRefreshToken } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import bcrypt from 'bcryptjs';

export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 SuperAdmin login attempt');
  }

  const { email, password, rememberMe } = await req.json();

  if (!email || !password) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Missing email or password');
    }
    return createErrorResponse(
      'Email and password are required',
      400,
      [
        { field: 'email', message: 'Email is required' },
        { field: 'password', message: 'Password is required' }
      ]
    );
  }

  // Normalize email
  const normalizedEmail = email.toLowerCase().trim();

  // Find SuperAdmin by email
  const superAdmin = await prisma.superAdmin.findUnique({
    where: { email: normalizedEmail }
  });

  if (!superAdmin) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ SuperAdmin not found:', email);
    }
    return createErrorResponse(
      'Invalid credentials',
      401
    );
  }

  if (!superAdmin.isActive) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ SuperAdmin account inactive:', email);
    }
    return createErrorResponse(
      'Account is inactive',
      401
    );
  }

  // Verify password
  const isValidPassword = await comparePassword(password, superAdmin.password);

  if (!isValidPassword) {
    if (process.env.NODE_ENV === 'development') {
      console.log('❌ Invalid password for SuperAdmin:', email);
    }
    return createErrorResponse(
      'Invalid credentials',
      401
    );
  }

  // Generate token pair (access + refresh) with "Remember Me" support
  const tokenPair = generateTokenPair({
    id: superAdmin.id,
    email: superAdmin.email,
    role: 'superadmin'
  }, rememberMe === true);

  // Get request info for device tracking
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  const forwardedFor = req.headers.get('x-forwarded-for');
  const remoteAddress = req.headers.get('x-real-ip') || req.ip;
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : remoteAddress;

  // Store refresh token in database
  const hashedRefreshToken = await bcrypt.hash(tokenPair.refreshToken, 10);
  const refreshTokenPayload = verifyRefreshToken(tokenPair.refreshToken);
  
  await prisma.refreshToken.create({
    data: {
      tokenId: refreshTokenPayload.tokenId,
      hashedToken: hashedRefreshToken,
      superAdminId: superAdmin.id,
      expiresAt: new Date(tokenPair.refreshExpiresAt),
      deviceInfo: userAgent,
      ipAddress: ipAddress || 'Unknown',
    }
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: superAdmin.id, email: superAdmin.email, role: 'superadmin' },
    'superadmin.login',
    { 
      email: superAdmin.email,
      deviceInfo: userAgent,
      ipAddress: ipAddress || 'Unknown',
      tokenId: refreshTokenPayload.tokenId,
      rememberMe: rememberMe === true
    }
  );

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SuperAdmin login successful:', email, 'rememberMe:', rememberMe);
  }

  // Create response with success data
  const response = createSuccessResponse({
    token: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken,
    expiresAt: tokenPair.expiresAt,
    refreshExpiresAt: tokenPair.refreshExpiresAt,
    user: {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: 'superadmin',
      avatar: superAdmin.avatar
    }
  }, 'Login successful');

  // Set cookie for middleware authentication with appropriate expiration
  const cookieMaxAge = rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60; // 30 days or 7 days
  response.cookies.set('superadmin_token', tokenPair.accessToken, {
    httpOnly: false, // Allow JS access
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: cookieMaxAge,
    path: '/',
  });

  return response;
}); 