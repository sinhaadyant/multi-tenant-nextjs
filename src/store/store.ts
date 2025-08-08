import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web
import authReducer, { setHydrated } from './slices/authSlice';

// Root reducer
const rootReducer = combineReducers({
  auth: authReducer,
});

// Redux Persist configuration
const persistConfig = {
  key: 'superadmin-root',
  version: 1,
  storage,
  whitelist: ['auth'], // Only persist auth slice
  // Persist all auth data including tokens for now
  // In production, you might want to exclude sensitive data
};

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// Configure store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Create persistor
export const persistor = persistStore(store, {}, () => {
  // Callback fired when rehydration is complete
  console.log('🔄 Redux Persist: Rehydration complete');
  store.dispatch(setHydrated());
  
  // Debug: Check what's in the store after rehydration
  const state = store.getState();
  console.log('🔄 Redux Persist: Store state after rehydration:', {
    isLoggedIn: state.auth.isLoggedIn,
    hasUser: !!state.auth.user,
    hasToken: !!state.auth.token,
    hasRefreshToken: !!state.auth.refreshToken,
    isHydrated: state.auth.isHydrated,
    isInitialized: state.auth.isInitialized,
  });
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 