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
    
    if (!decoded || !decoded.id) {
      return { success: false, error: 'Invalid token' };
    }

    // Check if it's a superadmin token by looking in the SuperAdmin table
    const superAdmin = await prisma.superAdmin.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        contactNumber: true,
        avatar: true
      }
    });

    if (!superAdmin) {
      return { success: false, error: 'SuperAdmin not found' };
    }

    if (!superAdmin.isActive) {
      return { success: false, error: 'SuperAdmin account is inactive' };
    }

    return { success: true, user: superAdmin };
  } catch (error) {
    console.error('Auth error:', error);
    return { success: false, error: 'Authentication failed' };
  }
}; 