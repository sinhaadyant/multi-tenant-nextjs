const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Basic Setup Tests', () => {
  test('should have all required dependencies installed', () => {
    expect(express).toBeDefined();
    expect(bcrypt).toBeDefined();
    expect(jwt).toBeDefined();
  });

  test('should be able to create Express app', () => {
    const app = express();
    expect(app).toBeDefined();
    expect(typeof app.use).toBe('function');
  });

  test('should be able to hash passwords with bcrypt', async () => {
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 12);

    expect(hashedPassword).toBeDefined();
    expect(hashedPassword).not.toBe(password);

    const isValid = await bcrypt.compare(password, hashedPassword);
    expect(isValid).toBe(true);
  });

  test('should be able to generate and verify JWT tokens', () => {
    const payload = { userId: '123', email: 'test@example.com' };
    const secret = 'test-secret-key';

    const token = jwt.sign(payload, secret, { expiresIn: '1h' });
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = jwt.verify(token, secret);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  test('should be in test environment', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});
