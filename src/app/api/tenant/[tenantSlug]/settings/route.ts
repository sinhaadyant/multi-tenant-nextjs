import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant with settings
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        settings: true,
        integrations: true,
        notifications: true
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Format settings response
    const settings = {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        isActive: tenant.isActive,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt
      },
      branding: {
        logo: tenant.settings?.logo || null,
        favicon: tenant.settings?.favicon || null,
        primaryColor: tenant.settings?.primaryColor || '#3B82F6',
        secondaryColor: tenant.settings?.secondaryColor || '#1F2937',
        customCSS: tenant.settings?.customCSS || null,
        domainAliases: tenant.settings?.domainAliases || []
      },
      notifications: {
        email: {
          enabled: tenant.notifications?.emailEnabled ?? true,
          templates: tenant.notifications?.emailTemplates || {},
          fromEmail: tenant.notifications?.fromEmail || 'noreply@example.com',
          fromName: tenant.notifications?.fromName || tenant.name
        },
        sms: {
          enabled: tenant.notifications?.smsEnabled ?? false,
          provider: tenant.notifications?.smsProvider || null,
          templates: tenant.notifications?.smsTemplates || {}
        },
        inApp: {
          enabled: tenant.notifications?.inAppEnabled ?? true,
          retentionDays: tenant.notifications?.inAppRetentionDays || 30
        }
      },
      integrations: {
        apiKeys: tenant.integrations?.apiKeys || [],
        webhooks: tenant.integrations?.webhooks || [],
        thirdParty: tenant.integrations?.thirdParty || {}
      },
      localization: {
        language: tenant.settings?.language || 'en',
        timezone: tenant.settings?.timezone || 'UTC',
        currency: tenant.settings?.currency || 'USD',
        dateFormat: tenant.settings?.dateFormat || 'MM/DD/YYYY',
        timeFormat: tenant.settings?.timeFormat || '12h'
      },
      privacy: {
        dataRetentionDays: tenant.settings?.dataRetentionDays || 365,
        allowAnalytics: tenant.settings?.allowAnalytics ?? true,
        allowMarketing: tenant.settings?.allowMarketing ?? false,
        gdprCompliant: tenant.settings?.gdprCompliant ?? false
      },
      features: {
        modules: tenant.settings?.enabledModules || [],
        customFeatures: tenant.settings?.customFeatures || {},
        limits: {
          maxUsers: tenant.settings?.maxUsers || 100,
          maxStorage: tenant.settings?.maxStorage || 1024, // MB
          maxApiCalls: tenant.settings?.maxApiCalls || 10000
        }
      },
      security: {
        mfaRequired: tenant.settings?.mfaRequired ?? false,
        sessionTimeout: tenant.settings?.sessionTimeout || 24, // hours
        passwordPolicy: tenant.settings?.passwordPolicy || {
          minLength: 8,
          requireUppercase: true,
          requireLowercase: true,
          requireNumbers: true,
          requireSpecialChars: false
        }
      }
    };

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'settings.view',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug
      }
    );

    return createSuccessResponse(settings, 'Settings retrieved successfully');

  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tenantSlug = searchParams.get('tenantSlug') || req.nextUrl.pathname.split('/')[3];
    
    if (!tenantSlug) {
      return createErrorResponse('Tenant slug is required', 400);
    }

    // Verify authentication token
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return createErrorResponse('No authentication token found', 401);
    }

    const decoded = await verifyToken(token);
    if (!decoded || !decoded.id) {
      return createErrorResponse('Invalid authentication token', 401);
    }

    // Get tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        settings: true,
        integrations: true,
        notifications: true
      }
    });

    if (!tenant) {
      return createErrorResponse('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      return createErrorResponse('Tenant is inactive', 403);
    }

    // Verify user belongs to this tenant and has admin permissions
    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        tenantId: tenant.id,
        isActive: true
      },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return createErrorResponse('User not found or not authorized for this tenant', 404);
    }

    // Check if user has admin permissions
    const isAdmin = user.userRoles.some(ur => 
      ur.role.name === 'Tenant Admin' || ur.role.name === 'Admin'
    );

    if (!isAdmin) {
      return createErrorResponse('Insufficient permissions to update settings', 403);
    }

    const body = await req.json();
    const {
      branding,
      notifications,
      integrations,
      localization,
      privacy,
      features,
      security
    } = body;

    // Update settings in a transaction
    const updatedSettings = await prisma.$transaction(async (tx) => {
      // Update tenant settings
      const settingsData: any = {};
      
      if (branding) {
        settingsData.logo = branding.logo;
        settingsData.favicon = branding.favicon;
        settingsData.primaryColor = branding.primaryColor;
        settingsData.secondaryColor = branding.secondaryColor;
        settingsData.customCSS = branding.customCSS;
        settingsData.domainAliases = branding.domainAliases;
      }

      if (localization) {
        settingsData.language = localization.language;
        settingsData.timezone = localization.timezone;
        settingsData.currency = localization.currency;
        settingsData.dateFormat = localization.dateFormat;
        settingsData.timeFormat = localization.timeFormat;
      }

      if (privacy) {
        settingsData.dataRetentionDays = privacy.dataRetentionDays;
        settingsData.allowAnalytics = privacy.allowAnalytics;
        settingsData.allowMarketing = privacy.allowMarketing;
        settingsData.gdprCompliant = privacy.gdprCompliant;
      }

      if (features) {
        settingsData.enabledModules = features.modules;
        settingsData.customFeatures = features.customFeatures;
        settingsData.maxUsers = features.limits?.maxUsers;
        settingsData.maxStorage = features.limits?.maxStorage;
        settingsData.maxApiCalls = features.limits?.maxApiCalls;
      }

      if (security) {
        settingsData.mfaRequired = security.mfaRequired;
        settingsData.sessionTimeout = security.sessionTimeout;
        settingsData.passwordPolicy = security.passwordPolicy;
      }

      // Update or create tenant settings
      const updatedSettings = await tx.tenantSettings.upsert({
        where: { tenantId: tenant.id },
        update: settingsData,
        create: {
          tenantId: tenant.id,
          ...settingsData
        }
      });

      // Update notifications
      if (notifications) {
        await tx.tenantNotifications.upsert({
          where: { tenantId: tenant.id },
          update: {
            emailEnabled: notifications.email?.enabled,
            emailTemplates: notifications.email?.templates,
            fromEmail: notifications.email?.fromEmail,
            fromName: notifications.email?.fromName,
            smsEnabled: notifications.sms?.enabled,
            smsProvider: notifications.sms?.provider,
            smsTemplates: notifications.sms?.templates,
            inAppEnabled: notifications.inApp?.enabled,
            inAppRetentionDays: notifications.inApp?.retentionDays
          },
          create: {
            tenantId: tenant.id,
            emailEnabled: notifications.email?.enabled ?? true,
            emailTemplates: notifications.email?.templates || {},
            fromEmail: notifications.email?.fromEmail || 'noreply@example.com',
            fromName: notifications.email?.fromName || tenant.name,
            smsEnabled: notifications.sms?.enabled ?? false,
            smsProvider: notifications.sms?.provider,
            smsTemplates: notifications.sms?.templates || {},
            inAppEnabled: notifications.inApp?.enabled ?? true,
            inAppRetentionDays: notifications.inApp?.retentionDays || 30
          }
        });
      }

      // Update integrations
      if (integrations) {
        await tx.tenantIntegrations.upsert({
          where: { tenantId: tenant.id },
          update: {
            apiKeys: integrations.apiKeys,
            webhooks: integrations.webhooks,
            thirdParty: integrations.thirdParty
          },
          create: {
            tenantId: tenant.id,
            apiKeys: integrations.apiKeys || [],
            webhooks: integrations.webhooks || [],
            thirdParty: integrations.thirdParty || {}
          }
        });
      }

      return updatedSettings;
    });

    // Create audit log
    await createAuditLogFromRequest(
      req,
      { id: user.id, email: user.email, role: 'user' },
      'settings.update',
      { 
        tenantId: tenant.id,
        tenantSlug: tenant.slug,
        updatedSections: Object.keys(body)
      }
    );

    return createSuccessResponse(updatedSettings, 'Settings updated successfully');

  } catch (error: any) {
    console.error('Error updating settings:', error);
    return createErrorResponse(
      error.message || 'Internal server error',
      error.status || 500
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return createSuccessResponse({ message: 'Settings POST endpoint working' }, 'Success');
  } catch (error: any) {
    console.error('Error:', error);
    return createErrorResponse('Internal server error', 500);
  }
} 