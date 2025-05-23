// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver = config.resolver || {};
config.resolver.extraNodeModules = config.resolver.extraNodeModules || {};

try {
  console.log("Metro Config: Setting up extraNodeModules aliases...");

  config.resolver.extraNodeModules['stream'] = require.resolve('readable-stream');
  config.resolver.extraNodeModules['https'] = require.resolve('https-browserify');
  config.resolver.extraNodeModules['http'] = require.resolve('http-browserify');
  config.resolver.extraNodeModules['url'] = require.resolve('url');
  config.resolver.extraNodeModules['crypto'] = require.resolve('crypto-browserify');
  config.resolver.extraNodeModules['tls'] = require.resolve('tls-browserify');
  config.resolver.extraNodeModules['zlib'] = require.resolve('browserify-zlib');
  config.resolver.extraNodeModules['assert'] = require.resolve('assert');
  config.resolver.extraNodeModules['net'] = require.resolve('net-browserify');
  config.resolver.extraNodeModules['util'] = require.resolve('util');
  config.resolver.extraNodeModules['buffer'] = require.resolve('buffer/');
  config.resolver.extraNodeModules['events'] = require.resolve('events/');
  config.resolver.extraNodeModules['querystring'] = require.resolve('querystring-es3');
  config.resolver.extraNodeModules['path'] = require.resolve('path-browserify');
  
  // Add this line for the timers polyfill
  config.resolver.extraNodeModules['timers'] = require.resolve('timers-browserify');

  console.log("Metro Config: All extraNodeModules aliases configured successfully.");
} catch (e) {
  console.error("Metro Config: ERROR resolving a module for extraNodeModules", e);
}

module.exports = config;