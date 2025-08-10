#!/usr/bin/env node

/**
 * Debug JWT Token Script
 * 
 * This script helps debug JWT token issues by checking:
 * - Token storage locations
 * - Token validity
 * - Token expiration
 * - Token payload
 */

console.log('🔍 JWT Token Debug Script\n');

// Check if we're in a browser environment
if (typeof window !== 'undefined') {
  console.log('🌐 Running in browser environment');
  
  // Check localStorage
  console.log('\n📦 Checking localStorage:');
  try {
    const authToken = localStorage.getItem('auth_token');
    const authUser = localStorage.getItem('auth_user');
    
    if (authToken) {
      console.log('✅ auth_token found');
      analyzeToken(authToken, 'localStorage auth_token');
    } else {
      console.log('❌ auth_token not found');
    }
    
    if (authUser) {
      console.log('✅ auth_user found');
      try {
        const user = JSON.parse(authUser);
        console.log('   User:', { id: user.id, email: user.email, role: user.role });
      } catch (error) {
        console.log('❌ auth_user is not valid JSON');
      }
    } else {
      console.log('❌ auth_user not found');
    }
  } catch (error) {
    console.log('❌ Error accessing localStorage:', error.message);
  }
  
  // Check sessionStorage
  console.log('\n📦 Checking sessionStorage:');
  try {
    const accessToken = sessionStorage.getItem('access_token');
    
    if (accessToken) {
      console.log('✅ access_token found');
      analyzeToken(accessToken, 'sessionStorage access_token');
    } else {
      console.log('❌ access_token not found');
    }
  } catch (error) {
    console.log('❌ Error accessing sessionStorage:', error.message);
  }
  
  // Check Redux persist
  console.log('\n📦 Checking Redux persist:');
  try {
    const persistedState = localStorage.getItem('persist:superadmin-root');
    
    if (persistedState) {
      console.log('✅ persist:superadmin-root found');
      try {
        const parsed = JSON.parse(persistedState);
        const authData = parsed.auth ? JSON.parse(parsed.auth) : null;
        
        if (authData?.token) {
          console.log('✅ Redux auth token found');
          analyzeToken(authData.token, 'Redux persist token');
        } else {
          console.log('❌ Redux auth token not found');
        }
        
        if (authData?.user) {
          console.log('✅ Redux auth user found');
          console.log('   User:', { id: authData.user.id, email: authData.user.email, role: authData.user.role });
        } else {
          console.log('❌ Redux auth user not found');
        }
      } catch (error) {
        console.log('❌ Error parsing Redux persist data:', error.message);
      }
    } else {
      console.log('❌ persist:superadmin-root not found');
    }
  } catch (error) {
    console.log('❌ Error accessing Redux persist:', error.message);
  }
  
} else {
  console.log('🖥️  Running in Node.js environment');
  console.log('This script is designed to run in a browser environment.');
  console.log('To debug tokens, open browser console and run:');
  console.log('   debugToken()');
}

function analyzeToken(token, source) {
  try {
    // Check token format
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log(`   ❌ Invalid token format (${parts.length} parts instead of 3)`);
      return;
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    // Check required fields
    const hasId = !!payload.id;
    const hasEmail = !!payload.email;
    const hasRole = !!payload.role;
    const hasExp = !!payload.exp;
    
    console.log(`   ✅ Token format valid`);
    console.log(`   📋 Payload:`, {
      id: payload.id,
      email: payload.email,
      role: payload.role,
      iat: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'missing',
      exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'missing'
    });
    
    // Check expiration
    if (hasExp) {
      const now = Date.now() / 1000;
      const isExpired = payload.exp < now;
      console.log(`   ⏰ Expiration: ${isExpired ? '❌ EXPIRED' : '✅ Valid'}`);
      if (isExpired) {
        console.log(`   ⏰ Expired ${Math.floor((now - payload.exp) / 60)} minutes ago`);
      }
    } else {
      console.log(`   ⏰ Expiration: ❌ No expiration field`);
    }
    
    // Check required fields
    console.log(`   🔍 Required fields:`, {
      id: hasId ? '✅' : '❌',
      email: hasEmail ? '✅' : '❌',
      role: hasRole ? '✅' : '❌'
    });
    
  } catch (error) {
    console.log(`   ❌ Error analyzing token: ${error.message}`);
  }
}

console.log('\n🎯 Token analysis complete!'); 