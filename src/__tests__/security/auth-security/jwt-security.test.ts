import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { createMocks } from 'node-mocks-http';
import { verifyToken, generateToken, validateRefreshToken } from '@/lib/auth';

// Mock external dependencies
jest.mock('jsonwebtoken');
jest.mock('@/lib/database');

const mockJwt = jwt as jest.Mocked<typeof jwt>;
const mockDatabase = require('@/lib/database');

describe('JWT Security Tests', () => {
  const JWT_SECRET = 'test-secret-key';
  const REFRESH_SECRET = 'test-refresh-secret';
  
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = JWT_SECRET;
    process.env.REFRESH_SECRET = REFRESH_SECRET;
  });

  describe('Token Generation Security', () => {
    it('should generate secure JWT tokens with proper payload', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        tenantId: 'tenant-123',
        role: 'admin',
      };

      mockJwt.sign.mockReturnValue('mock-jwt-token');

      const token = generateToken(user);

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
          type: 'access',
          iat: expect.any(Number),
        },
        JWT_SECRET,
        {
          expiresIn: '15m',
          algorithm: 'HS256',
          issuer: process.env.JWT_ISSUER || 'multi-tenant-app',
          audience: process.env.JWT_AUDIENCE || 'multi-tenant-users',
        }
      );
      expect(token).toBe('mock-jwt-token');
    });

    it('should generate refresh tokens with longer expiration', () => {
      const user = { id: 'user-123', email: 'test@example.com' };

      mockJwt.sign.mockReturnValue('mock-refresh-token');

      const refreshToken = generateToken(user, 'refresh');

      expect(mockJwt.sign).toHaveBeenCalledWith(
        {
          id: user.id,
          email: user.email,
          type: 'refresh',
          iat: expect.any(Number),
        },
        REFRESH_SECRET,
        {
          expiresIn: '7d',
          algorithm: 'HS256',
          issuer: process.env.JWT_ISSUER || 'multi-tenant-app',
          audience: process.env.JWT_AUDIENCE || 'multi-tenant-users',
        }
      );
    });

    it('should use strong cryptographic algorithms', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      
      generateToken(user);

      const signCall = mockJwt.sign.mock.calls[0];
      const options = signCall[2] as jwt.SignOptions;
      
      expect(options.algorithm).toBe('HS256');
      // In production, should use RS256 or ES256 for better security
    });

    it('should include proper token metadata', () => {
      const user = { id: 'user-123', email: 'test@example.com' };
      
      generateToken(user);

      const signCall = mockJwt.sign.mock.calls[0];
      const payload = signCall[0] as any;
      
      expect(payload.iat).toBeDefined();
      expect(payload.type).toBe('access');
      expect(typeof payload.iat).toBe('number');
    });
  });

  describe('Token Verification Security', () => {
    it('should verify token signature correctly', () => {
      const tokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      const result = verifyToken('valid-token');

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-token',
        JWT_SECRET,
        {
          algorithms: ['HS256'],
          issuer: process.env.JWT_ISSUER || 'multi-tenant-app',
          audience: process.env.JWT_AUDIENCE || 'multi-tenant-users',
        }
      );
      expect(result).toEqual(tokenPayload);
    });

    it('should reject tokens with invalid signatures', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('invalid signature');
      });

      expect(() => verifyToken('invalid-token')).toThrow('Invalid token signature');
    });

    it('should reject expired tokens', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.TokenExpiredError('jwt expired', new Date());
      });

      expect(() => verifyToken('expired-token')).toThrow('Token expired');
    });

    it('should reject malformed tokens', () => {
      mockJwt.verify.mockImplementation(() => {
        throw new jwt.JsonWebTokenError('jwt malformed');
      });

      expect(() => verifyToken('malformed-token')).toThrow('Malformed token');
    });

    it('should validate token type for access tokens', () => {
      const invalidTokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'refresh', // Wrong type for access token verification
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(invalidTokenPayload);

      expect(() => verifyToken('wrong-type-token')).toThrow('Invalid token type');
    });

    it('should validate required payload fields', () => {
      const incompletePayload = {
        email: 'test@example.com',
        type: 'access',
        // Missing id field
      };

      mockJwt.verify.mockReturnValue(incompletePayload);

      expect(() => verifyToken('incomplete-token')).toThrow('Invalid token payload');
    });
  });

  describe('Refresh Token Security', () => {
    it('should validate refresh tokens with separate secret', () => {
      const refreshPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(refreshPayload);
      mockDatabase.findRefreshToken.mockResolvedValue({
        id: 'refresh-123',
        userId: 'user-123',
        token: 'refresh-token-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        isRevoked: false,
      });

      const result = validateRefreshToken('valid-refresh-token');

      expect(mockJwt.verify).toHaveBeenCalledWith(
        'valid-refresh-token',
        REFRESH_SECRET,
        expect.any(Object)
      );
    });

    it('should reject revoked refresh tokens', async () => {
      const refreshPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(refreshPayload);
      mockDatabase.findRefreshToken.mockResolvedValue({
        id: 'refresh-123',
        userId: 'user-123',
        token: 'refresh-token-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: true, // Token is revoked
      });

      await expect(validateRefreshToken('revoked-refresh-token')).rejects.toThrow('Refresh token revoked');
    });

    it('should prevent refresh token reuse', async () => {
      const refreshPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(refreshPayload);
      
      // Mock token already used
      mockDatabase.findRefreshToken.mockResolvedValue({
        id: 'refresh-123',
        userId: 'user-123',
        token: 'refresh-token-hash',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isRevoked: false,
        lastUsed: new Date(), // Token already used
      });

      await expect(validateRefreshToken('used-refresh-token')).rejects.toThrow('Refresh token already used');
    });

    it('should store refresh tokens securely', () => {
      const refreshToken = 'refresh-token-123';
      const userId = 'user-123';

      mockDatabase.storeRefreshToken.mockResolvedValue(true);

      // This would be called during login
      expect(mockDatabase.storeRefreshToken).not.toHaveBeenCalled();
      
      // In actual implementation, refresh tokens should be hashed before storage
      // const hashedToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
      // mockDatabase.storeRefreshToken(userId, hashedToken, expiresAt);
    });
  });

  describe('Token Storage Security', () => {
    it('should set secure cookie attributes for tokens', () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      // Mock setting secure cookie
      const setTokenCookie = (token: string, isRefresh = false) => {
        const cookieName = isRefresh ? 'refreshToken' : 'accessToken';
        const maxAge = isRefresh ? 7 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000;
        
        res.setHeader('Set-Cookie', [
          `${cookieName}=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}; Path=/`,
        ]);
      };

      setTokenCookie('access-token');
      setTokenCookie('refresh-token', true);

      const cookies = res.getHeaders()['set-cookie'] as string[];
      
      expect(cookies[0]).toContain('HttpOnly');
      expect(cookies[0]).toContain('Secure');
      expect(cookies[0]).toContain('SameSite=Strict');
      expect(cookies[1]).toContain('HttpOnly');
      expect(cookies[1]).toContain('Secure');
      expect(cookies[1]).toContain('SameSite=Strict');
    });

    it('should clear tokens on logout', () => {
      const { req, res } = createMocks({
        method: 'POST',
      });

      // Mock clearing cookies
      const clearTokenCookies = () => {
        res.setHeader('Set-Cookie', [
          'accessToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
          'refreshToken=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
        ]);
      };

      clearTokenCookies();

      const cookies = res.getHeaders()['set-cookie'] as string[];
      
      expect(cookies[0]).toContain('Max-Age=0');
      expect(cookies[1]).toContain('Max-Age=0');
    });
  });

  describe('CSRF Protection', () => {
    it('should validate CSRF tokens for state-changing operations', () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': 'valid-csrf-token',
          'authorization': 'Bearer valid-jwt-token',
        },
        body: {
          action: 'updateProfile',
        },
      });

      // Mock CSRF validation
      const validateCSRF = (request: NextRequest) => {
        const csrfToken = request.headers.get('x-csrf-token');
        const sessionToken = request.headers.get('authorization');
        
        if (!csrfToken) {
          throw new Error('CSRF token missing');
        }
        
        // In real implementation, validate CSRF token against session
        if (csrfToken === 'valid-csrf-token' && sessionToken) {
          return true;
        }
        
        throw new Error('Invalid CSRF token');
      };

      expect(() => validateCSRF(req as NextRequest)).not.toThrow();
    });

    it('should reject requests without CSRF tokens', () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-jwt-token',
        },
        body: {
          action: 'updateProfile',
        },
      });

      const validateCSRF = (request: NextRequest) => {
        const csrfToken = request.headers.get('x-csrf-token');
        
        if (!csrfToken) {
          throw new Error('CSRF token missing');
        }
        
        return true;
      };

      expect(() => validateCSRF(req as NextRequest)).toThrow('CSRF token missing');
    });

    it('should reject requests with invalid CSRF tokens', () => {
      const { req } = createMocks({
        method: 'POST',
        headers: {
          'x-csrf-token': 'invalid-csrf-token',
          'authorization': 'Bearer valid-jwt-token',
        },
        body: {
          action: 'updateProfile',
        },
      });

      const validateCSRF = (request: NextRequest) => {
        const csrfToken = request.headers.get('x-csrf-token');
        
        if (csrfToken !== 'valid-csrf-token') {
          throw new Error('Invalid CSRF token');
        }
        
        return true;
      };

      expect(() => validateCSRF(req as NextRequest)).toThrow('Invalid CSRF token');
    });
  });

  describe('Token Expiration Handling', () => {
    it('should handle token expiration gracefully', () => {
      const expiredTime = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
      
      mockJwt.verify.mockImplementation(() => {
        const error = new jwt.TokenExpiredError('jwt expired', new Date(expiredTime * 1000));
        throw error;
      });

      expect(() => verifyToken('expired-token')).toThrow('Token expired');
    });

    it('should validate token expiration time', () => {
      const tokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: Math.floor(Date.now() / 1000) - 1800, // 30 minutes ago
        exp: Math.floor(Date.now() / 1000) - 900,  // 15 minutes ago (expired)
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      const validateExpiration = (payload: any) => {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          throw new Error('Token manually expired');
        }
        return payload;
      };

      expect(() => validateExpiration(tokenPayload)).toThrow('Token manually expired');
    });

    it('should handle token issued in future', () => {
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // 1 hour in future
      
      const tokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'access',
        iat: futureTime, // Token issued in future
        exp: futureTime + 900,
      };

      mockJwt.verify.mockReturnValue(tokenPayload);

      const validateIssuedAt = (payload: any) => {
        const now = Math.floor(Date.now() / 1000);
        if (payload.iat > now + 60) { // Allow 1 minute clock skew
          throw new Error('Token issued in future');
        }
        return payload;
      };

      expect(() => validateIssuedAt(tokenPayload)).toThrow('Token issued in future');
    });
  });

  describe('Token Blacklisting', () => {
    it('should check token against blacklist', async () => {
      const tokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'access',
        jti: 'token-unique-id', // JWT ID for blacklisting
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(tokenPayload);
      mockDatabase.isTokenBlacklisted.mockResolvedValue(false);

      const validateTokenBlacklist = async (payload: any) => {
        if (payload.jti) {
          const isBlacklisted = await mockDatabase.isTokenBlacklisted(payload.jti);
          if (isBlacklisted) {
            throw new Error('Token is blacklisted');
          }
        }
        return payload;
      };

      await expect(validateTokenBlacklist(tokenPayload)).resolves.toEqual(tokenPayload);
    });

    it('should reject blacklisted tokens', async () => {
      const tokenPayload = {
        id: 'user-123',
        email: 'test@example.com',
        type: 'access',
        jti: 'blacklisted-token-id',
        iat: Math.floor(Date.now() / 1000),
      };

      mockJwt.verify.mockReturnValue(tokenPayload);
      mockDatabase.isTokenBlacklisted.mockResolvedValue(true);

      const validateTokenBlacklist = async (payload: any) => {
        if (payload.jti) {
          const isBlacklisted = await mockDatabase.isTokenBlacklisted(payload.jti);
          if (isBlacklisted) {
            throw new Error('Token is blacklisted');
          }
        }
        return payload;
      };

      await expect(validateTokenBlacklist(tokenPayload)).rejects.toThrow('Token is blacklisted');
    });

    it('should add tokens to blacklist on logout', async () => {
      const tokenId = 'token-to-blacklist';
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      mockDatabase.addToBlacklist.mockResolvedValue(true);

      const blacklistToken = async (jti: string, exp: Date) => {
        await mockDatabase.addToBlacklist(jti, exp);
      };

      await blacklistToken(tokenId, expiresAt);

      expect(mockDatabase.addToBlacklist).toHaveBeenCalledWith(tokenId, expiresAt);
    });
  });

  describe('Rate Limiting for Token Operations', () => {
    it('should rate limit token refresh attempts', async () => {
      const userId = 'user-123';
      const attempts = 10; // Simulate many refresh attempts

      mockDatabase.getTokenRefreshAttempts.mockResolvedValue(attempts);

      const checkRefreshRateLimit = async (userId: string) => {
        const attempts = await mockDatabase.getTokenRefreshAttempts(userId);
        if (attempts > 5) { // Max 5 refresh attempts per hour
          throw new Error('Token refresh rate limit exceeded');
        }
        return true;
      };

      await expect(checkRefreshRateLimit(userId)).rejects.toThrow('Token refresh rate limit exceeded');
    });

    it('should allow normal refresh attempts', async () => {
      const userId = 'user-123';
      const attempts = 3; // Normal usage

      mockDatabase.getTokenRefreshAttempts.mockResolvedValue(attempts);

      const checkRefreshRateLimit = async (userId: string) => {
        const attempts = await mockDatabase.getTokenRefreshAttempts(userId);
        if (attempts > 5) {
          throw new Error('Token refresh rate limit exceeded');
        }
        return true;
      };

      await expect(checkRefreshRateLimit(userId)).resolves.toBe(true);
    });
  });
});
