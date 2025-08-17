import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../utils/apiResponse';
import { logger } from '../config/logger';

const prisma = new PrismaClient();

export const submoduleController = {
  // Get all submodules
  async getAllSubmodules(_req: Request, res: Response) {
    try {
      const submodules = await prisma.submodule.findMany({
        where: {
          isActive: true,
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { orderIndex: 'asc' },
      });

      return successResponse(
        res,
        submodules,
        'Submodules retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching submodules:', error);
      return errorResponse(res, 'Failed to fetch submodules', 500);
    }
  },

  // Get single submodule by ID
  async getSubmoduleById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const submodule = await prisma.submodule.findUnique({
        where: { id },
        include: {
          module: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!submodule) {
        return errorResponse(res, 'Submodule not found', 404);
      }

      return successResponse(
        res,
        submodule,
        'Submodule retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching submodule:', error);
      return errorResponse(res, 'Failed to fetch submodule', 500);
    }
  },

  // Create new submodule
  async createSubmodule(req: Request, res: Response) {
    try {
      const { name, description, moduleId, orderIndex } = req.body;

      // Validate required fields
      if (!name) {
        return errorResponse(res, 'Submodule name is required', 400);
      }

      if (!moduleId) {
        return errorResponse(res, 'Module ID is required', 400);
      }

      // Check if parent module exists
      const parentModule = await prisma.module.findUnique({
        where: { id: moduleId },
      });
      if (!parentModule) {
        return errorResponse(res, 'Parent module not found', 404);
      }

      const submodule = await prisma.submodule.create({
        data: {
          name,
          description,
          moduleId,
          orderIndex: orderIndex || 0,
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse(
        res,
        submodule,
        'Submodule created successfully',
        201
      );
    } catch (error) {
      logger.error('Error creating submodule:', error);
      return errorResponse(res, 'Failed to create submodule', 500);
    }
  },

  // Update submodule
  async updateSubmodule(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, moduleId, orderIndex } = req.body;

      // Check if submodule exists
      const existingSubmodule = await prisma.submodule.findUnique({
        where: { id },
      });

      if (!existingSubmodule) {
        return errorResponse(res, 'Submodule not found', 404);
      }

      // Validate required fields
      if (!name) {
        return errorResponse(res, 'Submodule name is required', 400);
      }

      if (!moduleId) {
        return errorResponse(res, 'Module ID is required', 400);
      }

      // Check if parent module exists
      const parentModule = await prisma.module.findUnique({
        where: { id: moduleId },
      });
      if (!parentModule) {
        return errorResponse(res, 'Parent module not found', 404);
      }

      const submodule = await prisma.submodule.update({
        where: { id },
        data: {
          name,
          description,
          moduleId,
          orderIndex:
            orderIndex !== undefined
              ? orderIndex
              : existingSubmodule.orderIndex,
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse(res, submodule, 'Submodule updated successfully');
    } catch (error) {
      logger.error('Error updating submodule:', error);
      return errorResponse(res, 'Failed to update submodule', 500);
    }
  },

  // Delete submodule
  async deleteSubmodule(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Check if submodule exists
      const existingSubmodule = await prisma.submodule.findUnique({
        where: { id },
      });

      if (!existingSubmodule) {
        return errorResponse(res, 'Submodule not found', 404);
      }

      await prisma.submodule.delete({
        where: { id },
      });

      return successResponse(res, null, 'Submodule deleted successfully');
    } catch (error) {
      logger.error('Error deleting submodule:', error);
      return errorResponse(res, 'Failed to delete submodule', 500);
    }
  },

  // Toggle submodule status
  async toggleSubmoduleStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const existingSubmodule = await prisma.submodule.findUnique({
        where: { id },
      });

      if (!existingSubmodule) {
        return errorResponse(res, 'Submodule not found', 404);
      }

      const submodule = await prisma.submodule.update({
        where: { id },
        data: {
          isActive: !existingSubmodule.isActive,
        },
        include: {
          module: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return successResponse(
        res,
        submodule,
        `Submodule ${submodule.isActive ? 'activated' : 'deactivated'} successfully`
      );
    } catch (error) {
      logger.error('Error toggling submodule status:', error);
      return errorResponse(res, 'Failed to toggle submodule status', 500);
    }
  },

  // Get submodules by module ID
  async getSubmodulesByModuleId(req: Request, res: Response) {
    try {
      const { moduleId } = req.params;

      // Check if module exists
      const module = await prisma.module.findUnique({
        where: { id: moduleId },
      });

      if (!module) {
        return errorResponse(res, 'Module not found', 404);
      }

      const submodules = await prisma.submodule.findMany({
        where: {
          moduleId,
          isActive: true,
        },
        orderBy: { orderIndex: 'asc' },
      });

      return successResponse(
        res,
        submodules,
        'Submodules retrieved successfully'
      );
    } catch (error) {
      logger.error('Error fetching submodules by module ID:', error);
      return errorResponse(res, 'Failed to fetch submodules', 500);
    }
  },

  // Reorder submodules
  async reorderSubmodules(req: Request, res: Response) {
    try {
      const { submodules } = req.body;

      if (!Array.isArray(submodules)) {
        return errorResponse(res, 'Submodules array is required', 400);
      }

      // Update order for each submodule
      const updatePromises = submodules.map((submodule: any) =>
        prisma.submodule.update({
          where: { id: submodule.id },
          data: { orderIndex: submodule.orderIndex },
        })
      );

      await Promise.all(updatePromises);

      return successResponse(res, null, 'Submodules reordered successfully');
    } catch (error) {
      logger.error('Error reordering submodules:', error);
      return errorResponse(res, 'Failed to reorder submodules', 500);
    }
  },
};
