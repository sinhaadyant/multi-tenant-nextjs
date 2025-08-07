# LocalStorage Utility Implementation Guide

## Overview

This document provides a comprehensive guide to the localStorage utility implementation in the multi-tenant Next.js application. The utility provides robust error handling, automatic caching, and type-safe operations for managing client-side data persistence.

## Features

- ✅ **Error Handling**: Comprehensive error handling for all localStorage operations
- ✅ **Type Safety**: Full TypeScript support with generic types
- ✅ **Automatic Caching**: Built-in caching with configurable expiration
- ✅ **Quota Management**: Automatic handling of storage quota exceeded errors
- ✅ **Data Validation**: Automatic cleanup of corrupted or expired data
- ✅ **Cross-tab Synchronization**: Real-time updates across browser tabs
- ✅ **Performance Optimization**: Batch operations and efficient data management
- ✅ **Developer Tools**: Storage manager component for debugging and maintenance

## Core Components

### 1. LocalStorage Utility (`src/lib/localStorage.ts`)

The main utility class that provides all localStorage operations with error handling.

#### Key Features:
- **Availability Check**: Automatically detects if localStorage is available
- **Error Recovery**: Handles quota exceeded and parsing errors gracefully
- **Expiration Management**: Automatic cleanup of expired data
- **Batch Operations**: Efficient bulk operations for better performance

#### Basic Usage:

```typescript
import { storage } from '@/lib/localStorage';

// Set data
storage.set('user_preferences', { theme: 'dark', language: 'en' });

// Get data
const preferences = storage.get('user_preferences');

// Cache data with expiration (5 minutes)
storage.cache('dashboard_data', data, 5 * 60 * 1000);

// Get cached data
const cachedData = storage.getCached('dashboard_data');
```

### 2. React Hooks (`src/hooks/useLocalStorageState.ts`)

Specialized hooks for React components that provide state management with localStorage persistence.

#### Available Hooks:

##### `useLocalStorageState`
```typescript
const [value, setValue, removeValue, hasValue] = useLocalStorageState(
  'my-key',
  defaultValue,
  expiresIn
);
```

##### `useCachedState`
```typescript
const [value, setValue, removeValue, isExpired] = useCachedState(
  'my-key',
  defaultValue,
  expiresIn
);
```

##### `useFormState`
```typescript
const [values, setValues, updateValue, resetValues, clearValues] = useFormState(
  'form-data',
  initialValues,
  expiresIn
);
```

##### `usePaginationState`
```typescript
const [pagination, setPage, setPageSize, resetPagination] = usePaginationState(
  'table-pagination',
  initialPage,
  initialPageSize
);
```

##### `useFilterState`
```typescript
const [filters, setFilters, updateFilter, clearFilters, resetFilters] = useFilterState(
  'table-filters',
  initialFilters
);
```

##### `useSearchHistory`
```typescript
const [history, addSearch, clearHistory, removeSearch] = useSearchHistory(
  'search-history',
  maxHistory
);
```

### 3. Storage Manager Component (`src/components/common/LocalStorageManager.tsx`)

A UI component for managing and debugging localStorage data.

#### Features:
- **Storage Usage Display**: Shows current storage usage and limits
- **Cache Management**: View and manage cached entries
- **Data Cleanup**: Clear expired or all cached data
- **Real-time Updates**: Live updates of storage information

## Implementation Examples

### 1. Authentication Data Management

```typescript
// In auth slice
import { storage } from '@/lib/localStorage';

const getInitialState = (): AuthState => {
  const token = storage.getAuthToken();
  const user = storage.getAuthUser();
  
  if (token && user) {
    return {
      isAuthenticated: true,
      user,
      token,
      isLoading: false,
      error: null,
      isInitialized: true,
    };
  }
  
  return {
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: false,
    error: null,
    isInitialized: true,
  };
};

// Clear auth data on logout
const logout = (state) => {
  storage.clearAuth();
  return {
    ...state,
    isAuthenticated: false,
    user: null,
    token: null,
  };
};
```

### 2. Dashboard Data Caching

```typescript
// In dashboard hook
const fetchDashboardData = async (range: string): Promise<DashboardData> => {
  // Check cache first
  const cachedData = storage.getDashboardData(range);
  if (cachedData) {
    return cachedData;
  }

  // Fetch from API
  const response = await api.get(`/superadmin/dashboard?range=${range}`);
  const data = response.data.data;
  
  // Cache the response
  storage.setDashboardData(range, data);
  
  return data;
};
```

### 3. Table State Persistence

```typescript
// In table component
const [pagination, setPage, setPageSize] = usePaginationState(
  'users-table',
  1,
  10
);

const [filters, setFilters, updateFilter] = useFilterState(
  'users-filters',
  {
    search: '',
    status: [],
    role: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  }
);

// Filters and pagination are automatically persisted
```

### 4. User Preferences

```typescript
// Theme management
const [theme, setTheme] = useLocalStorageState('theme', 'light');

// Sidebar state
const [sidebarState, setSidebarState] = useLocalStorageState(
  'sidebar-state',
  { isExpanded: true }
);

// User preferences
const [preferences, setPreferences] = useLocalStorageState(
  'user-preferences',
  {
    notifications: true,
    language: 'en',
    timezone: 'UTC'
  }
);
```

## Storage Keys and Constants

### Predefined Storage Keys

```typescript
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  AUTH_USER: 'auth_user',
  DASHBOARD_DATA: 'dashboard_data',
  TENANT_DATA: 'tenant_data',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebar_state',
  TABLE_PREFERENCES: 'table_preferences',
  FILTER_STATE: 'filter_state',
  SEARCH_HISTORY: 'search_history',
  NOTIFICATIONS: 'notifications',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_SETTINGS: 'system_settings',
};
```

### Cache Expiration Times

```typescript
export const CACHE_EXPIRY = {
  DASHBOARD: 5 * 60 * 1000,        // 5 minutes
  TENANT_DATA: 10 * 60 * 1000,     // 10 minutes
  USER_PREFERENCES: 24 * 60 * 60 * 1000, // 24 hours
  AUDIT_LOGS: 30 * 60 * 1000,      // 30 minutes
  SYSTEM_SETTINGS: 60 * 60 * 1000, // 1 hour
};
```

## Error Handling

### Error Types

```typescript
export enum LocalStorageError {
  NOT_AVAILABLE = 'localStorage_not_available',
  QUOTA_EXCEEDED = 'quota_exceeded',
  INVALID_DATA = 'invalid_data',
  EXPIRED = 'data_expired',
  PARSE_ERROR = 'parse_error',
}
```

### Error Recovery

The utility automatically handles common errors:

1. **Quota Exceeded**: Automatically clears old cache entries
2. **Parse Errors**: Removes corrupted data and returns default values
3. **Availability Issues**: Gracefully degrades when localStorage is not available
4. **Expired Data**: Automatically removes expired cache entries

## Performance Optimization

### Batch Operations

```typescript
// Batch set multiple values
const results = storage.batchSet([
  { key: 'key1', value: 'value1' },
  { key: 'key2', value: 'value2', expiresIn: 60000 }
]);

// Batch get multiple values
const values = storage.batchGet(['key1', 'key2', 'key3']);

// Batch remove multiple values
const removed = storage.batchRemove(['key1', 'key2']);
```

### Automatic Cleanup

```typescript
// Clear expired cache entries
storage.clearExpiredCache();

// Get storage information
const info = storage.getStorageInfo();
console.log(`Used: ${info.used} bytes, Available: ${info.available} bytes`);
```

## Best Practices

### 1. Key Naming Convention

```typescript
// Use descriptive, namespaced keys
const keys = {
  'auth:token': 'user authentication token',
  'dashboard:data:7d': 'dashboard data for 7 days',
  'table:users:pagination': 'users table pagination state',
  'preferences:theme': 'user theme preference'
};
```

### 2. Data Structure

```typescript
// Store structured data with metadata
const dataToStore = {
  data: actualData,
  metadata: {
    version: '1.0',
    createdAt: Date.now(),
    expiresAt: Date.now() + expiresIn
  }
};
```

### 3. Error Handling

```typescript
// Always handle potential errors
const setData = (key: string, value: any) => {
  const success = storage.set(key, value);
  if (!success) {
    console.error('Failed to store data:', key);
    // Fallback handling
  }
  return success;
};
```

### 4. Cache Management

```typescript
// Use appropriate cache expiration times
const cacheConfig = {
  'frequently-changing': 1 * 60 * 1000,    // 1 minute
  'moderately-changing': 5 * 60 * 1000,    // 5 minutes
  'rarely-changing': 30 * 60 * 1000,       // 30 minutes
  'static': 24 * 60 * 60 * 1000           // 24 hours
};
```

## Integration with Existing Code

### 1. API Layer Integration

The localStorage utility is integrated with the API layer to provide automatic caching:

```typescript
// In API hooks
const fetchData = async () => {
  // Check cache first
  const cached = storage.getCached(cacheKey);
  if (cached) return cached;

  // Fetch from API
  const response = await api.get('/endpoint');
  const data = response.data;

  // Cache the response
  storage.cache(cacheKey, data, CACHE_EXPIRY.DASHBOARD);
  return data;
};
```

### 2. State Management Integration

Redux slices use localStorage for persistence:

```typescript
// In Redux slice
const getInitialState = () => {
  const saved = storage.get('slice-key');
  return saved || defaultState;
};

const slice = createSlice({
  name: 'slice',
  initialState: getInitialState(),
  reducers: {
    updateState: (state, action) => {
      Object.assign(state, action.payload);
      storage.set('slice-key', state);
    }
  }
});
```

### 3. Component Integration

React components use hooks for state persistence:

```typescript
// In React component
const MyComponent = () => {
  const [filters, setFilters] = useFilterState('my-filters', {
    search: '',
    category: 'all'
  });

  const [pagination, setPage] = usePaginationState('my-table', 1, 20);

  // State is automatically persisted
  return (
    <div>
      <input
        value={filters.search}
        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
      />
      <Table
        currentPage={pagination.currentPage}
        onPageChange={setPage}
      />
    </div>
  );
};
```

## Debugging and Maintenance

### 1. Storage Manager Component

Use the LocalStorageManager component to debug and manage storage:

```typescript
import { LocalStorageManager } from '@/components/common/LocalStorageManager';

// In your component
<LocalStorageManager />
```

### 2. Development Tools

```typescript
// Enable debug logging
if (process.env.NODE_ENV === 'development') {
  console.log('Storage operations:', {
    set: storage.set('debug', 'test'),
    get: storage.get('debug'),
    has: storage.has('debug')
  });
}
```

### 3. Storage Monitoring

```typescript
// Monitor storage usage
const monitorStorage = () => {
  const info = storage.getStorageInfo();
  if (info.percentage > 80) {
    console.warn('Storage usage is high:', info.percentage + '%');
    storage.clearExpiredCache();
  }
};

// Run periodically
setInterval(monitorStorage, 60000); // Every minute
```

## Migration Guide

### From Direct localStorage Usage

**Before:**
```typescript
// Direct localStorage usage
localStorage.setItem('key', JSON.stringify(value));
const data = JSON.parse(localStorage.getItem('key') || 'null');
```

**After:**
```typescript
// Using the utility
storage.set('key', value);
const data = storage.get('key');
```

### From Custom Caching

**Before:**
```typescript
// Custom caching implementation
const cache = {
  set: (key, value, ttl) => {
    const item = {
      data: value,
      expires: Date.now() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  },
  get: (key) => {
    const item = JSON.parse(localStorage.getItem(key));
    if (item && item.expires > Date.now()) {
      return item.data;
    }
    return null;
  }
};
```

**After:**
```typescript
// Using the utility
storage.cache('key', value, ttl);
const data = storage.getCached('key');
```

## Conclusion

The localStorage utility provides a robust, type-safe, and feature-rich solution for client-side data persistence. It handles common edge cases, provides automatic caching, and integrates seamlessly with React components and state management.

Key benefits:
- **Reliability**: Comprehensive error handling and recovery
- **Performance**: Efficient caching and batch operations
- **Developer Experience**: Type safety and debugging tools
- **Maintainability**: Centralized storage management
- **Scalability**: Automatic quota management and cleanup

For questions or issues, refer to the component documentation or create an issue in the project repository. 