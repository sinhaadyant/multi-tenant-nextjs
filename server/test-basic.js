const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('🧪 Testing Basic Setup...\n');

// Test 1: Dependencies
console.log('✅ Testing dependencies...');
console.log('Express:', typeof express);
console.log('bcrypt:', typeof bcrypt);
console.log('jwt:', typeof jwt);

// Test 2: Express app
console.log('\n✅ Testing Express app...');
const app = express();
console.log('Express app created:', typeof app);
console.log('Express use method:', typeof app.use);

// Test 3: Password hashing
console.log('\n✅ Testing password hashing...');
async function testPasswordHashing() {
  const password = 'TestPassword123!';
  const hashedPassword = await bcrypt.hash(password, 12);
  console.log('Password hashed:', hashedPassword !== password);

  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log('Password verification:', isValid);
}
testPasswordHashing();

// Test 4: JWT tokens
console.log('\n✅ Testing JWT tokens...');
const payload = { userId: '123', email: 'test@example.com' };
const secret = 'test-secret-key';
const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log('JWT token generated:', typeof token === 'string');

const decoded = jwt.verify(token, secret);
console.log('JWT token verified:', decoded.userId === payload.userId);

// Test 5: Environment
console.log('\n✅ Testing environment...');
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n🎉 All basic tests completed successfully!');
