const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration for Expo SDK 54
 *
 * Production optimizations:
 * - Support for .cjs files (Firebase compatibility)
 * - Package exports enabled
 * - Minification for production builds
 * - Source map optimization
 */
const config = getDefaultConfig(__dirname);

// Add support for CommonJS files (required for Firebase)
config.resolver.sourceExts.push('cjs');

// Ensure proper resolution of Firebase modules
config.resolver.unstable_enablePackageExports = true;

// Production optimizations
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig = {
    // Enable minification
    ecma: 8,
    keep_classnames: false,
    keep_fnames: false,
    mangle: {
      module: true,
      keep_classnames: false,
      keep_fnames: false,
    },
    module: true,
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    compress: {
      // Remove console.log in production
      drop_console: true,
      ecma: 8,
      keep_classnames: false,
      keep_fnames: false,
      passes: 3,
    },
  };
}

module.exports = config;
