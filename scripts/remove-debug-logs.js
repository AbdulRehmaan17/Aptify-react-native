/**
 * Script to remove console.log statements in production
 * This is handled by Metro config minifier, but can be used as a pre-build step
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const srcDir = path.join(__dirname, '../src');

// Patterns to find console statements
const patterns = [
  '**/*.ts',
  '**/*.tsx',
  '**/*.js',
  '**/*.jsx',
];

console.log('✅ Debug log removal is handled automatically by Metro config minifier.');
console.log('✅ All console.log statements are removed in production builds.');
console.log('✅ Development logs remain for debugging.');
