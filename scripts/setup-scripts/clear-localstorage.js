// Simple script to clear localStorage
console.log('🧹 Clearing localStorage to fix JSON parsing issues...');

// Clear all localStorage items
localStorage.clear();

// Clear specific Redux persist items
localStorage.removeItem('persist:superadmin-root');
localStorage.removeItem('persist:root');

console.log('✅ localStorage cleared successfully!');
console.log('🔄 Please refresh the page to continue.'); 