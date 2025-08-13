// PrismaClient is imported in base repository
import { BaseRepository } from './prisma';

export class TokenRepository extends BaseRepository<any> {
  // Refresh Tokens
  async findRefreshTokenByToken(token: string): Promise<any> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  }

  async findRefreshTokensByUserId(userId: string): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createRefreshToken(data: any): Promise<any> {
    return this.prisma.refreshToken.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async updateRefreshToken(id: string, data: any): Promise<any> {
    return this.prisma.refreshToken.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  async deleteRefreshToken(id: string): Promise<any> {
    return this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async deleteRefreshTokenByToken(token: string): Promise<any> {
    return this.prisma.refreshToken.delete({
      where: { token },
    });
  }

  async deleteExpiredRefreshTokens(): Promise<any> {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  async deleteAllRefreshTokensForUser(userId: string): Promise<any> {
    return this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // Reset Tokens (for password reset)
  async findResetTokenByToken(token: string): Promise<any> {
    return this.prisma.resetToken.findUnique({
      where: { token },
      include: {
        user: true,
      },
    });
  }

  async findResetTokensByUserId(userId: string): Promise<any[]> {
    return this.prisma.resetToken.findMany({
      where: { userId },
      include: {
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createResetToken(data: any): Promise<any> {
    return this.prisma.resetToken.create({
      data,
      include: {
        user: true,
      },
    });
  }

  async updateResetToken(id: string, data: any): Promise<any> {
    return this.prisma.resetToken.update({
      where: { id },
      data,
      include: {
        user: true,
      },
    });
  }

  // Enhanced methods for AuthService
  async getRefreshToken(token: string): Promise<any> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  async getUserRefreshTokens(userId: string): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllUserRefreshTokens(userId: string): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllRefreshTokens(): Promise<any[]> {
    return this.prisma.refreshToken.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async invalidateRefreshToken(token: string): Promise<any> {
    return this.prisma.refreshToken.update({
      where: { token },
      data: { isActive: false },
    });
  }

  async invalidateAllUserRefreshTokens(userId: string): Promise<any> {
    return this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }

  async invalidateDeviceRefreshTokens(deviceId: string): Promise<any> {
    return this.prisma.refreshToken.updateMany({
      where: { deviceId },
      data: { isActive: false },
    });
  }

  async deleteExpiredTokens(): Promise<any> {
    return this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Reset token methods
  async getResetToken(token: string): Promise<any> {
    return this.prisma.resetToken.findUnique({
      where: { token },
    });
  }

  async getUserResetTokens(userId: string): Promise<any[]> {
    return this.prisma.resetToken.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllResetTokens(): Promise<any[]> {
    return this.prisma.resetToken.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async markResetTokenAsUsed(token: string): Promise<any> {
    return this.prisma.resetToken.update({
      where: { token },
      data: { isUsed: true },
    });
  }

  async revokeUserResetTokens(userId: string): Promise<any> {
    return this.prisma.resetToken.updateMany({
      where: { userId },
      data: { isUsed: true },
    });
  }

  async deleteExpiredResetTokens(): Promise<any> {
    return this.prisma.resetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }

  // Cleanup expired tokens
  async cleanupExpiredTokens(): Promise<void> {
    await Promise.all([
      this.deleteExpiredRefreshTokens(),
      this.deleteExpiredResetTokens(),
    ]);
  }
}
