import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import authReducer, { setHydrated } from './slices/authSlice';
import tenantAuthReducer, { setTenantHydrated } from './slices/tenantAuthSlice';
import { FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';

// Custom storage that handles sync storage fallback gracefully
const customStorage = {
  getItem: (key: string) => {
    try {
      return storage.getItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Redux-persist storage getItem failed, falling back to noop storage');
      }
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      return storage.setItem(key, value);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Redux-persist storage setItem failed, falling back to noop storage');
      }
    }
  },
  removeItem: (key: string) => {
    try {
      return storage.removeItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Redux-persist storage removeItem failed, falling back to noop storage');
      }
    }
  }
};

// Custom middleware to handle unexpected state keys
const unexpectedKeysMiddleware = (store: any) => (next: any) => (action: any) => {
  // Check if the action is a rehydration action
  if (action.type === REHYDRATE && action.payload) {
    // Clean up any unexpected keys from the payload
    const { value, expiry, ...cleanPayload } = action.payload;
    if (Object.keys(cleanPayload).length !== Object.keys(action.payload).length) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('🧹 Redux: Removed unexpected keys from rehydration payload:', { value, expiry });
      }
      action.payload = cleanPayload;
    }
    
    // Also clean up any nested unexpected keys in the auth state
    if (action.payload.auth && typeof action.payload.auth === 'object') {
      const { value: authValue, expiry: authExpiry, ...cleanAuth } = action.payload.auth;
      if (Object.keys(cleanAuth).length !== Object.keys(action.payload.auth).length) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('🧹 Redux: Removed unexpected keys from auth state:', { authValue, authExpiry });
        }
        action.payload.auth = cleanAuth;
      }
    }
  }
  return next(action);
};

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
  tenantAuth: tenantAuthReducer,
});

// Configure persist
const persistConfig = {
  key: 'superadmin-root',
  storage: customStorage,
  whitelist: ['auth', 'tenantAuth'], // Persist both auth states
  migrate: (state: any) => {
    // Migration function to handle any state format changes
    if (state && typeof state === 'object') {
      // Remove any unexpected keys that might cause reducer warnings
      const { value, expiry, ...cleanState } = state;
      
      // Also clean up nested auth state if it exists
      if (cleanState.auth && typeof cleanState.auth === 'object') {
        const { value: authValue, expiry: authExpiry, ...cleanAuth } = cleanState.auth;
        cleanState.auth = cleanAuth;
      }
      
      // Ensure we only have expected keys
      const expectedKeys = ['auth', 'tenantAuth'];
      const finalState: any = {};
      
      expectedKeys.forEach(key => {
        if (cleanState[key] !== undefined) {
          finalState[key] = cleanState[key];
        }
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Redux Persist: Migrated state to clean format', finalState);
      }
      
      return Promise.resolve(finalState);
    }
    return Promise.resolve(state);
  },
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
      // Add custom middleware to handle unexpected state keys
      immutableCheck: {
        warnAfter: 128,
      },
    }).concat(unexpectedKeysMiddleware),
  devTools: process.env.NODE_ENV === 'development',
});

// Create persistor
export const persistor = persistStore(store, {}, () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 Redux Persist: Rehydration complete');
  }
  // Dispatch hydration action after rehydration is complete
  store.dispatch(setHydrated());
  store.dispatch(setTenantHydrated());
});

// Add debugging for rehydration issues
if (process.env.NODE_ENV === 'development') {
  persistor.subscribe(() => {
    const { bootstrapped } = persistor.getState();
    if (bootstrapped) {
      const state = store.getState();
      // Only log if there are unexpected keys or issues
      const hasUnexpectedKeys = Object.keys(state).some(key => !['auth', 'tenantAuth'].includes(key));
      if (hasUnexpectedKeys) {
        console.log('🔄 Redux Persist: Store state after rehydration:', {
          auth: state.auth,
          tenantAuth: state.tenantAuth,
          hasUnexpectedKeys: true,
        });
      }
    }
  });
}

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 