import { UserService } from '@/services/userService';
import { LoginDeviceService } from '@/services/loginDeviceService';
import { AuditRepository } from '@/repositories/auditRepository';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '@/utils/jwt';
import { env } from '@/config/env';
import { TokenService } from './tokenService';

export interface LoginCredentials {
  email: string;
  password: string;
  tenantSlug?: string;
}

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  platform?: string;
}

export interface LoginResult {
  user: any;
  accessToken: string;
  refreshToken: string;
  deviceId: string;
}

export class AuthService {
  private userService: UserService;
  private loginDeviceService: LoginDeviceService;
  private tokenService: TokenService;
  private auditRepository: AuditRepository;

  constructor() {
    this.userService = new UserService();
    this.loginDeviceService = new LoginDeviceService();
    this.tokenService = new TokenService();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Authenticate user and generate tokens
   */
  async login(
    credentials: LoginCredentials,
    deviceInfo: DeviceInfo
  ): Promise<LoginResult> {
    // Authenticate user
    const user = await this.userService.authenticateUser(credentials);

    // Generate device ID
    const deviceId = await this.loginDeviceService.registerDevice(
      user.id,
      deviceInfo
    );

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isSuperadmin: user.isSuperadmin,
      tenantId: user.tenantId,
      roles: [], // TODO: Get user roles
      permissions: [], // TODO: Get user permissions
    });

    const refreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Store refresh token in database
    await this.tokenService.storeRefreshToken(
      user.id,
      deviceId,
      refreshToken,
      env.JWT_REFRESH_TOKEN_EXPIRY
    );

    // Log audit
    await this.auditRepository.logUserAction(
      user.id,
      user.id,
      'USER_LOGIN',
      deviceInfo.ipAddress,
      {
        deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      }
    );

    // Update last login
    await this.userService.updateLastLogin(user.id);

    return {
      user,
      accessToken,
      refreshToken,
      deviceId,
    };
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(
    oldRefreshToken: string,
    deviceInfo: DeviceInfo
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const payload = verifyRefreshToken(oldRefreshToken);

    // Check if refresh token exists and is valid in database
    const tokenRecord =
      await this.tokenService.getRefreshToken(oldRefreshToken);
    if (!tokenRecord || !tokenRecord.isActive) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const user = await this.userService.getUserById(payload.userId);
    if (!user || !user.isActive) {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      isSuperadmin: user.isSuperadmin,
      tenantId: user.tenantId,
      roles: [], // TODO: Get user roles
      permissions: [], // TODO: Get user permissions
    });

    const newRefreshToken = generateRefreshToken({
      userId: user.id,
    });

    // Store new refresh token and invalidate old one
    await this.tokenService.rotateRefreshToken(
      oldRefreshToken,
      newRefreshToken,
      tokenRecord.deviceId,
      env.JWT_REFRESH_TOKEN_EXPIRY
    );

    // Log audit
    await this.auditRepository.logUserAction(
      user.id,
      user.id,
      'TOKEN_REFRESHED',
      deviceInfo.ipAddress,
      {
        deviceId: tokenRecord.deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      }
    );

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user and invalidate tokens
   */
  async logout(refreshToken: string, deviceInfo: DeviceInfo): Promise<void> {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Get token record
    const tokenRecord = await this.tokenService.getRefreshToken(refreshToken);
    if (tokenRecord) {
      // Invalidate refresh token
      await this.tokenService.invalidateRefreshToken(refreshToken);

      // Log audit
      await this.auditRepository.logUserAction(
        payload.userId,
        payload.userId,
        'USER_LOGOUT',
        deviceInfo.ipAddress,
        {
          deviceId: tokenRecord.deviceId,
          userAgent: deviceInfo.userAgent,
          ipAddress: deviceInfo.ipAddress,
        }
      );
    }
  }

  /**
   * Logout user from all devices
   */
  async logoutAllDevices(
    userId: string,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    // Invalidate all refresh tokens for user
    await this.tokenService.invalidateAllRefreshTokens(userId);

    // Log audit
    await this.auditRepository.logUserAction(
      userId,
      userId,
      'USER_LOGOUT_ALL_DEVICES',
      deviceInfo.ipAddress,
      {
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      }
    );
  }

  /**
   * Validate access token
   */
  async validateAccessToken(accessToken: string): Promise<any> {
    try {
      // Verify token signature and expiration
      const payload = await this.verifyAccessToken(accessToken);

      // Check if user exists and is active
      const user = await this.userService.getUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      return user;
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  /**
   * Verify access token (helper method)
   */
  private async verifyAccessToken(_accessToken: string): Promise<any> {
    // This would use the verifyAccessToken function from jwt utils
    // For now, we'll use a simplified approach
    return { userId: 'temp' }; // TODO: Implement proper verification
  }

  /**
   * Get user's active devices
   */
  async getUserDevices(userId: string): Promise<any[]> {
    return this.loginDeviceService.getUserDevices(userId);
  }

  /**
   * Revoke a specific device
   */
  async revokeDevice(
    userId: string,
    deviceId: string,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    // Revoke device
    await this.loginDeviceService.revokeDevice(deviceId);

    // Invalidate all refresh tokens for this device
    await this.tokenService.invalidateDeviceRefreshTokens(deviceId);

    // Log audit
    await this.auditRepository.logUserAction(
      userId,
      userId,
      'DEVICE_REVOKED',
      deviceInfo.ipAddress,
      {
        deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
      }
    );
  }
}
