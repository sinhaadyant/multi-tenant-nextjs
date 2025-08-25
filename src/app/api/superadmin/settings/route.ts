import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schemas
const updateSettingsSchema = z.object({
  socialLogin: z.object({
    enabled: z.boolean(),
    google: z.object({
      enabled: z.boolean(),
      clientId: z.string().optional(),
      clientSecret: z.string().optional(),
    }),
    apple: z.object({
      enabled: z.boolean(),
      clientId: z.string().optional(),
      teamId: z.string().optional(),
      keyId: z.string().optional(),
    }),
  }),
  security: z.object({
    passwordPolicy: z.object({
      minLength: z.number().min(6).max(50),
      requireUppercase: z.boolean(),
      requireLowercase: z.boolean(),
      requireNumbers: z.boolean(),
      requireSpecialChars: z.boolean(),
    }),
    sessionTimeout: z.number().min(5).max(1440), // 5 minutes to 24 hours
    maxLoginAttempts: z.number().min(1).max(10),
  }),
  features: z.object({
    userRegistration: z.boolean(),
    emailVerification: z.boolean(),
    twoFactorAuth: z.boolean(),
  }),
});

// Internally map to a Settings model name that exists
const settingsModel = (prisma as any).globalSettings || (prisma as any).settings || (prisma as any).setting;

// GET /api/superadmin/settings - Get global settings
export const GET = withSuperAdminAuth(async (req: NextRequest, { user }: { user: any }) => {
  try {
    // Get or create global settings
    let settings = await settingsModel.findFirst();
    
    if (!settings) {
      // Create default settings
      const defaultSettings = {
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
          sessionTimeout: 60, // 60 minutes
          maxLoginAttempts: 5,
        },
        features: {
          userRegistration: true,
          emailVerification: true,
          twoFactorAuth: false,
        },
      };

      settings = await settingsModel.create({
        data: {
          id: 'global',
          socialLogin: JSON.stringify(defaultSettings.socialLogin),
          security: JSON.stringify(defaultSettings.security),
          features: JSON.stringify(defaultSettings.features),
          updatedBy: user.id,
        },
      });
    }

    // Parse JSON strings
    const parsedSettings = {
      id: settings.id,
      socialLogin: JSON.parse(settings.socialLogin),
      security: JSON.parse(settings.security),
      features: JSON.parse(settings.features),
      updatedAt: (settings.updatedAt instanceof Date ? settings.updatedAt : new Date(settings.updatedAt)).toISOString(),
      updatedBy: settings.updatedBy,
    };

    // Create audit log
    await createAuditLogFromRequest(req, user, 'settings.viewed', {
      details: 'Global settings viewed',
    });

    return createSuccessResponse(parsedSettings, 'Settings retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return createErrorResponse(
      error.message || 'Failed to fetch settings',
      error.status || 500
    );
  }
});

// PUT /api/superadmin/settings - Update global settings
export const PUT = withSuperAdminAuth(async (req: NextRequest, { user }: { user: any }) => {
  try {
    const body = await req.json();
    const validatedData = updateSettingsSchema.parse(body);

    // Update or create settings
    const settings = await settingsModel.upsert({
      where: { id: 'global' },
      update: {
        socialLogin: JSON.stringify(validatedData.socialLogin),
        security: JSON.stringify(validatedData.security),
        features: JSON.stringify(validatedData.features),
        updatedBy: user.id,
        updatedAt: new Date(),
      },
      create: {
        id: 'global',
        socialLogin: JSON.stringify(validatedData.socialLogin),
        security: JSON.stringify(validatedData.security),
        features: JSON.stringify(validatedData.features),
        updatedBy: user.id,
      },
    });

    // Parse JSON strings for response
    const parsedSettings = {
      id: settings.id,
      socialLogin: JSON.parse(settings.socialLogin),
      security: JSON.parse(settings.security),
      features: JSON.parse(settings.features),
      updatedAt: (settings.updatedAt instanceof Date ? settings.updatedAt : new Date(settings.updatedAt)).toISOString(),
      updatedBy: settings.updatedBy,
    };

    // Create audit log
    await createAuditLogFromRequest(req, user, 'settings.updated', {
      details: 'Global settings updated',
      newValues: validatedData,
    });

    return createSuccessResponse(parsedSettings, 'Settings updated successfully');

  } catch (error: any) {
    console.error('Error updating settings:', error);
    if (error.name === 'ZodError') {
      return createErrorResponse('Invalid settings data', 400, error.errors);
    }
    return createErrorResponse(
      error.message || 'Failed to update settings',
      error.status || 500
    );
  }
});
