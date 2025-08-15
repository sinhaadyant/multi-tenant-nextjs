import crypto from 'crypto';
import { Request } from 'express';
import { logger } from '@/config/logger';

export interface DeviceInfo {
  userAgent: string;
  ipAddress: string;
  deviceType?: string;
  browser?: string;
  os?: string;
  platform?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  fingerprint: string;
}

export interface DeviceFingerprint {
  id: string;
  info: DeviceInfo;
  createdAt: Date;
  lastUsedAt: Date;
  isActive: boolean;
}

/**
 * Generate device fingerprint from request
 */
export const generateDeviceFingerprint = (req: Request): DeviceInfo => {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = getClientIP(req);

  // Parse user agent to extract device information
  const deviceInfo = parseUserAgent(userAgent);

  // Create fingerprint hash
  const fingerprintData = {
    userAgent,
    ipAddress,
    acceptLanguage: req.headers['accept-language'] || '',
    acceptEncoding: req.headers['accept-encoding'] || '',
    connection: req.headers['connection'] || '',
    upgradeInsecureRequests: req.headers['upgrade-insecure-requests'] || '',
  };

  const fingerprint = crypto
    .createHash('sha256')
    .update(JSON.stringify(fingerprintData))
    .digest('hex');

  return {
    userAgent,
    ipAddress,
    ...deviceInfo,
    fingerprint,
  };
};

/**
 * Get client IP address from request
 */
export const getClientIP = (req: Request): string => {
  // Check for forwarded headers (proxy/load balancer)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.toString().split(',');
    return ips[0]?.trim() || 'unknown';
  }

  // Check for real IP header
  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP.toString();
  }

  // Check for CF-Connecting-IP (Cloudflare)
  const cfIP = req.headers['cf-connecting-ip'];
  if (cfIP) {
    return cfIP.toString();
  }

  // Fallback to connection remote address
  return req.socket.remoteAddress || req.ip || 'unknown';
};

/**
 * Parse user agent string to extract device information
 */
export const parseUserAgent = (
  userAgent: string
): {
  deviceType: string;
  browser: string;
  os: string;
  platform: string;
} => {
  const ua = userAgent.toLowerCase();

  // Device type detection
  let deviceType = 'desktop';
  if (
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone')
  ) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  }

  // Browser detection
  let browser = 'Unknown';
  if (ua.includes('chrome')) {
    browser = 'Chrome';
  } else if (ua.includes('firefox')) {
    browser = 'Firefox';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
  } else if (ua.includes('edge')) {
    browser = 'Edge';
  } else if (ua.includes('opera')) {
    browser = 'Opera';
  } else if (ua.includes('ie') || ua.includes('trident')) {
    browser = 'Internet Explorer';
  }

  // Operating system detection
  let os = 'Unknown';
  if (ua.includes('windows')) {
    os = 'Windows';
  } else if (ua.includes('mac os')) {
    os = 'macOS';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  } else if (ua.includes('android')) {
    os = 'Android';
  } else if (
    ua.includes('ios') ||
    ua.includes('iphone') ||
    ua.includes('ipad')
  ) {
    os = 'iOS';
  }

  // Platform detection
  let platform = 'Unknown';
  if (ua.includes('win')) {
    platform = 'Windows';
  } else if (ua.includes('mac')) {
    platform = 'macOS';
  } else if (ua.includes('linux')) {
    platform = 'Linux';
  } else if (ua.includes('android')) {
    platform = 'Android';
  } else if (ua.includes('ios')) {
    platform = 'iOS';
  }

  return {
    deviceType,
    browser,
    os,
    platform,
  };
};

/**
 * Generate unique device ID
 */
export const generateDeviceId = (deviceInfo: DeviceInfo): string => {
  const data = `${deviceInfo.fingerprint}-${deviceInfo.ipAddress}-${Date.now()}`;
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Validate device fingerprint
 */
export const validateDeviceFingerprint = (fingerprint: string): boolean => {
  // Basic validation: check if it's a valid SHA256 hash
  return /^[a-f0-9]{64}$/i.test(fingerprint);
};

/**
 * Compare two device fingerprints for similarity
 */
export const compareDeviceFingerprints = (
  fingerprint1: string,
  fingerprint2: string
): number => {
  if (fingerprint1 === fingerprint2) {
    return 1.0; // Exact match
  }

  // Simple similarity check (can be enhanced with more sophisticated algorithms)
  const similarity = 0.0; // Placeholder for similarity calculation
  return similarity;
};

/**
 * Check if device fingerprint is suspicious
 */
export const isSuspiciousDevice = (
  deviceInfo: DeviceInfo,
  knownDevices: DeviceFingerprint[]
): {
  isSuspicious: boolean;
  reasons: string[];
} => {
  const reasons: string[] = [];

  // Check for missing or generic user agent
  if (!deviceInfo.userAgent || deviceInfo.userAgent === 'Unknown') {
    reasons.push('Missing or generic user agent');
  }

  // Check for suspicious IP patterns
  if (isPrivateIP(deviceInfo.ipAddress)) {
    reasons.push('Private IP address');
  }

  // Check for known suspicious user agents
  const suspiciousUserAgents = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'curl',
    'wget',
    'python',
    'java',
    'perl',
  ];

  const ua = deviceInfo.userAgent.toLowerCase();
  for (const suspicious of suspiciousUserAgents) {
    if (ua.includes(suspicious)) {
      reasons.push(`Suspicious user agent: ${suspicious}`);
      break;
    }
  }

  // Check for rapid device changes
  const recentDevices = knownDevices.filter(
    device =>
      device.isActive &&
      Date.now() - device.lastUsedAt.getTime() < 24 * 60 * 60 * 1000
  );

  if (recentDevices.length > 5) {
    reasons.push('Too many recent device changes');
  }

  return {
    isSuspicious: reasons.length > 0,
    reasons,
  };
};

/**
 * Check if IP address is private
 */
export const isPrivateIP = (ip: string): boolean => {
  const privateRanges = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
    /^192\.168\./,
    /^127\./,
    /^169\.254\./,
    /^::1$/,
    /^fc00:/,
    /^fe80:/,
  ];

  return privateRanges.some(range => range.test(ip));
};

/**
 * Get device location information (placeholder for future implementation)
 */
export const getDeviceLocation = async (
  ip: string
): Promise<{
  country?: string;
  region?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
}> => {
  try {
    // This would typically integrate with a geolocation service
    // For now, return placeholder data
    logger.debug(`Getting location for IP: ${ip}`);

    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
    };
  } catch (error) {
    logger.error('Failed to get device location:', error);
    return {};
  }
};

/**
 * Create device fingerprint from request
 */
export const createDeviceFingerprint = (req: Request): DeviceFingerprint => {
  const deviceInfo = generateDeviceFingerprint(req);
  const deviceId = generateDeviceId(deviceInfo);
  const now = new Date();

  return {
    id: deviceId,
    info: deviceInfo,
    createdAt: now,
    lastUsedAt: now,
    isActive: true,
  };
};

/**
 * Update device fingerprint last used time
 */
export const updateDeviceLastUsed = (
  device: DeviceFingerprint
): DeviceFingerprint => {
  return {
    ...device,
    lastUsedAt: new Date(),
  };
};

/**
 * Deactivate device fingerprint
 */
export const deactivateDevice = (
  device: DeviceFingerprint
): DeviceFingerprint => {
  return {
    ...device,
    isActive: false,
    lastUsedAt: new Date(),
  };
};

/**
 * Get device summary for logging
 */
export const getDeviceSummary = (device: DeviceFingerprint): string => {
  const { info } = device;
  return `${info.browser} on ${info.os} (${info.deviceType}) - ${info.ipAddress}`;
};

export default {
  generateDeviceFingerprint,
  createDeviceFingerprint,
  validateDeviceFingerprint,
  isSuspiciousDevice,
  getDeviceLocation,
  updateDeviceLastUsed,
  deactivateDevice,
  getDeviceSummary,
};
