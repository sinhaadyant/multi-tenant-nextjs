const { PrismaClient } = require("@prisma/client");

class SuperAdminDatabaseHelper {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log("✅ SuperAdmin Database connected successfully");
    } catch (error) {
      console.error("❌ SuperAdmin Database connection failed:", error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log("✅ SuperAdmin Database disconnected");
    } catch (error) {
      console.error("❌ SuperAdmin Database disconnection failed:", error);
    }
  }

  // ==================== SUPERADMIN AUTHENTICATION ====================

  async getSuperAdminByEmail(email) {
    try {
      return await this.prisma.superAdmin.findUnique({
        where: { email },
        include: {
          auditLogs: true,
          notifications: true,
          reports: true,
        },
      });
    } catch (error) {
      console.error("Error fetching superadmin by email:", error);
      return null;
    }
  }

  async createSuperAdmin(adminData) {
    try {
      return await this.prisma.superAdmin.create({
        data: {
          email: adminData.email,
          name: adminData.name,
          password: adminData.password, // In real app, this would be hashed
          isActive: adminData.isActive || true,
          contactNumber: adminData.contactNumber,
        },
        include: {
          auditLogs: true,
          notifications: true,
        },
      });
    } catch (error) {
      console.error("Error creating superadmin:", error);
      throw error;
    }
  }

  async updateSuperAdminLastLogin(adminId) {
    try {
      // SuperAdmin model doesn't have lastLogin field, so we'll just update the updatedAt field
      return await this.prisma.superAdmin.update({
        where: { id: adminId },
        data: { updatedAt: new Date() },
      });
    } catch (error) {
      console.error("Error updating superadmin last login:", error);
      throw error;
    }
  }

  // ==================== TENANT MANAGEMENT ====================

  async getTenantsFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { slug: { contains: filters.search, mode: "insensitive" } },
          { domain: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.status) {
        where.isActive = filters.status === "ACTIVE";
      }

      if (filters.plan) {
        where.plan = filters.plan;
      }

      const tenants = await this.prisma.tenant.findMany({
        where,
        include: {
          users: {
            include: {
              userRoles: {
                include: {
                  role: true,
                },
              },
            },
          },
          roles: true,
          auditLogs: true,
          supportTickets: true,
          tenantModules: {
            include: {
              module: true,
            },
          },
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: "desc" },
      });

      return tenants;
    } catch (error) {
      console.error("Error fetching tenants from DB:", error);
      return [];
    }
  }

  async createTenantInDB(tenantData) {
    try {
      const tenant = await this.prisma.tenant.create({
        data: {
          name: tenantData.name,
          slug: tenantData.slug,
          domain: tenantData.domain,
          description: tenantData.description,
          isActive: tenantData.isActive || true,
          plan: tenantData.plan || "starter",
          region: tenantData.region || "US East",
          features: tenantData.features || "[]",
          metadata: tenantData.metadata || "{}",
        },
        include: {
          users: true,
          roles: true,
          tenantModules: true,
        },
      });

      return tenant;
    } catch (error) {
      console.error("Error creating tenant in DB:", error);
      throw error;
    }
  }

  async updateTenantInDB(tenantId, updateData) {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
        include: {
          users: true,
          roles: true,
          tenantModules: true,
        },
      });

      return tenant;
    } catch (error) {
      console.error("Error updating tenant in DB:", error);
      throw error;
    }
  }

  async deleteTenantInDB(tenantId) {
    try {
      await this.prisma.tenant.delete({
        where: { id: tenantId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting tenant in DB:", error);
      throw error;
    }
  }

  async getTenantCountFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { slug: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.status) {
        where.isActive = filters.status === "ACTIVE";
      }

      const count = await this.prisma.tenant.count({ where });
      return count;
    } catch (error) {
      console.error("Error getting tenant count from DB:", error);
      return 0;
    }
  }

  // ==================== USER MANAGEMENT (SUPERADMIN VIEW) ====================

  async getUsersFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { email: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.tenantSlug) {
        where.tenant = {
          slug: filters.tenantSlug,
        };
      }

      if (filters.status) {
        where.isActive = filters.status === "ACTIVE";
      }

      const users = await this.prisma.user.findMany({
        where,
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
          auditLogs: true,
          supportTickets: true,
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: "desc" },
      });

      return users;
    } catch (error) {
      console.error("Error fetching users from DB:", error);
      return [];
    }
  }

  async createUserInDB(userData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: userData.tenantSlug },
      });

      if (!tenant) {
        throw new Error(`Tenant ${userData.tenantSlug} not found`);
      }

      const user = await this.prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: userData.password,
          isActive: userData.isActive || true,
          contactNumber: userData.contactNumber,
          tenantId: tenant.id,
        },
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      console.error("Error creating user in DB:", error);
      throw error;
    }
  }

  async updateUserInDB(userId, updateData) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      console.error("Error updating user in DB:", error);
      throw error;
    }
  }

  async deleteUserInDB(userId) {
    try {
      await this.prisma.user.delete({
        where: { id: userId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting user in DB:", error);
      throw error;
    }
  }

  // ==================== ROLE MANAGEMENT ====================

  async getRolesFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { name: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.tenantSlug) {
        where.tenant = {
          slug: filters.tenantSlug,
        };
      }

      if (filters.status) {
        where.isActive = filters.status === "ACTIVE";
      }

      const roles = await this.prisma.role.findMany({
        where,
        include: {
          tenant: true,
          permissions: {
            include: {
              permission: true,
            },
          },
          userRoles: {
            include: {
              user: true,
            },
          },
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: "desc" },
      });

      return roles;
    } catch (error) {
      console.error("Error fetching roles from DB:", error);
      return [];
    }
  }

  async createRoleInDB(roleData) {
    try {
      const tenant = await this.prisma.tenant.findUnique({
        where: { slug: roleData.tenantSlug },
      });

      if (!tenant) {
        throw new Error(`Tenant ${roleData.tenantSlug} not found`);
      }

      const role = await this.prisma.role.create({
        data: {
          name: roleData.name,
          description: roleData.description,
          isActive: roleData.isActive || true,
          isDefault: roleData.isDefault || false,
          isTemplate: roleData.isTemplate || false,
          color: roleData.color,
          priority: roleData.priority || 0,
          tenantId: tenant.id,
        },
        include: {
          tenant: true,
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return role;
    } catch (error) {
      console.error("Error creating role in DB:", error);
      throw error;
    }
  }

  // ==================== AUDIT LOGS ====================

  async getAuditLogsFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { action: { contains: filters.search, mode: "insensitive" } },
          { details: { contains: filters.search, mode: "insensitive" } },
          { resourceType: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.tenantSlug) {
        where.tenant = {
          slug: filters.tenantSlug,
        };
      }

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.superAdminId) {
        where.superAdminId = filters.superAdminId;
      }

      if (filters.severity) {
        where.severity = filters.severity;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.dateFrom) {
        where.createdAt = {
          gte: new Date(filters.dateFrom),
        };
      }

      if (filters.dateTo) {
        where.createdAt = {
          ...where.createdAt,
          lte: new Date(filters.dateTo),
        };
      }

      const auditLogs = await this.prisma.auditLog.findMany({
        where,
        include: {
          tenant: true,
          user: true,
          superAdmin: true,
        },
        skip: filters.skip || 0,
        take: filters.take || 50,
        orderBy: filters.orderBy || { createdAt: "desc" },
      });

      return auditLogs;
    } catch (error) {
      console.error("Error fetching audit logs from DB:", error);
      return [];
    }
  }

  async createAuditLogInDB(auditData) {
    try {
      const auditLog = await this.prisma.auditLog.create({
        data: {
          action: auditData.action,
          details: auditData.details,
          ipAddress: auditData.ipAddress,
          userAgent: auditData.userAgent,
          newValues: auditData.newValues,
          oldValues: auditData.oldValues,
          requestId: auditData.requestId,
          resourceId: auditData.resourceId,
          resourceType: auditData.resourceType,
          sessionId: auditData.sessionId,
          severity: auditData.severity || "info",
          status: auditData.status || "success",
          tenantId: auditData.tenantId,
          userId: auditData.userId,
          superAdminId: auditData.superAdminId,
        },
        include: {
          tenant: true,
          user: true,
          superAdmin: true,
        },
      });

      return auditLog;
    } catch (error) {
      console.error("Error creating audit log in DB:", error);
      throw error;
    }
  }

  // ==================== NOTIFICATIONS ====================

  async getNotificationsFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { message: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.targetType) {
        where.targetType = filters.targetType;
      }

      const notifications = await this.prisma.notification.findMany({
        where,
        include: {
          superAdmin: true,
          tenant: true,
          userNotifications: {
            include: {
              user: true,
              tenant: true,
            },
          },
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: "desc" },
      });

      return notifications;
    } catch (error) {
      console.error("Error fetching notifications from DB:", error);
      return [];
    }
  }

  async createNotificationInDB(notificationData) {
    try {
      const notification = await this.prisma.notification.create({
        data: {
          title: notificationData.title,
          message: notificationData.message,
          isActive: notificationData.isActive || true,
          priority: notificationData.priority || "medium",
          targetType: notificationData.targetType || "superadmin",
          attachments: notificationData.attachments,
          createdByType: notificationData.createdByType || "superadmin",
          metadata: notificationData.metadata,
          scheduledAt: notificationData.scheduledAt,
          status: notificationData.status || "draft",
          type: notificationData.type || "info",
          createdBy: notificationData.createdBy,
          targetTenantId: notificationData.targetTenantId,
        },
        include: {
          superAdmin: true,
          tenant: true,
          userNotifications: true,
        },
      });

      return notification;
    } catch (error) {
      console.error("Error creating notification in DB:", error);
      throw error;
    }
  }

  // ==================== SUPPORT TICKETS ====================

  async getSupportTicketsFromDB(filters = {}) {
    try {
      const where = {};

      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: "insensitive" } },
          { description: { contains: filters.search, mode: "insensitive" } },
        ];
      }

      if (filters.tenantSlug) {
        where.tenant = {
          slug: filters.tenantSlug,
        };
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.priority) {
        where.priority = filters.priority;
      }

      if (filters.category) {
        where.category = filters.category;
      }

      const tickets = await this.prisma.supportTicket.findMany({
        where,
        include: {
          tenant: true,
          user: true,
          comments: {
            include: {
              user: true,
              attachments: true,
            },
          },
          attachments: true,
        },
        skip: filters.skip || 0,
        take: filters.take || 10,
        orderBy: filters.orderBy || { createdAt: "desc" },
      });

      return tickets;
    } catch (error) {
      console.error("Error fetching support tickets from DB:", error);
      return [];
    }
  }

  // ==================== DASHBOARD STATISTICS ====================

  async getSuperAdminDashboardData() {
    try {
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        totalAuditLogs,
        recentAuditLogs,
        totalNotifications,
        pendingSupportTickets,
        systemStats,
      ] = await Promise.all([
        this.prisma.tenant.count(),
        this.prisma.tenant.count({ where: { isActive: true } }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isActive: true } }),
        this.prisma.auditLog.count(),
        this.prisma.auditLog.findMany({
          take: 10,
          orderBy: { createdAt: "desc" },
          include: { tenant: true, user: true, superAdmin: true },
        }),
        this.prisma.notification.count(),
        this.prisma.supportTicket.count({ where: { status: "OPEN" } }),
        this.getSystemStats(),
      ]);

      return {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          inactive: totalTenants - activeTenants,
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
        },
        auditLogs: {
          total: totalAuditLogs,
          recent: recentAuditLogs,
        },
        notifications: {
          total: totalNotifications,
        },
        support: {
          pending: pendingSupportTickets,
        },
        system: systemStats,
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  }

  async getSystemStats() {
    try {
      const stats = {
        totalSuperAdmins: await this.prisma.superAdmin.count(),
        activeSuperAdmins: await this.prisma.superAdmin.count({
          where: { isActive: true },
        }),
        totalRoles: await this.prisma.role.count(),
        totalModules: await this.prisma.module.count(),
        totalPermissions: await this.prisma.permission.count(),
        recentActivity: await this.prisma.auditLog.findMany({
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { tenant: true, user: true },
        }),
      };

      return stats;
    } catch (error) {
      console.error("Error fetching system stats:", error);
      return {};
    }
  }

  // ==================== CROSS-VERIFICATION METHODS ====================

  async verifyTenantUserSync(tenantSlug, userId) {
    try {
      // Get user from tenant perspective
      const tenantUser = await this.prisma.user.findFirst({
        where: {
          id: userId,
          tenant: { slug: tenantSlug },
        },
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      // Get user from superadmin perspective
      const superAdminUser = await this.prisma.user.findFirst({
        where: {
          id: userId,
        },
        include: {
          tenant: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
      });

      return {
        tenantUser,
        superAdminUser,
        isSync: JSON.stringify(tenantUser) === JSON.stringify(superAdminUser),
      };
    } catch (error) {
      console.error("Error verifying tenant-user sync:", error);
      return { tenantUser: null, superAdminUser: null, isSync: false };
    }
  }

  async verifyAuditLogCreation(action, resourceId, resourceType) {
    try {
      const auditLog = await this.prisma.auditLog.findFirst({
        where: {
          action,
          resourceId,
          resourceType,
        },
        orderBy: { createdAt: "desc" },
        include: {
          tenant: true,
          user: true,
          superAdmin: true,
        },
      });

      return auditLog;
    } catch (error) {
      console.error("Error verifying audit log creation:", error);
      return null;
    }
  }

  // ==================== DATA COMPARISON HELPERS ====================

  compareTenantData(superAdminData, tenantData) {
    const mismatches = [];

    if (superAdminData.name !== tenantData.name) {
      mismatches.push(
        `Name mismatch: SuperAdmin="${superAdminData.name}", Tenant="${tenantData.name}"`
      );
    }

    if (superAdminData.slug !== tenantData.slug) {
      mismatches.push(
        `Slug mismatch: SuperAdmin="${superAdminData.slug}", Tenant="${tenantData.slug}"`
      );
    }

    if (superAdminData.isActive !== tenantData.isActive) {
      mismatches.push(
        `Status mismatch: SuperAdmin="${superAdminData.isActive}", Tenant="${tenantData.isActive}"`
      );
    }

    return {
      matches: mismatches.length === 0,
      mismatches,
    };
  }

  compareUserData(superAdminData, tenantData) {
    const mismatches = [];

    if (superAdminData.name !== tenantData.name) {
      mismatches.push(
        `Name mismatch: SuperAdmin="${superAdminData.name}", Tenant="${tenantData.name}"`
      );
    }

    if (superAdminData.email !== tenantData.email) {
      mismatches.push(
        `Email mismatch: SuperAdmin="${superAdminData.email}", Tenant="${tenantData.email}"`
      );
    }

    if (superAdminData.isActive !== tenantData.isActive) {
      mismatches.push(
        `Status mismatch: SuperAdmin="${superAdminData.isActive}", Tenant="${tenantData.isActive}"`
      );
    }

    return {
      matches: mismatches.length === 0,
      mismatches,
    };
  }

  compareListData(superAdminList, tenantList, keyField = "id") {
    if (superAdminList.length !== tenantList.length) {
      return {
        matches: false,
        mismatches: [
          `Count mismatch: SuperAdmin=${superAdminList.length}, Tenant=${tenantList.length}`,
        ],
      };
    }

    const mismatches = [];
    const superAdminMap = new Map(
      superAdminList.map((item) => [item[keyField], item])
    );
    const tenantMap = new Map(tenantList.map((item) => [item[keyField], item]));

    for (const [key, superAdminItem] of superAdminMap) {
      const tenantItem = tenantMap.get(key);
      if (!tenantItem) {
        mismatches.push(`Item ${key} exists in SuperAdmin but not in Tenant`);
        continue;
      }

      // Compare common fields
      const commonFields = ["name", "email", "isActive", "createdAt"];
      for (const field of commonFields) {
        if (
          superAdminItem[field] &&
          tenantItem[field] &&
          superAdminItem[field] !== tenantItem[field]
        ) {
          mismatches.push(
            `Field ${field} mismatch for ${key}: SuperAdmin="${superAdminItem[field]}", Tenant="${tenantItem[field]}"`
          );
        }
      }
    }

    return {
      matches: mismatches.length === 0,
      mismatches,
    };
  }

  // ==================== INVITE TOKEN MANAGEMENT ====================

  async createInviteToken(tokenData) {
    try {
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      
      return await this.prisma.inviteToken.create({
        data: {
          token: token,
          email: tokenData.email,
          type: tokenData.type || 'superadmin',
          expiresAt: tokenData.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
          isUsed: false,
          superAdminId: tokenData.superAdminId || null,
        },
      });
    } catch (error) {
      console.error("Error creating invite token:", error);
      throw error;
    }
  }

  async getInviteToken(token) {
    try {
      return await this.prisma.inviteToken.findUnique({
        where: { token },
        include: {
          superAdmin: true,
        },
      });
    } catch (error) {
      console.error("Error fetching invite token:", error);
      return null;
    }
  }

  async deleteInviteToken(token) {
    try {
      return await this.prisma.inviteToken.delete({
        where: { token },
      });
    } catch (error) {
      console.error("Error deleting invite token:", error);
      return null;
    }
  }

  async deleteSuperAdminByEmail(email) {
    try {
      return await this.prisma.superAdmin.delete({
        where: { email },
      });
    } catch (error) {
      // If user doesn't exist, that's fine for cleanup
      if (error.code === 'P2025') {
        console.log(`SuperAdmin with email ${email} not found for deletion (already cleaned up)`);
        return null;
      }
      console.error("Error deleting superadmin by email:", error);
      return null;
    }
  }
}

module.exports = SuperAdminDatabaseHelper;
