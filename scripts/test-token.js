const jwt = require('jsonwebtoken');

// This script can be run to test JWT tokens
function testToken(token) {
  console.log('🔍 Testing JWT token...');
  console.log('Token length:', token?.length || 0);
  console.log('Token preview:', token ? `${token.substring(0, 50)}...` : 'undefined');
  
  if (!token) {
    console.log('❌ No token provided');
    return;
  }
  
  try {
    // Try to decode without verification first
    const decoded = jwt.decode(token);
    console.log('📋 Decoded token (without verification):', decoded);
    
    // Try to verify with JWT_SECRET
    const JWT_SECRET = "3394b55a8f77447880736ddf1018b0cf12253f647ae4446c2166f447eda14901";
    const verified = jwt.verify(token, JWT_SECRET);
    console.log('✅ Verified token:', verified);
    
    return verified;
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return null;
  }
}

// If running directly, you can test a token
if (require.main === module) {
  const token = process.argv[2];
  if (token) {
    testToken(token);
  } else {
    console.log('Usage: node scripts/test-token.js <token>');
  }
}

module.exports = { testToken }; 