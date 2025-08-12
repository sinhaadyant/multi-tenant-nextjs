const axios = require('axios');
const { expect } = require('chai');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
let authToken = null;
let resetToken = null;

describe('SuperAdmin Authentication Tests', () => {
  const testEmail = 'test.superadmin@example.com';
  const testPassword = 'TestPassword123';
  const newPassword = 'NewPassword123';

  describe('POST /api/superadmin/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: testEmail,
        password: testPassword,
        rememberMe: false
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('token');
      expect(response.data.data).to.have.property('refreshToken');
      expect(response.data.data.user).to.have.property('email', testEmail);
      expect(response.data.data.user).to.have.property('role', 'superadmin');

      authToken = response.data.data.token;
    });

    it('should login with remember me option', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: testEmail,
        password: testPassword,
        rememberMe: true
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('token');
      expect(response.data.data).to.have.property('refreshToken');
    });

    it('should reject login with invalid email', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
          email: 'invalid@example.com',
          password: testPassword
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject login with invalid password', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
          email: testEmail,
          password: 'wrongpassword'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject login with missing email', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
          password: testPassword
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject login with missing password', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
          email: testEmail
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/auth/forgot-password', () => {
    it('should send password reset email for valid email', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/forgot-password`, {
        email: testEmail
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('message');
      expect(response.data.data).to.have.property('token'); // For testing purposes

      resetToken = response.data.data.token;
    });

    it('should handle non-existent email gracefully', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/forgot-password`, {
          email: 'nonexistent@example.com'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(404);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject request without email', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/forgot-password`, {});
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/auth/reset-password', () => {
    it('should reset password with valid token and matching passwords', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/reset-password`, {
        token: resetToken,
        newPassword: newPassword,
        confirmPassword: newPassword
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('message');
    });

    it('should reject reset with non-matching passwords', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/reset-password`, {
          token: resetToken,
          newPassword: newPassword,
          confirmPassword: 'differentpassword'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject reset with weak password', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/reset-password`, {
          token: resetToken,
          newPassword: 'weak',
          confirmPassword: 'weak'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject reset with invalid token', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/reset-password`, {
          token: 'invalid-token',
          newPassword: newPassword,
          confirmPassword: newPassword
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });

    it('should reject reset with missing fields', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/reset-password`, {
          token: resetToken,
          newPassword: newPassword
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(400);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/logout`, {}, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
    });

    it('should handle logout without token', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/logout`);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });

  describe('POST /api/superadmin/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      // First login to get refresh token
      const loginResponse = await axios.post(`${BASE_URL}/api/superadmin/auth/login`, {
        email: testEmail,
        password: newPassword, // Use the new password we set
        rememberMe: false
      });

      const refreshToken = loginResponse.data.data.refreshToken;

      const response = await axios.post(`${BASE_URL}/api/superadmin/auth/refresh`, {
        refreshToken: refreshToken
      });

      expect(response.status).to.equal(200);
      expect(response.data.success).to.be.true;
      expect(response.data.data).to.have.property('token');
      expect(response.data.data).to.have.property('refreshToken');
    });

    it('should reject refresh with invalid token', async () => {
      try {
        await axios.post(`${BASE_URL}/api/superadmin/auth/refresh`, {
          refreshToken: 'invalid-refresh-token'
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.response.status).to.equal(401);
        expect(error.response.data.success).to.be.false;
      }
    });
  });
});

module.exports = { authToken };
