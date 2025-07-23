const fs = require('fs');
const path = require('path');

// Create directories
const dirs = [
  'public/icons',
  'public/screenshots'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Create a simple 1x1 transparent PNG
const transparentPNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

// Create placeholder files
const files = [
  'public/favicon.ico',
  'public/apple-touch-icon.png',
  // PWA Icons
  'public/icons/icon-72x72.png',
  'public/icons/icon-96x96.png',
  'public/icons/icon-128x128.png',
  'public/icons/icon-144x144.png',
  'public/icons/icon-152x152.png',
  'public/icons/icon-192x192.png',
  'public/icons/icon-384x384.png',
  'public/icons/icon-512x512.png',
  // Action Icons
  'public/icons/send-icon.png',
  'public/icons/receive-icon.png',
  'public/icons/swap-icon.png',
  'public/icons/open-icon.png',
  'public/icons/close-icon.png',
  'public/icons/badge-72x72.png',
  // MS Tile Icons
  'public/icons/mstile-70x70.png',
  'public/icons/mstile-150x150.png',
  'public/icons/mstile-310x310.png',
  'public/icons/mstile-310x150.png',
  // Screenshots
  'public/screenshots/desktop-1.png',
  'public/screenshots/mobile-1.png'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, transparentPNG);
    console.log(`Created placeholder: ${file}`);
  }
});

console.log('✅ All placeholder icons created successfully!');
