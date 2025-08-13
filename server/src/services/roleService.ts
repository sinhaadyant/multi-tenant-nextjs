import { RoleRepository } from '@/repositories/roleRepository';
import { UserRepository } from '@/repositories/userRepository';
import { AuditRepository } from '@/repositories/auditRepository';
import {
  CreateRoleInput,
  UpdateRoleInput,
  RoleFilters,
  RoleListParams,
  AssignUserToRole,
  RemoveUserFromRole,
} from '@/validation/roleValidation';

export class RoleService {
  private roleRepository: RoleRepository;
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create a new role
   */
  async createRole(data: CreateRoleInput, auditUserId?: string): Promise<any> {
    // Check if role with same name already exists in the same tenant/global scope
    const existingRole = await this.roleRepository.findByName(
      data.name,
      data.tenantId
    );
    if (existingRole) {
      throw new Error('Role with this name already exists');
    }

    // Create role
    const role = await this.roleRepository.create(data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        data.tenantId || null,
        'ROLE_CREATED',
        '127.0.0.1',
        { roleId: role.id, name: role.name, isGlobal: role.isGlobal }
      );
    }

    return role;
  }

  /**
   * Get role by ID
   */
  async getRoleById(id: string): Promise<any> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  /**
   * List roles with filters, pagination, and search
   */
  async listRoles(
    params: RoleListParams
  ): Promise<{ roles: any[]; total: number; meta: any }> {
    const { page, limit, filters, orderBy, orderDirection } = params;

    // Build orderBy object
    const orderByObj = { [orderBy]: orderDirection };

    // Get roles and total count
    const [roles, total] = await Promise.all([
      this.roleRepository.findMany({
        page,
        limit,
        filters,
        orderBy: orderByObj,
      }),
      this.roleRepository.count(filters),
    ]);

    return {
      roles,
      total,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update role
   */
  async updateRole(
    id: string,
    data: UpdateRoleInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if role exists
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Check if name is being updated and if it's already taken
    if (data.name && data.name !== existingRole.name) {
      const roleWithName = await this.roleRepository.findByName(
        data.name,
        existingRole.tenantId
      );
      if (roleWithName && roleWithName.id !== id) {
        throw new Error('Role name is already taken');
      }
    }

    // Update role
    const role = await this.roleRepository.update(id, data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        role.tenantId,
        'ROLE_UPDATED',
        '127.0.0.1',
        { roleId: role.id, updatedFields: Object.keys(data) }
      );
    }

    return role;
  }

  /**
   * Delete role
   */
  async deleteRole(id: string, auditUserId?: string): Promise<any> {
    // Check if role exists
    const existingRole = await this.roleRepository.findById(id);
    if (!existingRole) {
      throw new Error('Role not found');
    }

    // Check if role has users assigned
    const usersWithRole = await this.roleRepository.getUsersWithRole(id);
    if (usersWithRole.length > 0) {
      throw new Error('Cannot delete role with assigned users');
    }

    // Delete role
    const role = await this.roleRepository.delete(id);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        role.tenantId,
        'ROLE_DELETED',
        '127.0.0.1',
        { roleId: role.id, name: role.name }
      );
    }

    return role;
  }

  /**
   * Get role with users
   */
  async getRoleWithUsers(id: string): Promise<any> {
    const role = await this.roleRepository.getRoleWithUsers(id);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  /**
   * Get role with permissions
   */
  async getRoleWithPermissions(id: string): Promise<any> {
    const role = await this.roleRepository.getRoleWithPermissions(id);
    if (!role) {
      throw new Error('Role not found');
    }
    return role;
  }

  /**
   * Assign user to role
   */
  async assignUserToRole(
    data: AssignUserToRole,
    auditUserId?: string
  ): Promise<void> {
    const { userId, roleId } = data;

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user is already assigned to this role
    const existingAssignment = await this.roleRepository.getUserRole(
      userId,
      roleId
    );
    if (existingAssignment) {
      throw new Error('User is already assigned to this role');
    }

    // Assign user to role
    await this.roleRepository.assignUserToRole(userId, roleId);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'USER_ROLE_ASSIGNED',
        '127.0.0.1',
        { userId, roleId, roleName: role.name }
      );
    }
  }

  /**
   * Remove user from role
   */
  async removeUserFromRole(
    data: RemoveUserFromRole,
    auditUserId?: string
  ): Promise<void> {
    const { userId, roleId } = data;

    // Check if user exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if user is assigned to this role
    const existingAssignment = await this.roleRepository.getUserRole(
      userId,
      roleId
    );
    if (!existingAssignment) {
      throw new Error('User is not assigned to this role');
    }

    // Remove user from role
    await this.roleRepository.removeUserFromRole(userId, roleId);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        user.tenantId,
        'USER_ROLE_REMOVED',
        '127.0.0.1',
        { userId, roleId, roleName: role.name }
      );
    }
  }

  /**
   * Get users with role
   */
  async getUsersWithRole(roleId: string): Promise<any[]> {
    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    return this.roleRepository.getUsersWithRole(roleId);
  }

  /**
   * Get global roles
   */
  async getGlobalRoles(): Promise<any[]> {
    return this.roleRepository.findMany({
      filters: { isGlobal: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get tenant roles
   */
  async getTenantRoles(tenantId: string): Promise<any[]> {
    return this.roleRepository.findMany({
      filters: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get role statistics
   */
  async getRoleStats(tenantId?: string): Promise<any> {
    const filters: RoleFilters = {};
    if (tenantId) {
      filters.tenantId = tenantId;
    }

    const [totalRoles, globalRoles, tenantRoles] = await Promise.all([
      this.roleRepository.count(filters),
      this.roleRepository.count({ ...filters, isGlobal: true }),
      this.roleRepository.count({ ...filters, isGlobal: false }),
    ]);

    return {
      totalRoles,
      globalRoles,
      tenantRoles,
    };
  }

  /**
   * Get roles by tenant
   */
  async getRolesByTenant(tenantId: string): Promise<any[]> {
    return this.roleRepository.findMany({
      filters: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get all roles (global and tenant-specific)
   */
  async getAllRoles(): Promise<any[]> {
    return this.roleRepository.findMany({
      orderBy: { name: 'asc' },
    });
  }
}
