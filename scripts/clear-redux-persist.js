#!/usr/bin/env node

/**
 * Clear Redux Persist State Script
 * 
 * This script clears corrupted Redux persist state from localStorage
 */

console.log('🧹 Clearing Redux Persist State...\n');

// Function to safely remove localStorage item
function safeRemove(key) {
  try {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(key);
      console.log(`✅ Removed: ${key}`);
    } else {
      console.log(`ℹ️  Not in browser environment, cannot remove: ${key}`);
    }
  } catch (error) {
    console.error(`❌ Error removing ${key}:`, error.message);
  }
}

// Function to check if persisted state is valid JSON
function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (error) {
    return false;
  }
}

// Function to validate Redux persist state structure
function validatePersistState(stateStr) {
  try {
    const parsed = JSON.parse(stateStr);
    
    // Check if it has the expected structure
    if (!parsed || typeof parsed !== 'object') {
      return false;
    }
    
    // Check if auth field exists and is a string (it should be JSON string)
    if (!parsed.auth || typeof parsed.auth !== 'string') {
      return false;
    }
    
    // Try to parse the auth field
    const authData = JSON.parse(parsed.auth);
    
    // Check if auth data has expected structure
    if (!authData || typeof authData !== 'object') {
      return false;
    }
    
    // Check for required fields
    const requiredFields = ['isLoggedIn', 'user', 'token', 'refreshToken', 'email'];
    for (const field of requiredFields) {
      if (!(field in authData)) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  
  // Check for Redux persist state
  const persistKey = 'persist:superadmin-root';
  const persistedState = localStorage.getItem(persistKey);
  
  if (persistedState) {
    console.log('📦 Found persisted Redux state');
    
    // Check if it's valid JSON
    if (!isValidJSON(persistedState)) {
      console.log('❌ Persisted state is not valid JSON');
      safeRemove(persistKey);
    } else {
      // Check if it has valid structure
      if (!validatePersistState(persistedState)) {
        console.log('❌ Persisted state has invalid structure');
        safeRemove(persistKey);
      } else {
        console.log('✅ Persisted state is valid');
        
        // Show state info
        try {
          const parsed = JSON.parse(persistedState);
          const authData = JSON.parse(parsed.auth);
          
          console.log('📊 Current auth state:');
          console.log(`   isLoggedIn: ${authData.isLoggedIn}`);
          console.log(`   hasUser: ${!!authData.user}`);
          console.log(`   hasToken: ${!!authData.token}`);
          console.log(`   hasRefreshToken: ${!!authData.refreshToken}`);
          console.log(`   email: ${authData.email || 'null'}`);
          
          // Ask if user wants to clear it anyway
          console.log('\n💡 To clear the persisted state, run:');
          console.log('   localStorage.removeItem("persist:superadmin-root");');
        } catch (error) {
          console.log('❌ Error reading persisted state:', error.message);
          safeRemove(persistKey);
        }
      }
    }
  } else {
    console.log('ℹ️  No persisted Redux state found');
  }
  
  // Check for other potential Redux-related localStorage items
  console.log('\n🔍 Checking for other Redux-related localStorage items...');
  const reduxKeys = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('persist:') || key.includes('redux') || key.includes('auth'))) {
      reduxKeys.push(key);
    }
  }
  
  if (reduxKeys.length > 0) {
    console.log('📦 Found other Redux-related items:');
    reduxKeys.forEach(key => {
      console.log(`   - ${key}`);
    });
    
    console.log('\n💡 To clear all Redux-related items, run:');
    reduxKeys.forEach(key => {
      console.log(`   localStorage.removeItem("${key}");`);
    });
  } else {
    console.log('ℹ️  No other Redux-related items found');
  }
  
} else {
  console.log('🖥️  Running in Node.js environment');
  console.log('This script is designed to run in a browser environment.');
  console.log('To clear Redux persist state:');
  console.log('1. Open browser console (F12)');
  console.log('2. Run: localStorage.removeItem("persist:superadmin-root");');
  console.log('3. Refresh the page');
}

console.log('\n🎯 Redux persist state check completed!'); 