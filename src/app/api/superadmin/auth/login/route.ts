import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword, generateToken } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';
import { asyncHandler } from '@/lib/errorHandler';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';

export const POST = asyncHandler(async (req: NextRequest) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 SuperAdmin login attempt');
  }

  const { email, password } = await req.json();

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

  // Generate JWT token
  const token = generateToken({
    id: superAdmin.id,
    email: superAdmin.email,
    role: 'superadmin'
  });

  // Create audit log
  await createAuditLogFromRequest(
    req,
    { id: superAdmin.id, email: superAdmin.email, role: 'superadmin' },
    'superadmin.login',
    { email: superAdmin.email }
  );

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ SuperAdmin login successful:', email);
  }

  return createSuccessResponse({
    token,
    user: {
      id: superAdmin.id,
      email: superAdmin.email,
      name: superAdmin.name,
      role: 'superadmin'
    }
  }, 'Login successful');
}); 