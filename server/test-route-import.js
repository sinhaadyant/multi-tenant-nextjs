// Register TypeScript and path mapping
require('tsconfig-paths/register');
require('ts-node').register({
  transpileOnly: true,
});

console.log('Testing route imports...');

try {
  // Test importing individual routes
  const authRoutes = require('./src/routes/authRoutes');
  console.log('✅ Auth routes imported:', typeof authRoutes);
  console.log('Auth routes default export:', typeof authRoutes.default);

  const apiRoutes = require('./src/routes/index');
  console.log('✅ API routes imported:', typeof apiRoutes);
  console.log('API routes default export:', typeof apiRoutes.default);
} catch (error) {
  console.error('❌ Route import failed:', error.message);
  console.error('Stack:', error.stack);
}
