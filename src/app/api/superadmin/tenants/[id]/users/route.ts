import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/apiResponse';
import { prisma } from '@/lib/prisma';
import { withSuperAdminAuth } from '@/lib/authMiddleware';
import bcrypt from 'bcryptjs';
import { createAuditLogFromRequest } from '@/lib/audit';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
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
  return withSuperAdminAuth(async (req: NextRequest, user: any) => {
    try {
      const tenantId = params.id;
      const body = await req.json();

      // Validate required fields
      const { name, email, password, contactNumber, roleIds, isActive = true } = body;

      if (!name || !email || !password) {
        return createErrorResponse('Name, email, and password are required', 400);
      }

      if (!Array.isArray(roleIds) || roleIds.length === 0) {
        return createErrorResponse('At least one role must be selected', 400);
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

      // Create user with role assignments in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the user
        const newUser = await tx.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            contactNumber: contactNumber || null,
            isActive,
            tenantId
          },
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

        // Create role assignments
        const roleAssignments = roleIds.map(roleId => ({
          userId: newUser.id,
          roleId: roleId,
          assignedBy: user.id
        }));

        await tx.userRole.createMany({
          data: roleAssignments
        });

        // Fetch the user with updated role information
        const userWithRoles = await tx.user.findUnique({
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

        return userWithRoles;
      });

      // Create audit log
      await createAuditLogFromRequest(req, user, 'user.create', {
        userId: result!.id,
        userEmail: result!.email,
        tenantId: tenantId,
        roles: roleIds
      });

      // Transform user to match expected format
      const transformedUser = {
        ...result,
        role: result!.userRoles[0]?.role || null
      };

      return createSuccessResponse({ user: transformedUser }, 'User created successfully');
    } catch (error: any) {
      console.error('Error creating tenant user:', error);
      return createErrorResponse('Failed to create user', 500);
    }
  })(req);
}
