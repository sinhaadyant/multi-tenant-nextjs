// Fix Redux Console Error Script
// Run this in your browser console to clear problematic Redux storage data

console.log('🔧 Fixing Redux console error...');

// Clear all Redux-related localStorage items
const keysToRemove = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key && (
    key.includes('superadmin') || 
    key.includes('redux') || 
    key.includes('persist') ||
    key.includes('auth')
  )) {
    keysToRemove.push(key);
  }
}

// Remove the problematic keys
keysToRemove.forEach(key => {
  console.log(`🗑️ Removing: ${key}`);
  localStorage.removeItem(key);
});

console.log(`✅ Cleared ${keysToRemove.length} Redux-related storage items`);
console.log('🔄 Please refresh the page to reinitialize Redux state');
console.log('💡 The console error should now be resolved');

// Also clear sessionStorage for good measure
const sessionKeysToRemove = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key && (
    key.includes('superadmin') || 
    key.includes('redux') || 
    key.includes('persist') ||
    key.includes('auth')
  )) {
    sessionKeysToRemove.push(key);
  }
}

sessionKeysToRemove.forEach(key => {
  console.log(`🗑️ Removing from sessionStorage: ${key}`);
  sessionStorage.removeItem(key);
});

console.log(`✅ Also cleared ${sessionKeysToRemove.length} sessionStorage items`); 