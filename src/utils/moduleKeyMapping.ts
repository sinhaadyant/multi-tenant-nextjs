// Module key mapping to handle backend vs frontend module key differences
export const MODULE_KEY_MAPPING: { [key: string]: string } = {
  // Frontend expects 'users' but backend provides 'user-management'
  'users': 'user-management',
  'user': 'user-management',
  
  // Frontend expects 'roles' but backend provides 'roles-permissions'
  'roles': 'roles-permissions',
  'role': 'roles-permissions',
  
  // Frontend expects 'audit' but backend provides 'audit-logs'
  'audit': 'audit-logs',
  'audit-logs': 'audit-logs',
  
  // Frontend expects 'reports' but backend provides 'reports-analytics'
  'reports': 'reports-analytics',
  'reports-analytics': 'reports-analytics',
  
  // Frontend expects 'settings' but backend provides 'content-management'
  'settings': 'content-management',
  'content': 'content-management',
  
  // Other mappings as needed
  'dashboard': 'dashboard',
  'profile': 'profile',
  'support': 'support',
  'notifications': 'notifications',
  'analytics': 'analytics',
  'tenant-management': 'tenant-management'
};

/**
 * Maps a frontend module key to its corresponding backend module key
 * @param frontendKey - The module key used in frontend
 * @returns The corresponding backend module key
 */
export const mapFrontendToBackendKey = (frontendKey: string): string => {
  return MODULE_KEY_MAPPING[frontendKey] || frontendKey;
};

/**
 * Maps a backend module key to its corresponding frontend module key
 * @param backendKey - The module key from backend
 * @returns The corresponding frontend module key
 */
export const mapBackendToFrontendKey = (backendKey: string): string => {
  // Find the frontend key that maps to this backend key
  const frontendKey = Object.keys(MODULE_KEY_MAPPING).find(key => 
    MODULE_KEY_MAPPING[key] === backendKey
  );
  return frontendKey || backendKey;
};

/**
 * Checks if a module key needs mapping
 * @param key - The module key to check
 * @returns True if the key needs mapping
 */
export const needsMapping = (key: string): boolean => {
  return key in MODULE_KEY_MAPPING;
};

/**
 * Gets all possible frontend keys for a given backend key
 * @param backendKey - The backend module key
 * @returns Array of frontend keys that map to this backend key
 */
export const getFrontendKeysForBackendKey = (backendKey: string): string[] => {
  return Object.keys(MODULE_KEY_MAPPING).filter(key => 
    MODULE_KEY_MAPPING[key] === backendKey
  );
};
