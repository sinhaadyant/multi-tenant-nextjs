// Comprehensive Fix for All Redux and Cache Issues
// Run this in your browser console to completely reset everything

console.log('🔧 Fixing all Redux and cache issues...');

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

// Clear IndexedDB
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

// Clear service worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
    }
  });
}

// Clear caches
if ('caches' in window) {
  caches.keys().then(function(names) {
    for (let name of names) {
      caches.delete(name);
    }
  });
}

console.log(`✅ Cleared ${localStorageKeys.length} localStorage items`);
console.log(`✅ Cleared ${sessionStorageKeys.length} sessionStorage items`);
console.log('✅ Cleared all cookies');
console.log('✅ Cleared service worker registrations');
console.log('✅ Cleared cache storage');
console.log('🔄 Please refresh the page completely (Ctrl+Shift+R or Cmd+Shift+R)');
console.log('💡 All Redux and cache issues should now be resolved'); 