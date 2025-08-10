async function globalTeardown() {
  console.log('🧹 Starting global teardown...');
  
  // Close the browser instance
  if (global.__BROWSER__) {
    await global.__BROWSER__.close();
  }
  
  console.log('✅ Global teardown completed');
}

module.exports = globalTeardown; 