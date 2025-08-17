import { LoginDeviceRepository } from '@/repositories/loginDeviceRepository';
import { AuditRepository } from '@/repositories/auditRepository';
import { v4 as uuidv4 } from 'uuid';

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  platform?: string;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  platform?: string;
  isActive: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class LoginDeviceService {
  private loginDeviceRepository: LoginDeviceRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.loginDeviceRepository = new LoginDeviceRepository();
    this.auditRepository = new AuditRepository();
  }

  /**
   * Register a new device for a user
   */
  async registerDevice(
    userId: string,
    deviceInfo: DeviceInfo
  ): Promise<string> {
    // Generate unique device ID
    const deviceId = uuidv4();

    // Parse user agent to extract device information
    const parsedDeviceInfo = this.parseUserAgent(deviceInfo.userAgent);

    // Create device record
    const deviceRecord = await this.loginDeviceRepository.create({
      userId,
      deviceId,
      userAgent: deviceInfo.userAgent,
      ipAddress: deviceInfo.ipAddress,
      deviceType: parsedDeviceInfo.deviceType || deviceInfo.deviceType,
      browser: parsedDeviceInfo.browser || deviceInfo.browser,
      os: parsedDeviceInfo.os || deviceInfo.os,
      platform: parsedDeviceInfo.platform || deviceInfo.platform,
      isActive: true,
      lastUsedAt: new Date(),
    });

    // Log audit
    await this.auditRepository.logUserAction(
      userId,
      null, // We don't have user object here, so pass null for tenantId
      'DEVICE_REGISTERED',
      deviceInfo.ipAddress,
      {
        deviceId,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress,
        deviceType: deviceRecord.deviceType,
        browser: deviceRecord.browser,
        os: deviceRecord.os,
      }
    );

    return deviceId;
  }

  /**
   * Get all active devices for a user
   */
  async getUserDevices(userId: string): Promise<DeviceRecord[]> {
    return this.loginDeviceRepository.getUserDevices(userId);
  }

  /**
   * Get a specific device by device ID
   */
  async getDevice(deviceId: string): Promise<DeviceRecord | null> {
    return this.loginDeviceRepository.getDeviceById(deviceId);
  }

  /**
   * Update device last used timestamp
   */
  async updateDeviceLastUsed(deviceId: string): Promise<void> {
    await this.loginDeviceRepository.updateLastUsed(deviceId);
  }

  /**
   * Revoke a device (mark as inactive)
   */
  async revokeDevice(deviceId: string): Promise<void> {
    const device = await this.loginDeviceRepository.getDeviceById(deviceId);
    if (!device) {
      throw new Error('Device not found');
    }

    // Mark device as inactive
    await this.loginDeviceRepository.revokeDevice(deviceId);

    // Log audit
    await this.auditRepository.logUserAction(
      device.userId,
      null, // We don't have user object here, so pass null for tenantId
      'DEVICE_REVOKED',
      device.ipAddress,
      {
        deviceId,
        userAgent: device.userAgent,
        ipAddress: device.ipAddress,
      }
    );
  }

  /**
   * Revoke all devices for a user
   */
  async revokeAllUserDevices(userId: string): Promise<void> {
    await this.loginDeviceRepository.revokeAllUserDevices(userId);

    // Log audit
    await this.auditRepository.logUserAction(
      userId,
      null, // We don't have user object here, so pass null for tenantId
      'ALL_DEVICES_REVOKED',
      '127.0.0.1',
      { userId }
    );
  }

  /**
   * Get device statistics for a user
   */
  async getUserDeviceStats(userId: string): Promise<{
    totalDevices: number;
    activeDevices: number;
    inactiveDevices: number;
    recentDevices: DeviceRecord[];
  }> {
    const devices = await this.loginDeviceRepository.getUserDevices(userId);
    const allDevices =
      await this.loginDeviceRepository.getAllUserDevices(userId);

    return {
      totalDevices: allDevices.length,
      activeDevices: devices.length,
      inactiveDevices: allDevices.length - devices.length,
      recentDevices: devices
        .sort(
          (a, b) =>
            new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
        )
        .slice(0, 5), // Get 5 most recent devices
    };
  }

  /**
   * Check if device is active
   */
  async isDeviceActive(deviceId: string): Promise<boolean> {
    const device = await this.loginDeviceRepository.getDeviceById(deviceId);
    return device ? device.isActive : false;
  }

  /**
   * Parse user agent string to extract device information
   */
  private parseUserAgent(userAgent: string): {
    deviceType?: string;
    browser?: string;
    os?: string;
    platform?: string;
  } {
    const result: {
      deviceType?: string;
      browser?: string;
      os?: string;
      platform?: string;
    } = {};

    // Simple user agent parsing (in production, use a library like ua-parser-js)
    const ua = userAgent.toLowerCase();

    // Detect device type
    if (
      ua.includes('mobile') ||
      ua.includes('android') ||
      ua.includes('iphone')
    ) {
      result.deviceType = 'mobile';
    } else if (ua.includes('tablet') || ua.includes('ipad')) {
      result.deviceType = 'tablet';
    } else {
      result.deviceType = 'desktop';
    }

    // Detect browser
    if (ua.includes('chrome')) {
      result.browser = 'Chrome';
    } else if (ua.includes('firefox')) {
      result.browser = 'Firefox';
    } else if (ua.includes('safari')) {
      result.browser = 'Safari';
    } else if (ua.includes('edge')) {
      result.browser = 'Edge';
    } else if (ua.includes('opera')) {
      result.browser = 'Opera';
    }

    // Detect OS
    if (ua.includes('windows')) {
      result.os = 'Windows';
    } else if (ua.includes('mac os')) {
      result.os = 'macOS';
    } else if (ua.includes('linux')) {
      result.os = 'Linux';
    } else if (ua.includes('android')) {
      result.os = 'Android';
    } else if (
      ua.includes('ios') ||
      ua.includes('iphone') ||
      ua.includes('ipad')
    ) {
      result.os = 'iOS';
    }

    // Detect platform
    if (ua.includes('mobile')) {
      result.platform = 'Mobile';
    } else if (ua.includes('tablet')) {
      result.platform = 'Tablet';
    } else {
      result.platform = 'Desktop';
    }

    return result;
  }

  /**
   * Clean up old inactive devices (older than 90 days)
   */
  async cleanupOldDevices(): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    return this.loginDeviceRepository.deleteOldInactiveDevices(cutoffDate);
  }
}
