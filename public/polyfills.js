// Browser polyfills for Node.js APIs
if (typeof global === 'undefined') {
  window.global = window;
}

if (typeof process === 'undefined') {
  window.process = {
    env: {},
    version: '',
    versions: {},
    browser: true,
    nextTick: function(fn) {
      setTimeout(fn, 0);
    }
  };
}

// Buffer polyfill is loaded via webpack, but ensure it's globally available
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = require('buffer/').Buffer;
}
