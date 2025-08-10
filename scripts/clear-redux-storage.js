// Script to clear problematic Redux storage data
// Run this in the browser console to clear any corrupted Redux state

console.log('🧹 Clearing Redux storage...');

// Clear all localStorage items that might contain Redux state
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (key.includes('superadmin') || key.includes('redux') || key.includes('persist'))) {
    keysToRemove.push(key);
  }
}

keysToRemove.forEach(key => {
  console.log(`Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log(`🧹 Cleared ${keysToRemove.length} Redux-related storage items`);
console.log('🔄 Please refresh the page to reinitialize Redux state'); 