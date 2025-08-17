import { TokenRepository } from '@/repositories/tokenRepository';
import { AuditRepository } from '@/repositories/auditRepository';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  deviceId: string;
  token: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class TokenService {
  private tokenRepository: TokenRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.tokenRepository = new TokenRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Store a new refresh token
   */
  async storeRefreshToken(
    userId: string,
    deviceId: string,
    token: string,
    expiresIn: string
  ): Promise<void> {
    // Calculate expiration date
    const expiresAt = this.calculateExpirationDate(expiresIn);

    // Store token in database
    await this.tokenRepository.createRefreshToken({
      userId,
      deviceId,
      token,
      expiresAt,
    });
  }

  /**
   * Get refresh token record
   */
  async getRefreshToken(token: string): Promise<RefreshTokenRecord | null> {
    return this.tokenRepository.getRefreshToken(token);
  }

  /**
   * Rotate refresh token (invalidate old, store new)
   */
  async rotateRefreshToken(
    oldToken: string,
    newToken: string,
    deviceId: string,
    expiresIn: string
  ): Promise<void> {
    // Get old token record
    const oldTokenRecord = await this.tokenRepository.getRefreshToken(oldToken);
    if (!oldTokenRecord) {
      throw new Error('Old refresh token not found');
    }

    // Calculate expiration date for new token
    const expiresAt = this.calculateExpirationDate(expiresIn);

    // Invalidate old token
    await this.tokenRepository.invalidateRefreshToken(oldToken);

    // Store new token
    await this.tokenRepository.createRefreshToken({
      userId: oldTokenRecord.userId,
      deviceId,
      token: newToken,
      expiresAt,
    });

    // Log audit
    await this.auditRepository.logUserAction(
      oldTokenRecord.userId,
      null, // We don't have user object here, so pass null for tenantId
      'REFRESH_TOKEN_ROTATED',
      '127.0.0.1',
      {
        deviceId,
        oldTokenId: oldTokenRecord.id,
      }
    );
  }

  /**
   * Invalidate a specific refresh token
   */
  async invalidateRefreshToken(token: string): Promise<void> {
    const tokenRecord = await this.tokenRepository.getRefreshToken(token);
    if (tokenRecord) {
      await this.tokenRepository.invalidateRefreshToken(token);

      // Log audit
      await this.auditRepository.logUserAction(
        tokenRecord.userId,
        null, // We don't have user object here, so pass null for tenantId
        'REFRESH_TOKEN_INVALIDATED',
        '127.0.0.1',
        {
          deviceId: tokenRecord.deviceId,
          tokenId: tokenRecord.id,
        }
      );
    }
  }

  /**
   * Invalidate all refresh tokens for a user
   */
  async invalidateAllRefreshTokens(userId: string): Promise<void> {
    await this.tokenRepository.invalidateAllUserRefreshTokens(userId);

    // Log audit
    await this.auditRepository.logUserAction(
      userId,
      null, // We don't have user object here, so pass null for tenantId
      'ALL_REFRESH_TOKENS_INVALIDATED',
      '127.0.0.1',
      { userId }
    );
  }

  /**
   * Invalidate all refresh tokens for a specific device
   */
  async invalidateDeviceRefreshTokens(deviceId: string): Promise<void> {
    await this.tokenRepository.invalidateDeviceRefreshTokens(deviceId);

    // Log audit
    await this.auditRepository.logUserAction(
      'system',
      'system',
      'DEVICE_REFRESH_TOKENS_INVALIDATED',
      '127.0.0.1',
      { deviceId }
    );
  }

  /**
   * Get all active refresh tokens for a user
   */
  async getUserRefreshTokens(userId: string): Promise<RefreshTokenRecord[]> {
    return this.tokenRepository.getUserRefreshTokens(userId);
  }

  /**
   * Get refresh token statistics for a user
   */
  async getUserTokenStats(userId: string): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    recentTokens: RefreshTokenRecord[];
  }> {
    const tokens = await this.tokenRepository.getUserRefreshTokens(userId);
    const allTokens =
      await this.tokenRepository.getAllUserRefreshTokens(userId);

    const now = new Date();
    const expiredTokens = allTokens.filter(token => token.expiresAt < now);

    return {
      totalTokens: allTokens.length,
      activeTokens: tokens.length,
      expiredTokens: expiredTokens.length,
      recentTokens: tokens
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5), // Get 5 most recent tokens
    };
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    return this.tokenRepository.deleteExpiredTokens();
  }

  /**
   * Check if refresh token is valid
   */
  async isRefreshTokenValid(token: string): Promise<boolean> {
    const tokenRecord = await this.tokenRepository.getRefreshToken(token);
    if (!tokenRecord) {
      return false;
    }

    // Check if token is active and not expired
    return tokenRecord.isActive && tokenRecord.expiresAt > new Date();
  }

  /**
   * Get token usage statistics
   */
  async getTokenUsageStats(): Promise<{
    totalTokens: number;
    activeTokens: number;
    expiredTokens: number;
    tokensByDevice: Record<string, number>;
  }> {
    const allTokens = await this.tokenRepository.getAllRefreshTokens();
    const now = new Date();

    const activeTokens = allTokens.filter(
      token => token.isActive && token.expiresAt > now
    );
    const expiredTokens = allTokens.filter(token => token.expiresAt < now);

    // Group tokens by device
    const tokensByDevice: Record<string, number> = {};
    allTokens.forEach(token => {
      tokensByDevice[token.deviceId] =
        (tokensByDevice[token.deviceId] || 0) + 1;
    });

    return {
      totalTokens: allTokens.length,
      activeTokens: activeTokens.length,
      expiredTokens: expiredTokens.length,
      tokensByDevice,
    };
  }

  /**
   * Calculate expiration date from expiresIn string
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();

    // Parse expiresIn string (e.g., "7d", "24h", "30m")
    const match = expiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      // Default to 7 days if format is invalid
      now.setDate(now.getDate() + 7);
      return now;
    }

    const value = parseInt(match[1] || '0', 10);
    const unit = match[2];

    switch (unit) {
      case 'd':
        now.setDate(now.getDate() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      default:
        now.setDate(now.getDate() + 7);
    }

    return now;
  }
}
