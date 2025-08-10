#!/usr/bin/env node

/**
 * Quick Cache Clear Script
 * 
 * One-liner to clear all caches quickly
 */

const fs = require('fs');

console.log('🧹 Quick cache clear...');

// Remove common cache directories
['.next', '.swc', 'temp', 'test-screenshots'].forEach(dir => {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
    console.log(`✅ Removed ${dir}`);
  }
});

// Remove cache files
['tsconfig.tsbuildinfo'].forEach(file => {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`✅ Removed ${file}`);
  }
});

console.log('✨ Quick cache clear completed!');
console.log('💡 Run "npm run dev" to restart the server'); 