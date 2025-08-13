// PrismaClient is imported in base repository
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
          userAgent: { contains: filters.search },
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
          userAgent: { contains: filters.search },
        },
      ];
    }

    return this.prisma.loginDevice.count({ where });
  }

  // Enhanced methods for LoginDeviceService
  async getDeviceById(deviceId: string): Promise<any> {
    return this.prisma.loginDevice.findFirst({
      where: { deviceId },
      include: {
        user: true,
      },
    });
  }

  async getUserDevices(userId: string): Promise<any[]> {
    return this.prisma.loginDevice.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: { lastUsedAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async getAllUserDevices(userId: string): Promise<any[]> {
    return this.prisma.loginDevice.findMany({
      where: { userId },
      orderBy: { lastUsedAt: 'desc' },
      include: {
        user: true,
      },
    });
  }

  async updateLastUsed(deviceId: string): Promise<any> {
    return this.prisma.loginDevice.update({
      where: { deviceId },
      data: { lastUsedAt: new Date() },
    });
  }

  async revokeDevice(deviceId: string): Promise<any> {
    return this.prisma.loginDevice.update({
      where: { deviceId },
      data: { isActive: false },
    });
  }

  async revokeAllUserDevices(userId: string): Promise<any> {
    return this.prisma.loginDevice.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async deleteOldInactiveDevices(cutoffDate: Date): Promise<number> {
    const result = await this.prisma.loginDevice.deleteMany({
      where: {
        isActive: false,
        updatedAt: {
          lt: cutoffDate,
        },
      },
    });
    return result.count;
  }

  // Find device by fingerprint (basic device identification)
  async findDeviceByFingerprint(userId: string, deviceInfo: any): Promise<any> {
    // This is a simplified approach - in production you might want more sophisticated device fingerprinting
    const userAgent = deviceInfo.userAgent || '';
    // const _platform = deviceInfo.platform || '';

    return this.prisma.loginDevice.findFirst({
      where: {
        userId,
        userAgent: userAgent,
        isActive: true,
      },
      include: {
        user: true,
      },
    });
  }
}
