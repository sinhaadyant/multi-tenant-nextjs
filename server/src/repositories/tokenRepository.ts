import { PrismaClient } from '@prisma/client';
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

  async deleteResetToken(id: string): Promise<any> {
    return this.prisma.resetToken.delete({
      where: { id },
    });
  }

  async deleteResetTokenByToken(token: string): Promise<any> {
    return this.prisma.resetToken.delete({
      where: { token },
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

  async deleteAllResetTokensForUser(userId: string): Promise<any> {
    return this.prisma.resetToken.deleteMany({
      where: { userId },
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
