import { TokenRepository } from '@/repositories/tokenRepository';
import { UserService } from '@/services/userService';
import { AuditRepository } from '@/repositories/auditRepository';

import crypto from 'crypto';

export interface ResetTokenRecord {
  id: string;
  userId: string;
  token: string;
  isUsed: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ResetPasswordRequest {
  email: string;
  tenantSlug?: string;
}

export interface ResetPasswordConfirm {
  token: string;
  newPassword: string;
}

export class ResetTokenService {
  private tokenRepository: TokenRepository;
  private userService: UserService;
  private auditRepository: AuditRepository;

  constructor() {
    this.tokenRepository = new TokenRepository();
    this.userService = new UserService();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Generate and store a password reset token
   */
  async generateResetToken(
    request: ResetPasswordRequest,
    ipAddress: string
  ): Promise<string> {
    // Find user by email
    const user = await this.userService.getUserByEmail(
      request.email,
      request.tenantSlug
    );
    if (!user) {
      // Don't reveal if user exists or not for security
      return 'reset_token_generated';
    }

    // Generate secure random token
    const token = this.generateSecureToken();

    // Calculate expiration (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Store reset token
    await this.tokenRepository.createResetToken({
      userId: user.id,
      token,
      expiresAt,
    });

    // Log audit
    await this.auditRepository.logUserAction(
      user.id,
      user.id,
      'PASSWORD_RESET_REQUESTED',
      ipAddress,
      {
        email: request.email,
        tokenId: token.substring(0, 8) + '...', // Log partial token for security
      }
    );

    // TODO: Send email with reset link
    // await this.sendResetEmail(user.email, token);

    return 'reset_token_generated';
  }

  /**
   * Validate and use reset token to change password
   */
  async resetPassword(
    resetData: ResetPasswordConfirm,
    ipAddress: string
  ): Promise<boolean> {
    // Get reset token
    const tokenRecord = await this.tokenRepository.getResetToken(
      resetData.token
    );
    if (!tokenRecord) {
      throw new Error('Invalid reset token');
    }

    // Check if token is used
    if (tokenRecord.isUsed) {
      throw new Error('Reset token already used');
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      throw new Error('Reset token expired');
    }

    // Get user
    const user = await this.userService.getUserById(tokenRecord.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Update user password
    await this.userService.updatePassword(user.id, resetData.newPassword);

    // Mark token as used
    await this.tokenRepository.markResetTokenAsUsed(resetData.token);

    // Invalidate all existing refresh tokens for security
    await this.tokenRepository.invalidateAllUserRefreshTokens(user.id);

    // Log audit
    await this.auditRepository.logUserAction(
      user.id,
      user.id,
      'PASSWORD_RESET_COMPLETED',
      ipAddress,
      {
        tokenId: tokenRecord.id,
        ipAddress,
      }
    );

    return true;
  }

  /**
   * Validate reset token without using it
   */
  async validateResetToken(token: string): Promise<boolean> {
    const tokenRecord = await this.tokenRepository.getResetToken(token);
    if (!tokenRecord) {
      return false;
    }

    // Check if token is used
    if (tokenRecord.isUsed) {
      return false;
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Get reset token information
   */
  async getResetToken(token: string): Promise<ResetTokenRecord | null> {
    return this.tokenRepository.getResetToken(token);
  }

  /**
   * Get all reset tokens for a user
   */
  async getUserResetTokens(userId: string): Promise<ResetTokenRecord[]> {
    return this.tokenRepository.getUserResetTokens(userId);
  }

  /**
   * Clean up expired reset tokens
   */
  async cleanupExpiredResetTokens(): Promise<number> {
    return this.tokenRepository.deleteExpiredResetTokens();
  }

  /**
   * Get reset token statistics
   */
  async getResetTokenStats(): Promise<{
    totalTokens: number;
    usedTokens: number;
    expiredTokens: number;
    activeTokens: number;
  }> {
    const allTokens = await this.tokenRepository.getAllResetTokens();
    const now = new Date();

    const usedTokens = allTokens.filter(token => token.isUsed);
    const expiredTokens = allTokens.filter(token => token.expiresAt < now);
    const activeTokens = allTokens.filter(
      token => !token.isUsed && token.expiresAt > now
    );

    return {
      totalTokens: allTokens.length,
      usedTokens: usedTokens.length,
      expiredTokens: expiredTokens.length,
      activeTokens: activeTokens.length,
    };
  }

  /**
   * Revoke all reset tokens for a user
   */
  async revokeUserResetTokens(userId: string): Promise<void> {
    await this.tokenRepository.revokeUserResetTokens(userId);

    // Log audit
    await this.auditRepository.logUserAction(
      userId,
      userId,
      'RESET_TOKENS_REVOKED',
      '127.0.0.1',
      { userId }
    );
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }


}
