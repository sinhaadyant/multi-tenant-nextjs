import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifyToken } from './jwt';

export interface AuthResult {
  success: boolean;
  user?: any;
  error?: string;
}

export const requireSuperAdmin = async (req: NextRequest): Promise<AuthResult> => {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false, error: 'No authorization header' };
    }

    const token = authHeader.substring(7);
    const decoded = await verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return { success: false, error: 'Invalid token' };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (!user.isSuperAdmin) {
      return { success: false, error: 'SuperAdmin access required' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}; 