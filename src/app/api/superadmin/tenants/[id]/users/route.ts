import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';
import { createAuditLogFromRequest, createAuditLog } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: AuthenticatedRequest, context: any) => {
    try {
      const { searchParams } = new URL(req.url);
      const tenantId = params.id;

      // Extract query parameters
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const search = searchParams.get('search') || '';
      const status = searchParams.get('status') || '';
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';

      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return createErrorResponse('Tenant not found', 404);
      }

      // Build where clause
      const where: any = {
        tenantId: tenantId
      };

      // Add search filter
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } }
        ];
      }

      // Add status filter
      if (status === 'active') {
        where.isActive = true;
      } else if (status === 'inactive') {
        where.isActive = false;
      }

      // Build order by clause
      const orderBy: any = {};
      if (sortBy === 'name') {
        orderBy.name = sortOrder;
      } else if (sortBy === 'email') {
        orderBy.email = sortOrder;
      } else if (sortBy === 'lastLogin') {
        orderBy.lastLogin = sortOrder;
      } else {
        orderBy.createdAt = sortOrder;
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Get users with pagination
      const [users, totalUsers, activeUsers, inactiveUsers] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            lastLogin: true,
            createdAt: true,
            userRoles: {
              select: {
                role: {
                  select: {
                    id: true,
                    name: true
                  }
                }
              }
            }
          }
        }),
        prisma.user.count({ where }),
        prisma.user.count({ where: { ...where, isActive: true } }),
        prisma.user.count({ where: { ...where, isActive: false } })
      ]);

      // Transform users to match expected format
      const transformedUsers = users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        role: user.userRoles[0]?.role || null
      }));

      // Calculate pagination metadata
      const totalPages = Math.ceil(totalUsers / limit);

      const response = {
        data: {
          users: transformedUsers,
          stats: {
            total: totalUsers,
            active: activeUsers,
            inactive: inactiveUsers
          }
        },
        meta: {
          pagination: {
            page,
            limit,
            totalPages,
            totalRecords: totalUsers
          }
        }
      };

      return createSuccessResponse(response, 'Users retrieved successfully');
    } catch (error: any) {
      console.error('Error fetching tenant users:', error);
      return createErrorResponse('Failed to fetch users', 500);
    }
  })(req);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: AuthenticatedRequest, context: any) => {
          try {
        const tenantId = params.id;
      const body = await req.json();

      // Validate required fields
      const { name, email, password, contactNumber, roleIds, isActive = true } = body;

      if (!name || !email || !password) {
        return createErrorResponse('Name, email, and password are required', 400);
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return createErrorResponse('A role must be selected', 400);
      }

      if (roleIds.length > 1) {
        return createErrorResponse('Only one role can be assigned per user', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return createErrorResponse('Please enter a valid email address', 400);
      }

      // Validate password strength
      if (password.length < 8) {
        return createErrorResponse('Password must be at least 8 characters long', 400);
      }

      // Validate tenant exists
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId }
      });

      if (!tenant) {
        return createErrorResponse('Tenant not found', 404);
      }

      // Check if user already exists in this tenant
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email,
          tenantId: tenantId
        }
      });

      if (existingUser) {
        return createErrorResponse('User with this email already exists in this tenant', 400);
      }

      // Validate roles exist and belong to this tenant
      const roles = await prisma.role.findMany({
        where: {
          id: { in: roleIds },
          tenantId: tenantId
        }
      });

      if (roles.length !== roleIds.length) {
        return createErrorResponse('One or more selected roles do not exist or do not belong to this tenant', 400);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user first
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          contactNumber: contactNumber || null,
          isActive,
          tenantId
        }
      });

      // Create single role assignment
      const roleId = roleIds[0]; // Since we only allow one role
      
      try {
        await prisma.userRole.create({
          data: {
            userId: newUser.id,
            roleId: roleId,
            assignedBy: null // assignedBy is optional and can be null
          }
        });
      } catch (roleError) {
        console.error('Role assignment error:', roleError);
        throw roleError;
      }

      // Fetch the user with updated role information
      const result = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: {
          userRoles: {
            include: {
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              }
            }
          }
        }
      });

      // Create audit log
      try {
        console.log('🔍 Creating audit log for user creation...');
        console.log('📝 User object:', req.user);
        console.log('📝 Request headers:', Object.fromEntries(req.headers.entries()));
        
        // Create audit log directly since user object might not match JWTPayload interface
        await createAuditLog({
          action: 'user_created',
          details: {
            userId: result!.id,
            userEmail: result!.email,
            tenantId: tenantId,
            roles: roleIds
          },
          ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
          userAgent: req.headers.get('user-agent') || 'unknown',
          superAdminId: req.user!.id,
          tenantId: tenantId,
          status: 'success',
          severity: 'info'
        });
        
        console.log('✅ Audit log created successfully');
      } catch (auditError: any) {
        console.error('❌ Audit log error (non-blocking):', auditError);
        console.error('❌ Audit log error stack:', auditError.stack);
        // Continue even if audit log fails
      }

      // Transform user to match expected format
      const transformedUser = {
        ...result,
        role: result!.userRoles[0]?.role || null
      };

      return createSuccessResponse({ user: transformedUser }, 'User created successfully');
    } catch (error: any) {
      console.error('Error creating tenant user:', error);
      console.error('Error stack:', error.stack);
      console.error('Error message:', error.message);
      if (error.code) {
        console.error('Error code:', error.code);
      }
      return createErrorResponse('Failed to create user', 500);
    }
  })(req);
}
