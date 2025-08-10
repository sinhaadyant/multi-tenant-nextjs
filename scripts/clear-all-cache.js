// Comprehensive Cache Clearing Script
// Run this in your browser console to clear all problematic data

console.log('🧹 Clearing all cache and storage...');

// Clear localStorage
const localStorageKeys = [];
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key) {
    localStorageKeys.push(key);
    localStorage.removeItem(key);
  }
}

// Clear sessionStorage
const sessionStorageKeys = [];
for (let i = 0; i < sessionStorage.length; i++) {
  const key = sessionStorage.key(i);
  if (key) {
    sessionStorageKeys.push(key);
    sessionStorage.removeItem(key);
  }
}

// Clear IndexedDB (if supported)
if ('indexedDB' in window) {
  indexedDB.databases().then(databases => {
    databases.forEach(db => {
      console.log(`🗑️ Removing IndexedDB: ${db.name}`);
      indexedDB.deleteDatabase(db.name);
    });
  });
}

// Clear cookies
document.cookie.split(";").forEach(function(c) { 
  document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
});

console.log(`✅ Cleared ${localStorageKeys.length} localStorage items`);
console.log(`✅ Cleared ${sessionStorageKeys.length} sessionStorage items`);
console.log('✅ Cleared all cookies');
console.log('🔄 Please refresh the page completely (Ctrl+Shift+R or Cmd+Shift+R)');
console.log('💡 This should resolve both the Redux and component errors'); 