import { PrismaClient } from '@prisma/client';
import { BaseRepository } from './prisma';

export interface LoginDeviceFilters {
  userId?: string;
  isActive?: boolean;
  search?: string;
}

export interface LoginDeviceListParams {
  page?: number;
  limit?: number;
  filters?: LoginDeviceFilters;
  orderBy?: any;
}

export class LoginDeviceRepository extends BaseRepository<any> {
  override async findById(id: string): Promise<any> {
    return this.prisma.loginDevice.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  override async findMany(params: LoginDeviceListParams = {}): Promise<any[]> {
    const {
      page = 1,
      limit = 10,
      filters = {},
      orderBy = { lastActiveAt: 'desc' },
    } = params;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { ipAddress: { contains: filters.search } },
        {
          deviceInfo: { path: ['userAgent'], string_contains: filters.search },
        },
      ];
    }

    return this.prisma.loginDevice.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        user: true,
      },
    });
  }

  override async create(data: any): Promise<any> {
    return this.prisma.loginDevice.create({
      data,
      include: {
        user: true,
      },
    });
  }

  override async update(id: string, data: any): Promise<any> {
    return this.prisma.loginDevice.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  override async delete(id: string): Promise<any> {
    return this.prisma.loginDevice.delete({
      where: { id },
    });
  }

  override async count(filters: LoginDeviceFilters = {}): Promise<number> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { ipAddress: { contains: filters.search } },
        {
          deviceInfo: { path: ['userAgent'], string_contains: filters.search },
        },
      ];
    }

    return this.prisma.loginDevice.count({ where });
  }

  // Device management methods
  async registerDevice(
    userId: string,
    deviceInfo: any,
    ipAddress?: string
  ): Promise<any> {
    return this.create({
      userId,
      deviceInfo,
      ipAddress,
      lastActiveAt: new Date(),
      isActive: true,
    });
  }

  async updateDeviceActivity(id: string): Promise<any> {
    return this.update(id, {
      lastActiveAt: new Date(),
    });
  }

  async revokeDevice(id: string): Promise<any> {
    return this.update(id, {
      isActive: false,
    });
  }

  async revokeAllDevicesForUser(userId: string): Promise<any> {
    return this.prisma.loginDevice.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async getActiveDevicesForUser(userId: string): Promise<any[]> {
    return this.prisma.loginDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        user: true,
      },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async getDeviceStats(userId?: string): Promise<any> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const [totalDevices, activeDevices, inactiveDevices] = await Promise.all([
      this.prisma.loginDevice.count({ where }),
      this.prisma.loginDevice.count({ where: { ...where, isActive: true } }),
      this.prisma.loginDevice.count({ where: { ...where, isActive: false } }),
    ]);

    return {
      totalDevices,
      activeDevices,
      inactiveDevices,
    };
  }

  // Cleanup inactive devices older than specified days
  async cleanupInactiveDevices(daysThreshold: number = 30): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

    return this.prisma.loginDevice.deleteMany({
      where: {
        isActive: false,
        lastActiveAt: {
          lt: cutoffDate,
        },
      },
    });
  }

  // Find device by fingerprint (basic device identification)
  async findDeviceByFingerprint(userId: string, deviceInfo: any): Promise<any> {
    // This is a simplified approach - in production you might want more sophisticated device fingerprinting
    const userAgent = deviceInfo.userAgent || '';
    const platform = deviceInfo.platform || '';

    return this.prisma.loginDevice.findFirst({
      where: {
        userId,
        deviceInfo: {
          path: ['userAgent'],
          equals: userAgent,
        },
        isActive: true,
      },
      include: {
        user: true,
      },
    });
  }
}
