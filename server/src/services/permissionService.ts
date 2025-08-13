import { RoleRepository } from '@/repositories/roleRepository';
import { ModuleRepository } from '@/repositories/moduleRepository';
import { UserRepository } from '@/repositories/userRepository';
import { AuditRepository } from '@/repositories/auditRepository';
import { Permission, BulkPermissionUpdate } from '@/validation/roleValidation';

// Effective permissions interface
export interface EffectivePermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canViewAll: boolean;
}

// Permission matrix item interface
export interface PermissionMatrixItem {
  moduleId: string;
  moduleName: string;
  submoduleId?: string;
  submoduleName?: string;
  permissions: EffectivePermissions;
}

export class PermissionService {
  private roleRepository: RoleRepository;
  private moduleRepository: ModuleRepository;
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.roleRepository = new RoleRepository();
    this.moduleRepository = new ModuleRepository();
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create permission for a role
   */
  async createPermission(
    roleId: string,
    permission: Permission,
    auditUserId?: string
  ): Promise<any> {
    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Check if module exists
    const module = await this.moduleRepository.findById(permission.moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    // Check if submodule exists (if provided)
    if (permission.submoduleId) {
      const submodule = await this.moduleRepository.getSubmoduleById(
        permission.submoduleId
      );
      if (!submodule) {
        throw new Error('Submodule not found');
      }
    }

    // Create permission
    const createdPermission = await this.roleRepository.createPermission(
      roleId,
      permission
    );

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        role.tenantId,
        'PERMISSION_CREATED',
        '127.0.0.1',
        { roleId, permission }
      );
    }

    return createdPermission;
  }

  /**
   * Update permission for a role
   */
  async updatePermission(
    roleId: string,
    moduleId: string,
    submoduleId: string | null,
    permission: Partial<Permission>,
    auditUserId?: string
  ): Promise<any> {
    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Update permission
    const updatedPermission = await this.roleRepository.updatePermission(
      roleId,
      moduleId,
      submoduleId,
      permission
    );

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        role.tenantId,
        'PERMISSION_UPDATED',
        '127.0.0.1',
        { roleId, moduleId, submoduleId, permission }
      );
    }

    return updatedPermission;
  }

  /**
   * Delete permission for a role
   */
  async deletePermission(
    roleId: string,
    moduleId: string,
    submoduleId: string | null,
    auditUserId?: string
  ): Promise<any> {
    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Delete permission
    const deletedPermission = await this.roleRepository.deletePermission(
      roleId,
      moduleId,
      submoduleId
    );

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        role.tenantId,
        'PERMISSION_DELETED',
        '127.0.0.1',
        { roleId, moduleId, submoduleId }
      );
    }

    return deletedPermission;
  }

  /**
   * Apply bulk permission updates
   */
  async applyBulkPermissionUpdate(
    data: BulkPermissionUpdate,
    auditUserId?: string
  ): Promise<void> {
    const { roleId, permissions } = data;

    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Validate all modules and submodules exist
    for (const permission of permissions) {
      const module = await this.moduleRepository.findById(permission.moduleId);
      if (!module) {
        throw new Error(`Module not found: ${permission.moduleId}`);
      }

      if (permission.submoduleId) {
        const submodule = await this.moduleRepository.getSubmoduleById(
          permission.submoduleId
        );
        if (!submodule) {
          throw new Error(`Submodule not found: ${permission.submoduleId}`);
        }
      }
    }

    // Apply bulk updates
    await this.roleRepository.applyBulkPermissionUpdate(roleId, permissions);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        role.tenantId,
        'BULK_PERMISSION_UPDATE',
        '127.0.0.1',
        { roleId, permissionsCount: permissions.length }
      );
    }
  }

  /**
   * Get permission matrix for a role
   */
  async getPermissionMatrix(
    roleId: string,
    moduleId?: string
  ): Promise<PermissionMatrixItem[]> {
    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    // Get all modules
    const modules = moduleId
      ? [await this.moduleRepository.findById(moduleId)]
      : await this.moduleRepository.findMany({ filters: { isActive: true } });

    const matrix: PermissionMatrixItem[] = [];

    for (const module of modules) {
      if (!module) continue;

      // Get module permissions
      const modulePermissions =
        await this.roleRepository.getRolePermissionsByModule(roleId, [roleId]);
      const modulePermission = modulePermissions.find(
        (p: any) => p.moduleId === module.id
      );

      matrix.push({
        moduleId: module.id,
        moduleName: module.name,
        permissions: modulePermission
          ? {
              canCreate: modulePermission.canCreate,
              canRead: modulePermission.canRead,
              canUpdate: modulePermission.canUpdate,
              canDelete: modulePermission.canDelete,
              canViewAll: modulePermission.canViewAll,
            }
          : {
              canCreate: false,
              canRead: false,
              canUpdate: false,
              canDelete: false,
              canViewAll: false,
            },
      });

      // Get submodules for this module
      const submodules = await this.moduleRepository.getSubmodulesByModuleId(
        module.id
      );
      const activeSubmodules = submodules.filter((sub: any) => sub.isActive);

      for (const submodule of activeSubmodules) {
        // Get submodule permissions
        const submodulePermissions =
          await this.roleRepository.getRolePermissionsBySubmodule(
            module.id,
            submodule.id,
            [roleId]
          );
        const submodulePermission = submodulePermissions.find(
          (p: any) => p.submoduleId === submodule.id
        );

        matrix.push({
          moduleId: module.id,
          moduleName: module.name,
          submoduleId: submodule.id,
          submoduleName: submodule.name,
          permissions: submodulePermission
            ? {
                canCreate: submodulePermission.canCreate,
                canRead: submodulePermission.canRead,
                canUpdate: submodulePermission.canUpdate,
                canDelete: submodulePermission.canDelete,
                canViewAll: submodulePermission.canViewAll,
              }
            : {
                canCreate: false,
                canRead: false,
                canUpdate: false,
                canDelete: false,
                canViewAll: false,
              },
        });
      }
    }

    return matrix;
  }

  /**
   * Get effective permissions for a user
   */
  async getEffectivePermissions(
    userId: string,
    moduleId?: string,
    submoduleId?: string
  ): Promise<EffectivePermissions> {
    // Get user with roles
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user roles
    const userRoles = await this.userRepository.getUserRoles(userId);
    const roleIds = userRoles.map((role: any) => role.roleId);

    if (roleIds.length === 0) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
      };
    }

    // Get permissions for the specified module/submodule
    let permissions: any[] = [];
    if (submoduleId) {
      permissions = await this.roleRepository.getRolePermissionsBySubmodule(
        moduleId!,
        submoduleId,
        roleIds
      );
    } else if (moduleId) {
      permissions = await this.roleRepository.getRolePermissionsByModule(
        moduleId,
        roleIds
      );
    } else {
      // Get all permissions for the user's roles
      permissions =
        await this.roleRepository.getRolePermissionsByRoles(roleIds);
    }

    // Merge permissions from all roles (OR logic)
    const effectivePermissions: EffectivePermissions = {
      canCreate: false,
      canRead: false,
      canUpdate: false,
      canDelete: false,
      canViewAll: false,
    };

    for (const permission of permissions) {
      effectivePermissions.canCreate =
        effectivePermissions.canCreate || permission.canCreate;
      effectivePermissions.canRead =
        effectivePermissions.canRead || permission.canRead;
      effectivePermissions.canUpdate =
        effectivePermissions.canUpdate || permission.canUpdate;
      effectivePermissions.canDelete =
        effectivePermissions.canDelete || permission.canDelete;
      effectivePermissions.canViewAll =
        effectivePermissions.canViewAll || permission.canViewAll;
    }

    return effectivePermissions;
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    moduleId: string,
    submoduleId: string | null,
    permission: keyof EffectivePermissions
  ): Promise<boolean> {
    const effectivePermissions = await this.getEffectivePermissions(
      userId,
      moduleId,
      submoduleId || undefined
    );
    return effectivePermissions[permission];
  }

  /**
   * Get all permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<any[]> {
    // Check if role exists
    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    return this.roleRepository.getRolePermissions(roleId);
  }

  /**
   * Get permissions by module
   */
  async getPermissionsByModule(moduleId: string): Promise<any[]> {
    // Check if module exists
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    return this.roleRepository.getPermissionsByModule(moduleId);
  }

  /**
   * Get permissions by submodule
   */
  async getPermissionsBySubmodule(
    moduleId: string,
    submoduleId: string
  ): Promise<any[]> {
    // Check if submodule exists
    const submodule = await this.moduleRepository.getSubmoduleById(submoduleId);
    if (!submodule) {
      throw new Error('Submodule not found');
    }

    return this.roleRepository.getPermissionsBySubmodule(moduleId, submoduleId);
  }

  /**
   * Copy permissions from one role to another
   */
  async copyPermissions(
    sourceRoleId: string,
    targetRoleId: string,
    auditUserId?: string
  ): Promise<void> {
    // Check if both roles exist
    const sourceRole = await this.roleRepository.findById(sourceRoleId);
    const targetRole = await this.roleRepository.findById(targetRoleId);

    if (!sourceRole) {
      throw new Error('Source role not found');
    }
    if (!targetRole) {
      throw new Error('Target role not found');
    }

    // Get source role permissions
    const sourcePermissions =
      await this.roleRepository.getRolePermissions(sourceRoleId);

    // Apply permissions to target role
    const targetPermissions = sourcePermissions.map((perm: any) => ({
      moduleId: perm.moduleId,
      submoduleId: perm.submoduleId,
      canCreate: perm.canCreate,
      canRead: perm.canRead,
      canUpdate: perm.canUpdate,
      canDelete: perm.canDelete,
      canViewAll: perm.canViewAll,
    }));

    await this.roleRepository.applyBulkPermissionUpdate(
      targetRoleId,
      targetPermissions
    );

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        targetRole.tenantId,
        'PERMISSIONS_COPIED',
        '127.0.0.1',
        {
          sourceRoleId,
          targetRoleId,
          permissionsCount: targetPermissions.length,
        }
      );
    }
  }

  /**
   * Get permission statistics
   */
  async getPermissionStats(roleId?: string): Promise<any> {
    if (roleId) {
      const permissions = await this.roleRepository.getRolePermissions(roleId);
      return {
        totalPermissions: permissions.length,
        modulePermissions: permissions.filter((p: any) => !p.submoduleId)
          .length,
        submodulePermissions: permissions.filter((p: any) => p.submoduleId)
          .length,
      };
    }

    // Get overall statistics
    const allPermissions = await this.roleRepository.getAllPermissions();
    return {
      totalPermissions: allPermissions.length,
      modulePermissions: allPermissions.filter((p: any) => !p.submoduleId)
        .length,
      submodulePermissions: allPermissions.filter((p: any) => p.submoduleId)
        .length,
    };
  }
}
