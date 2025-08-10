import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyAccessToken, verifyRefreshToken } from '@/lib/jwt';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createErrorResponse('No authorization token provided', 401);
    }

    const token = authHeader.substring(7);

    // Verify the access token to get user info
    let userPayload;
    try {
      userPayload = verifyAccessToken(token);
    } catch (error) {
      // Even if token is invalid, try to revoke refresh tokens if provided
      console.warn('Invalid access token during logout:', error);
    }

    const { refreshToken, revokeAllDevices = false } = await req.json();

    // If we have a valid user payload, revoke their tokens
    if (userPayload) {
      if (revokeAllDevices) {
        // Revoke all refresh tokens for this user
        await prisma.refreshToken.updateMany({
          where: {
            superAdminId: userPayload.id,
            isRevoked: false,
          },
          data: {
            isRevoked: true,
            lastUsedAt: new Date(),
          }
        });

        // Create audit log for bulk revocation
        await createAuditLogFromRequest(
          req,
          { 
            id: userPayload.id, 
            email: userPayload.email, 
            role: userPayload.role 
          },
          'superadmin.logout_all_devices',
          { 
            deviceInfo: req.headers.get('user-agent') || 'Unknown',
            ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'Unknown'
          }
        );

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ All devices logged out for:', userPayload.email);
        }

        return createSuccessResponse(
          { message: 'Logged out from all devices successfully' },
          'Logged out from all devices'
        );
      } else if (refreshToken) {
        // Revoke specific refresh token
        try {
          const refreshPayload = verifyRefreshToken(refreshToken);
          
          await prisma.refreshToken.updateMany({
            where: {
              tokenId: refreshPayload.tokenId,
              superAdminId: userPayload.id,
              isRevoked: false,
            },
            data: {
              isRevoked: true,
              lastUsedAt: new Date(),
            }
          });

          // Create audit log for specific logout
          await createAuditLogFromRequest(
            req,
            { 
              id: userPayload.id, 
              email: userPayload.email, 
              role: userPayload.role 
            },
            'superadmin.logout',
            { 
              tokenId: refreshPayload.tokenId,
              deviceInfo: req.headers.get('user-agent') || 'Unknown',
              ipAddress: req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'Unknown'
            }
          );

          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Device logged out for:', userPayload.email);
          }

        } catch (refreshError) {
          console.warn('Invalid refresh token during logout:', refreshError);
          // Continue with logout even if refresh token is invalid
        }
      }
    }

    // Always return success for logout
    return createSuccessResponse(
      { message: 'Logged out successfully' },
      'Logout successful'
    );

  } catch (error: any) {
    console.error('Error during logout:', error);
    // Even if there's an error, we still return success
    // because the client will clear local data anyway
    return createSuccessResponse(
      { message: 'Logged out successfully' },
      'Logout successful'
    );
  }
}