/**
 * Cleanup script to remove localStorage data that should no longer be used
 * after refactoring to store only auth tokens in localStorage and everything else in Redux
 */

const cleanupLocalStorage = () => {
  if (typeof window === 'undefined') {
    console.log('Running in server environment, skipping localStorage cleanup');
    return;
  }

  console.log('🧹 Starting localStorage cleanup...');

  // Items to remove (moved to Redux)
  const itemsToRemove = [
    'auth_user',
    'user_permissions',
    'permissions_timestamp',
    'sidebar_state'
  ];

  // Items to keep (auth tokens only)
  const itemsToKeep = [
    'auth_token',
    'refresh_token',
    'theme'
  ];

  let removedCount = 0;
  let keptCount = 0;

  // Remove items that should no longer be in localStorage
  itemsToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed: ${key}`);
      removedCount++;
    }
  });

  // Log items that are kept
  itemsToKeep.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`✅ Kept: ${key}`);
      keptCount++;
    }
  });

  // Log any other items that might need attention
  const allKeys = Object.keys(localStorage);
  const unexpectedKeys = allKeys.filter(key => 
    !itemsToKeep.includes(key) && 
    !itemsToRemove.includes(key) &&
    !key.startsWith('persist:') // Redux persist keys
  );

  if (unexpectedKeys.length > 0) {
    console.log('⚠️ Unexpected localStorage keys found:', unexpectedKeys);
  }

  console.log(`🧹 Cleanup complete: ${removedCount} items removed, ${keptCount} items kept`);
  console.log('📝 Only auth tokens should remain in localStorage. All other data is now in Redux.');
};

// Auto-run when script is loaded
if (typeof window !== 'undefined') {
  // Run cleanup after a short delay to ensure the page is fully loaded
  setTimeout(cleanupLocalStorage, 1000);
}
