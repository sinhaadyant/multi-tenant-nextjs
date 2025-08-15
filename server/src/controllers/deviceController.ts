import { Request, Response } from 'express';
import { LoginDeviceService } from '@/services/loginDeviceService';
import { successResponse, errorResponse } from '@/utils/apiResponse';
import { logger } from '@/config/logger';

const loginDeviceService = new LoginDeviceService();

// Get all login devices for the current user
export const getUserLoginDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    const devices = await loginDeviceService.getUserDevices(userId);
    successResponse(res, devices, 'Login devices retrieved successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getUserLoginDevices: ${errorMessage}`);
    errorResponse(res, 'Failed to retrieve login devices', 500);
  }
};

// Get user device statistics
export const getUserDeviceStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    const stats = await loginDeviceService.getUserDeviceStats(userId);
    successResponse(res, stats, 'Device statistics retrieved successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getUserDeviceStats: ${errorMessage}`);
    errorResponse(res, 'Failed to retrieve device statistics', 500);
  }
};

// Get a specific login device by ID
export const getLoginDeviceById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    if (!id) {
      errorResponse(res, 'Device ID is required', 400);
      return;
    }

    const device = await loginDeviceService.getDevice(id);
    if (!device) {
      errorResponse(res, 'Login device not found', 404);
      return;
    }

    successResponse(res, device, 'Login device retrieved successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in getLoginDeviceById: ${errorMessage}`);
    errorResponse(res, 'Failed to retrieve login device', 500);
  }
};

// Create a new login device
export const createLoginDevice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    // Note: LoginDeviceService doesn't have createDevice method
    // This would need to be implemented or removed
    errorResponse(res, 'Create device functionality not implemented', 501);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in createLoginDevice: ${errorMessage}`);
    errorResponse(res, 'Failed to create login device', 500);
  }
};

// Update a login device
export const updateLoginDevice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    // Note: LoginDeviceService doesn't have updateDevice method
    // This would need to be implemented or removed
    errorResponse(res, 'Update device functionality not implemented', 501);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in updateLoginDevice: ${errorMessage}`);
    errorResponse(res, 'Failed to update login device', 500);
  }
};

// Delete a login device
export const deleteLoginDevice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    // Note: LoginDeviceService doesn't have deleteDevice method
    // This would need to be implemented or removed
    errorResponse(res, 'Delete device functionality not implemented', 501);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in deleteLoginDevice: ${errorMessage}`);
    errorResponse(res, 'Failed to delete login device', 500);
  }
};

// Revoke a specific device
export const revokeDevice = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    if (!id) {
      errorResponse(res, 'Device ID is required', 400);
      return;
    }

    await loginDeviceService.revokeDevice(id);
    successResponse(res, null, 'Device revoked successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in revokeDevice: ${errorMessage}`);
    errorResponse(res, 'Failed to revoke device', 500);
  }
};

// Revoke all devices for the current user
export const revokeAllDevices = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      errorResponse(res, 'User ID not found', 400);
      return;
    }

    await loginDeviceService.revokeAllUserDevices(userId);
    successResponse(res, null, 'All devices revoked successfully');
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';
    logger.error(`Error in revokeAllDevices: ${errorMessage}`);
    errorResponse(res, 'Failed to revoke all devices', 500);
  }
};
