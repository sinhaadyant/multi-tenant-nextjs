import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';

// GET /api/global-settings - Get global settings (public endpoint)
export const GET = async (req: NextRequest) => {
  try {
    // Get global settings
    const settings = await prisma.globalSettings.findFirst();
    
    if (!settings) {
      // Return default settings if none exist
      return createSuccessResponse({
        socialLogin: {
          enabled: false,
          google: {
            enabled: false,
          },
          apple: {
            enabled: false,
          },
        },
        security: {
          passwordPolicy: {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
          },
          sessionTimeout: 60,
          maxLoginAttempts: 5,
        },
        features: {
          userRegistration: true,
          emailVerification: true,
          twoFactorAuth: false,
        },
      }, 'Default settings retrieved');
    }

    // Parse JSON strings
    const parsedSettings = {
      socialLogin: JSON.parse(settings.socialLogin),
      security: JSON.parse(settings.security),
      features: JSON.parse(settings.features),
    };

    return createSuccessResponse(parsedSettings, 'Settings retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching global settings:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch settings',
      error.status || 500
    );
  }
};
