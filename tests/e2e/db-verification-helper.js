const { PrismaClient } = require('@prisma/client');

class DatabaseVerificationHelper {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }

  // User Management Database Operations
  async getUsersFromDB(tenantSlug, filters = {}) {
    try {
      const where = {
        tenant: {
          slug: tenantSlug
        }
      };

      // Apply filters
      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      if (filters.role) {
        where.userRoles = {
          some: {
            role: {
              name: filters.role
            }
          }
        };
      }

      if (filters.status) {
        where.isActive = filters.status === 'ACTIVE';
      }

      const users = await this.prisma.user.findMany({
        where,
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          tenant: true
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: 'desc' }
      });

      return users;
    } catch (error) {
      console.error('Error fetching users from DB:', error);
      return [];
    }
  }

  async createUserInDB(tenantSlug, userData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantSlug} not found`);
      }

      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: userData.password, // In real app, this would be hashed
          isActive: userData.status === 'ACTIVE' || true,
          tenantId: tenant.id
        },
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          tenant: true
        }
      });

      return user;
    } catch (error) {
      console.error('Error creating user in DB:', error);
      throw error;
    }
  }

  async updateUserInDB(userId, updateData) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          userRoles: {
            include: {
              role: true
            }
          },
          tenant: true
        }
      });

      return user;
    } catch (error) {
      console.error('Error updating user in DB:', error);
      throw error;
    }
  }

  async deleteUserInDB(userId) {
    try {
      await this.prisma.user.delete({
        where: { id: userId }
      });

      return true;
    } catch (error) {
      console.error('Error deleting user in DB:', error);
      throw error;
    }
  }

  async getUserCountFromDB(tenantSlug, filters = {}) {
    try {
      const where = {
        tenant: {
          slug: tenantSlug
        }
      };

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const count = await this.prisma.user.count({ where });
      return count;
    } catch (error) {
      console.error('Error getting user count from DB:', error);
      return 0;
    }
  }

  // Roles Database Operations
  async getRolesFromDB(tenantSlug, filters = {}) {
    try {
      const where = {
        tenant: {
          slug: tenantSlug
        }
      };

      if (filters.search) {
        where.name = { contains: filters.search, mode: 'insensitive' };
      }

      const roles = await this.prisma.role.findMany({
        where,
        include: {
          permissions: true,
          tenant: true
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: 'desc' }
      });

      return roles;
    } catch (error) {
      console.error('Error fetching roles from DB:', error);
      return [];
    }
  }

  async createRoleInDB(tenantSlug, roleData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantSlug} not found`);
      }

      const role = await this.prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          tenantId: tenant.id
        },
        include: {
          permissions: true,
          tenant: true
        }
      });

      return role;
    } catch (error) {
      console.error('Error creating role in DB:', error);
      throw error;
    }
  }

  // Audit Logs Database Operations
  async getAuditLogsFromDB(tenantSlug, filters = {}) {
    try {
      const where = {
        tenant: {
          slug: tenantSlug
        }
      };

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.module) {
        where.module = filters.module;
      }

      if (filters.dateFrom) {
        where.createdAt = {
          gte: new Date(filters.dateFrom)
        };
      }

      if (filters.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(filters.dateTo)
        };
      }

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        include: {
          user: true,
          tenant: true
        },
        skip: filters.skip || 0,
        take: filters.take || 50,
        orderBy: filters.orderBy || { createdAt: 'desc' }
      });

      return auditLogs;
    } catch (error) {
      console.error('Error fetching audit logs from DB:', error);
      return [];
    }
  }

  async createAuditLogInDB(tenantSlug, auditData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantSlug} not found`);
      }

      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: auditData.action,
          module: auditData.module,
          details: auditData.details,
          userId: auditData.userId,
          tenantId: tenant.id,
          ipAddress: auditData.ipAddress || '127.0.0.1',
          userAgent: auditData.userAgent || 'Test Agent'
        },
        include: {
          user: true,
          tenant: true
        }
      });

      return auditLog;
    } catch (error) {
      console.error('Error creating audit log in DB:', error);
      throw error;
    }
  }

  // Notifications Database Operations
  async getNotificationsFromDB(tenantSlug, filters = {}) {
    try {
      const where = {
        tenant: {
          slug: tenantSlug
        }
      };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { message: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        include: {
          recipients: true,
          tenant: true
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: 'desc' }
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications from DB:', error);
      return [];
    }
  }

  async createNotificationInDB(tenantSlug, notificationData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantSlug} not found`);
      }

      const notification = await this.prisma.notification.create({
        data: {
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type || 'INFO',
          status: notificationData.status || 'ACTIVE',
          tenantId: tenant.id
        },
        include: {
          recipients: true,
          tenant: true
        }
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification in DB:', error);
      throw error;
    }
  }

  // Support Tickets Database Operations
  async getSupportTicketsFromDB(tenantSlug, filters = {}) {
    try {
      const where = {
        tenant: {
          slug: tenantSlug
        }
      };

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      const tickets = await this.prisma.supportTicket.findMany({
        where,
        include: {
          createdBy: true,
          assignedTo: true,
          comments: {
            include: {
              user: true
            }
          },
          tenant: true
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: 'desc' }
      });

      return tickets;
    } catch (error) {
      console.error('Error fetching support tickets from DB:', error);
      return [];
    }
  }

  async createSupportTicketInDB(tenantSlug, ticketData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantSlug} not found`);
      }

      const ticket = await this.prisma.supportTicket.create({
        data: {
          title: ticketData.title,
          description: ticketData.description,
          category: ticketData.category || 'GENERAL',
          priority: ticketData.priority || 'MEDIUM',
          status: ticketData.status || 'OPEN',
          createdById: ticketData.createdById,
          tenantId: tenant.id
        },
        include: {
          createdBy: true,
          assignedTo: true,
          comments: true,
          tenant: true
        }
      });

      return ticket;
    } catch (error) {
      console.error('Error creating support ticket in DB:', error);
      throw error;
    }
  }

  // Dashboard Data Verification
  async getDashboardDataFromDB(tenantSlug) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: tenantSlug },
        include: {
          users: true,
          auditLogs: {
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: { user: true }
          }
        }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantSlug} not found`);
      }

      const totalUsers = await this.prisma.user.count({
        where: { tenantId: tenant.id }
      });

      const activeUsers = await this.prisma.user.count({
        where: { 
          tenantId: tenant.id,
          isActive: true
        }
      });

      const recentActivity = await this.prisma.auditLog.findMany({
        where: { tenantId: tenant.id },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true }
      });

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug
        },
        summary: {
          totalUsers,
          activeUsers,
          totalTickets: 0, // Add if support tickets table exists
          totalNotifications: 0 // Add if notifications table exists
        },
        recentActivity
      };
    } catch (error) {
      console.error('Error fetching dashboard data from DB:', error);
      throw error;
    }
  }

  // Data Comparison Helpers
  compareUserData(uiData, dbData) {
    const mismatches = [];
    
    if (uiData.name !== dbData.name) {
      mismatches.push(`Name mismatch: UI="${uiData.name}", DB="${dbData.name}"`);
    }
    
    if (uiData.email !== dbData.email) {
      mismatches.push(`Email mismatch: UI="${uiData.email}", DB="${dbData.email}"`);
    }
    
    // Convert isActive boolean to status string for comparison
    const dbStatus = dbData.isActive ? 'ACTIVE' : 'INACTIVE';
    if (uiData.status !== dbStatus) {
      mismatches.push(`Status mismatch: UI="${uiData.status}", DB="${dbStatus}"`);
    }
    
    return {
      matches: mismatches.length === 0,
      mismatches
    };
  }

  compareListData(uiList, dbList, keyField = 'id') {
    if (uiList.length !== dbList.length) {
      return {
        matches: false,
        mismatches: [`Count mismatch: UI=${uiList.length}, DB=${dbList.length}`]
      };
    }

    const mismatches = [];
    const uiMap = new Map(uiList.map(item => [item[keyField], item]));
    const dbMap = new Map(dbList.map(item => [item[keyField], item]));

    for (const [key, uiItem] of uiMap) {
      const dbItem = dbMap.get(key);
      if (!dbItem) {
        mismatches.push(`Item ${key} exists in UI but not in DB`);
        continue;
      }

      // Compare common fields
      const commonFields = ['name', 'email'];
      for (const field of commonFields) {
        if (uiItem[field] && dbItem[field] && uiItem[field] !== dbItem[field]) {
          mismatches.push(`Field ${field} mismatch for ${key}: UI="${uiItem[field]}", DB="${dbItem[field]}"`);
        }
      }

      // Compare status (isActive boolean to status string)
      if (uiItem.status) {
        const dbStatus = dbItem.isActive ? 'ACTIVE' : 'INACTIVE';
        if (uiItem.status !== dbStatus) {
          mismatches.push(`Status mismatch for ${key}: UI="${uiItem.status}", DB="${dbStatus}"`);
        }
      }
    }

    return {
      matches: mismatches.length === 0,
      mismatches
    };
  }
}

module.exports = DatabaseVerificationHelper; 