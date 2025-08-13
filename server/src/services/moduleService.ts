import { ModuleRepository } from '@/repositories/moduleRepository';
import { RoleRepository } from '@/repositories/roleRepository';
import { UserRepository } from '@/repositories/userRepository';
import { AuditRepository } from '@/repositories/auditRepository';
import {
  CreateModuleInput,
  UpdateModuleInput,
  CreateSubmoduleInput,
  UpdateSubmoduleInput,
  ModuleListParams,
  UpdateOrderInput,
} from '@/validation/moduleValidation';

// Menu item interface
export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  type: 'module' | 'submodule';
  orderIndex: number;
  isActive: boolean;
  submodules?: MenuItem[];
  permissions?: {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canViewAll: boolean;
  };
}

export class ModuleService {
  private moduleRepository: ModuleRepository;
  private roleRepository: RoleRepository;
  private userRepository: UserRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.moduleRepository = new ModuleRepository();
    this.roleRepository = new RoleRepository();
    this.userRepository = new UserRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Create a new module
   */
  async createModule(
    data: CreateModuleInput,
    auditUserId?: string
  ): Promise<any> {
    // Create module
    const module = await this.moduleRepository.create(data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'MODULE_CREATED',
        '127.0.0.1',
        { moduleId: module.id, name: module.name }
      );
    }

    return module;
  }

  /**
   * Get module by ID
   */
  async getModuleById(id: string): Promise<any> {
    const module = await this.moduleRepository.findById(id);
    if (!module) {
      throw new Error('Module not found');
    }
    return module;
  }

  /**
   * List modules with filters, pagination, and search
   */
  async listModules(
    params: ModuleListParams
  ): Promise<{ modules: any[]; total: number; meta: any }> {
    const { page, limit, filters, orderBy, orderDirection } = params;

    // Build orderBy object
    const orderByObj = { [orderBy]: orderDirection };

    // Get modules and total count
    const [modules, total] = await Promise.all([
      this.moduleRepository.findMany({
        page,
        limit,
        filters,
        orderBy: orderByObj,
      }),
      this.moduleRepository.count(filters),
    ]);

    return {
      modules,
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
   * Update module
   */
  async updateModule(
    id: string,
    data: UpdateModuleInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if module exists
    const existingModule = await this.moduleRepository.findById(id);
    if (!existingModule) {
      throw new Error('Module not found');
    }

    // Update module
    const module = await this.moduleRepository.update(id, data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'MODULE_UPDATED',
        '127.0.0.1',
        { moduleId: module.id, updatedFields: Object.keys(data) }
      );
    }

    return module;
  }

  /**
   * Delete module
   */
  async deleteModule(id: string, auditUserId?: string): Promise<any> {
    // Check if module exists
    const existingModule = await this.moduleRepository.findById(id);
    if (!existingModule) {
      throw new Error('Module not found');
    }

    // Check if module has submodules
    const submodules = await this.moduleRepository.getSubmodulesByModuleId(id);
    if (submodules.length > 0) {
      throw new Error('Cannot delete module with existing submodules');
    }

    // Delete module
    const module = await this.moduleRepository.delete(id);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'MODULE_DELETED',
        '127.0.0.1',
        { moduleId: module.id, name: module.name }
      );
    }

    return module;
  }

  /**
   * Create a new submodule
   */
  async createSubmodule(
    data: CreateSubmoduleInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if parent module exists
    const parentModule = await this.moduleRepository.findById(data.moduleId);
    if (!parentModule) {
      throw new Error('Parent module not found');
    }

    // Create submodule
    const submodule = await this.moduleRepository.createSubmodule(
      data.moduleId,
      data
    );

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'SUBMODULE_CREATED',
        '127.0.0.1',
        {
          submoduleId: submodule.id,
          moduleId: data.moduleId,
          name: submodule.name,
        }
      );
    }

    return submodule;
  }

  /**
   * Get submodule by ID
   */
  async getSubmoduleById(id: string): Promise<any> {
    const submodule = await this.moduleRepository.getSubmoduleById(id);
    if (!submodule) {
      throw new Error('Submodule not found');
    }
    return submodule;
  }

  /**
   * Update submodule
   */
  async updateSubmodule(
    id: string,
    data: UpdateSubmoduleInput,
    auditUserId?: string
  ): Promise<any> {
    // Check if submodule exists
    const existingSubmodule = await this.moduleRepository.getSubmoduleById(id);
    if (!existingSubmodule) {
      throw new Error('Submodule not found');
    }

    // Update submodule
    const submodule = await this.moduleRepository.updateSubmodule(id, data);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'SUBMODULE_UPDATED',
        '127.0.0.1',
        { submoduleId: submodule.id, updatedFields: Object.keys(data) }
      );
    }

    return submodule;
  }

  /**
   * Delete submodule
   */
  async deleteSubmodule(id: string, auditUserId?: string): Promise<any> {
    // Check if submodule exists
    const existingSubmodule = await this.moduleRepository.getSubmoduleById(id);
    if (!existingSubmodule) {
      throw new Error('Submodule not found');
    }

    // Delete submodule
    const submodule = await this.moduleRepository.deleteSubmodule(id);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'SUBMODULE_DELETED',
        '127.0.0.1',
        { submoduleId: submodule.id, name: submodule.name }
      );
    }

    return submodule;
  }

  /**
   * Get submodules by module ID
   */
  async getSubmodulesByModuleId(moduleId: string): Promise<any[]> {
    // Check if module exists
    const module = await this.moduleRepository.findById(moduleId);
    if (!module) {
      throw new Error('Module not found');
    }

    return this.moduleRepository.getSubmodulesByModuleId(moduleId);
  }

  /**
   * Update module order
   */
  async updateModuleOrder(
    data: UpdateOrderInput,
    auditUserId?: string
  ): Promise<void> {
    // Update module order
    await this.moduleRepository.updateModuleOrder(data.items);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'MODULE_ORDER_UPDATED',
        '127.0.0.1',
        { items: data.items }
      );
    }
  }

  /**
   * Update submodule order
   */
  async updateSubmoduleOrder(
    data: UpdateOrderInput,
    auditUserId?: string
  ): Promise<void> {
    // Update submodule order
    await this.moduleRepository.updateSubmoduleOrder(data.items);

    // Log audit
    if (auditUserId) {
      await this.auditRepository.logUserAction(
        auditUserId,
        null,
        'SUBMODULE_ORDER_UPDATED',
        '127.0.0.1',
        { items: data.items }
      );
    }
  }

  /**
   * Get menu for user (filtered by permissions and active status)
   */
  async getMenuForUser(userId: string): Promise<MenuItem[]> {
    // Get user with roles
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user roles
    const userRoles = await this.userRepository.getUserRoles(userId);
    const roleIds = userRoles.map((role: any) => role.roleId);

    // Get all active modules
    const modules = await this.moduleRepository.findMany({
      filters: { isActive: true },
      orderBy: { orderIndex: 'asc' },
    });

    // Build menu tree
    const menu: MenuItem[] = [];

    for (const module of modules) {
      // Get submodules for this module
      const submodules = await this.moduleRepository.getSubmodulesByModuleId(
        module.id
      );
      const activeSubmodules = submodules.filter((sub: any) => sub.isActive);

      // Check if user has any permissions for this module or its submodules
      const hasModulePermissions = await this.checkModulePermissions(
        module.id,
        roleIds
      );
      const hasSubmodulePermissions = await this.checkSubmodulePermissions(
        activeSubmodules.map((sub: any) => sub.id),
        roleIds
      );

      if (hasModulePermissions || hasSubmodulePermissions) {
        const menuItem: MenuItem = {
          id: module.id,
          name: module.name,
          description: module.description,
          type: 'module',
          orderIndex: module.orderIndex,
          isActive: module.isActive,
          submodules: [],
          permissions: await this.getEffectivePermissions(
            module.id,
            null,
            roleIds
          ),
        };

        // Add submodules with permissions
        for (const submodule of activeSubmodules) {
          const submodulePermissions = await this.getEffectivePermissions(
            module.id,
            submodule.id,
            roleIds
          );

          if (submodulePermissions.canRead) {
            menuItem.submodules!.push({
              id: submodule.id,
              name: submodule.name,
              description: submodule.description,
              type: 'submodule',
              orderIndex: submodule.orderIndex,
              isActive: submodule.isActive,
              permissions: submodulePermissions,
            });
          }
        }

        // Sort submodules by order index
        if (menuItem.submodules) {
          menuItem.submodules.sort((a, b) => a.orderIndex - b.orderIndex);
        }

        menu.push(menuItem);
      }
    }

    return menu;
  }

  /**
   * Get all modules with submodules (for admin)
   */
  async getAllModulesWithSubmodules(): Promise<any[]> {
    const modules = await this.moduleRepository.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    const modulesWithSubmodules = await Promise.all(
      modules.map(async (module: any) => {
        const submodules = await this.moduleRepository.getSubmodulesByModuleId(
          module.id
        );
        return {
          ...module,
          submodules: submodules.sort(
            (a: any, b: any) => a.orderIndex - b.orderIndex
          ),
        };
      })
    );

    return modulesWithSubmodules;
  }

  /**
   * Check if user has permissions for a module
   */
  private async checkModulePermissions(
    moduleId: string,
    roleIds: string[]
  ): Promise<boolean> {
    if (roleIds.length === 0) return false;

    const permissions = await this.roleRepository.getRolePermissionsByModule(
      moduleId,
      roleIds
    );
    return permissions.some((perm: any) => perm.canRead);
  }

  /**
   * Check if user has permissions for submodules
   */
  private async checkSubmodulePermissions(
    submoduleIds: string[],
    roleIds: string[]
  ): Promise<boolean> {
    if (roleIds.length === 0 || submoduleIds.length === 0) return false;

    const permissions =
      await this.roleRepository.getRolePermissionsBySubmodules(
        submoduleIds,
        roleIds
      );
    return permissions.some((perm: any) => perm.canRead);
  }

  /**
   * Get effective permissions for a module/submodule
   */
  private async getEffectivePermissions(
    moduleId: string,
    submoduleId: string | null,
    roleIds: string[]
  ): Promise<any> {
    if (roleIds.length === 0) {
      return {
        canCreate: false,
        canRead: false,
        canUpdate: false,
        canDelete: false,
        canViewAll: false,
      };
    }

    const permissions = submoduleId
      ? await this.roleRepository.getRolePermissionsBySubmodule(
          moduleId,
          submoduleId,
          roleIds
        )
      : await this.roleRepository.getRolePermissionsByModule(moduleId, roleIds);

    // Merge permissions from all roles (OR logic)
    const effectivePermissions = {
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
   * Get module statistics
   */
  async getModuleStats(): Promise<any> {
    const [totalModules, activeModules, totalSubmodules, activeSubmodules] =
      await Promise.all([
        this.moduleRepository.count(),
        this.moduleRepository.count({ isActive: true }),
        this.moduleRepository.countSubmodules(),
        this.moduleRepository.countSubmodules({ isActive: true }),
      ]);

    return {
      totalModules,
      activeModules,
      inactiveModules: totalModules - activeModules,
      totalSubmodules,
      activeSubmodules,
      inactiveSubmodules: totalSubmodules - activeSubmodules,
    };
  }
}
