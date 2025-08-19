import { NextRequest } from 'next/server';
import { withTenantAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { createAuditLogFromRequest } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// Validation schemas
const inviteUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  roleIds: z.array(z.string()).max(1, 'Only one role can be assigned per user').optional(),
  expiresIn: z.number().optional().default(7 * 24 * 60 * 60 * 1000) // 7 days in milliseconds
});

const resendInviteSchema = z.object({
  invitationId: z.string()
});

// POST /api/tenant/[tenantSlug]/users/invite - Invite a new user
export const POST = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const body = await req.json();

    // Validate request body
    const validationResult = inviteUserSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 400, validationResult.error.errors);
    }

    const { name, email, roleIds, expiresIn } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        tenantId
      }
    });

    if (existingUser) {
      return createErrorResponse('User with this email already exists', 400);
    }

    // Check if invitation already exists
    const existingInvitation = await prisma.userInvitation.findFirst({
      where: {
        email,
        tenantId,
        status: 'pending'
      }
    });

    if (existingInvitation) {
      return createErrorResponse('Invitation already sent to this email', 400);
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiresIn);

    // Create invitation
    const invitation = await prisma.userInvitation.create({
      data: {
        email,
        name,
        token,
        expiresAt,
        tenantId,
        invitedBy: userId,
        status: 'pending'
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.invite', {
      invitationId: invitation.id,
      email: invitation.email,
      expiresAt: invitation.expiresAt
    });

    // TODO: Send invitation email
    // For now, we'll just return the invitation data
    // In a real implementation, you would send an email with the invitation link

    return createSuccessResponse({
      invitation: {
        id: invitation.id,
        email: invitation.email,
        name: invitation.name,
        expiresAt: invitation.expiresAt,
        status: invitation.status
      }
    }, 'User invitation sent successfully');
  } catch (error: any) {
    console.error('Error inviting user:', error);
    return createErrorResponse('Failed to invite user', 500);
  }
});

// PUT /api/tenant/[tenantSlug]/users/invite - Resend invitation
export const PUT = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;
    const body = await req.json();

    // Validate request body
    const validationResult = resendInviteSchema.safeParse(body);
    if (!validationResult.success) {
      return createErrorResponse('Validation failed', 400, validationResult.error.errors);
    }

    const { invitationId } = validationResult.data;

    // Find the invitation
    const invitation = await prisma.userInvitation.findFirst({
      where: {
        id: invitationId,
        tenantId,
        status: 'pending'
      }
    });

    if (!invitation) {
      return createErrorResponse('Invitation not found or already used', 404);
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      return createErrorResponse('Invitation has expired', 400);
    }

    // Generate new token and extend expiry
    const newToken = randomBytes(32).toString('hex');
    const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Update invitation
    const updatedInvitation = await prisma.userInvitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        updatedAt: new Date()
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.resend_invite', {
      invitationId: updatedInvitation.id,
      email: updatedInvitation.email
    });

    // TODO: Send new invitation email

    return createSuccessResponse({
      invitation: {
        id: updatedInvitation.id,
        email: updatedInvitation.email,
        name: updatedInvitation.name,
        expiresAt: updatedInvitation.expiresAt,
        status: updatedInvitation.status
      }
    }, 'Invitation resent successfully');
  } catch (error: any) {
    console.error('Error resending invitation:', error);
    return createErrorResponse('Failed to resend invitation', 500);
  }
});

// GET /api/tenant/[tenantSlug]/users/invite - Get pending invitations
export const GET = withTenantAuth(async (req: AuthenticatedRequest, { params }: { params: Promise<{ tenantSlug: string }> }) => {
  const { tenantSlug } = await params;
  
  try {
    const userId = req.user!.id;
    const tenantId = req.user!.tenantId;

    // Get pending invitations
    const invitations = await prisma.userInvitation.findMany({
      where: {
        tenantId,
        status: 'pending'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Create audit log
    await createAuditLogFromRequest(req, {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role as 'user' | 'superadmin',
      tenantId: req.user!.tenantId
    }, 'users.list_invitations', {
      count: invitations.length
    });

    return createSuccessResponse({
      invitations: invitations.map(inv => ({
        id: inv.id,
        email: inv.email,
        name: inv.name,
        expiresAt: inv.expiresAt,
        status: inv.status,
        createdAt: inv.createdAt
      }))
    }, 'Invitations retrieved successfully');
  } catch (error: any) {
    console.error('Error fetching invitations:', error);
    return createErrorResponse('Failed to fetch invitations', 500);
  }
}); 