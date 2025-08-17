import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

interface ModuleWithChildren {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  parentId: string | null;
  isActive: boolean;
  orderIndex: number;
  createdAt: Date;
  updatedAt: Date;
  parent?: ModuleWithChildren | null;
  children?: ModuleWithChildren[];
  submodules?: any[];
}

export const moduleController = {
  // Get all modules with hierarchical structure
  async getAllModules(_req: Request, res: Response) {
    try {
      const modules = await prisma.module.findMany({
        where: {
          isActive: true,
        },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
          submodules: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      // Build hierarchical structure
      const buildHierarchy = (
        modules: ModuleWithChildren[],
        parentId: string | null = null
      ): ModuleWithChildren[] => {
        return modules
          .filter(module => module.parentId === parentId)
          .map(module => ({
            ...module,
            children: buildHierarchy(modules, module.id),
          }));
      };

      const hierarchicalModules = buildHierarchy(modules);

      return successResponse(
        res,
        hierarchicalModules,
        'Modules retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching modules:', error);
      return errorResponse(res, 'Failed to fetch modules', 500);
    }
  },

  // Get single module by ID
  async getModuleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const module = await prisma.module.findUnique({
        where: { id },
        include: {
          parent: true,
          children: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
          submodules: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      });

      if (!module) {
        return errorResponse(res, 'Module not found', 404);
      }

      return successResponse(res, module, 'Module retrieved successfully');
    } catch (error) {
      logger.error('Error fetching module:', error);
      return errorResponse(res, 'Failed to fetch module', 500);
    }
  },

  // Create new module
  async createModule(req: Request, res: Response) {
    try {
      const { name, description, icon, parentId, orderIndex } = req.body;

      // Validate required fields
      if (!name) {
        return errorResponse(res, 'Module name is required', 400);
      }

      // Check if parent module exists if parentId is provided
      if (parentId) {
        const parentModule = await prisma.module.findUnique({
          where: { id: parentId },
        });
        if (!parentModule) {
          return errorResponse(res, 'Parent module not found', 404);
        }
      }

      const module = await prisma.module.create({
        data: {
          name,
          description,
          icon: icon || 'FileText',
          parentId: parentId || null,
          orderIndex: orderIndex || 0,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      return successResponse(res, module, 'Module created successfully', 201);
    } catch (error) {
      logger.error('Error creating module:', error);
      return errorResponse(res, 'Failed to create module', 500);
    }
  },

  // Update module
  async updateModule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, icon, parentId, orderIndex } = req.body;

      // Check if module exists
      const existingModule = await prisma.module.findUnique({
        where: { id },
      });

      if (!existingModule) {
        return errorResponse(res, 'Module not found', 404);
      }

      // Validate required fields
      if (!name) {
        return errorResponse(res, 'Module name is required', 400);
      }

      // Check if parent module exists if parentId is provided
      if (parentId) {
        const parentModule = await prisma.module.findUnique({
          where: { id: parentId },
        });
        if (!parentModule) {
          return errorResponse(res, 'Parent module not found', 404);
        }

        // Prevent circular reference
        if (parentId === id) {
          return errorResponse(res, 'Module cannot be its own parent', 400);
        }
      }

      const module = await prisma.module.update({
        where: { id },
        data: {
          name,
          description,
          icon: icon || 'FileText',
          parentId: parentId || null,
          orderIndex:
            orderIndex !== undefined ? orderIndex : existingModule.orderIndex,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      return successResponse(res, module, 'Module updated successfully');
    } catch (error) {
      logger.error('Error updating module:', error);
      return errorResponse(res, 'Failed to update module', 500);
    }
  },

  // Delete module
  async deleteModule(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if module exists
      const existingModule = await prisma.module.findUnique({
        where: { id },
        include: {
          children: true,
          submodules: true,
        },
      });

      if (!existingModule) {
        return errorResponse(res, 'Module not found', 404);
      }

      // Check if module has children or submodules
      if (
        existingModule.children.length > 0 ||
        existingModule.submodules.length > 0
      ) {
        return errorResponse(
          res,
          'Cannot delete module with children or submodules',
          400
        );
      }

      await prisma.module.delete({
        where: { id },
      });

      return successResponse(res, null, 'Module deleted successfully');
    } catch (error) {
      logger.error('Error deleting module:', error);
      return errorResponse(res, 'Failed to delete module', 500);
    }
  },

  // Toggle module status
  async toggleModuleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingModule = await prisma.module.findUnique({
        where: { id },
      });

      if (!existingModule) {
        return errorResponse(res, 'Module not found', 404);
      }

      const module = await prisma.module.update({
        where: { id },
        data: {
          isActive: !existingModule.isActive,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      return successResponse(
        res,
        module,
        `Module ${module.isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      logger.error('Error toggling module status:', error);
      return errorResponse(res, 'Failed to toggle module status', 500);
    }
  },

  // Reorder modules
  async reorderModules(req: Request, res: Response) {
    try {
      const { modules } = req.body;

      if (!Array.isArray(modules)) {
        return errorResponse(res, 'Modules array is required', 400);
      }

      // Update order for each module
      const updatePromises = modules.map((module: any) =>
        prisma.module.update({
          where: { id: module.id },
          data: { orderIndex: module.orderIndex },
        })
      );

      await Promise.all(updatePromises);

      return successResponse(res, null, 'Modules reordered successfully');
    } catch (error) {
      logger.error('Error reordering modules:', error);
      return errorResponse(res, 'Failed to reorder modules', 500);
    }
  },

  // Get modules for menu (active modules only)
  async getMenuModules(_req: Request, res: Response) {
    try {
      const modules = await prisma.module.findMany({
        where: {
          isActive: true,
        },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
          submodules: {
            where: { isActive: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      // Build hierarchical structure for menu
      const buildMenuHierarchy = (
        modules: ModuleWithChildren[],
        parentId: string | null = null
      ): any[] => {
        return modules
          .filter(module => module.parentId === parentId)
          .map(module => ({
            id: module.id,
            name: module.name,
            description: module.description,
            icon: module.icon,
            orderIndex: module.orderIndex,
            children: buildMenuHierarchy(modules, module.id),
            submodules: module.submodules,
          }));
      };

      const menuModules = buildMenuHierarchy(modules);

      return successResponse(
        res,
        menuModules,
        'Menu modules retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching menu modules:', error);
      return errorResponse(res, 'Failed to fetch menu modules', 500);
    }
  },
};
