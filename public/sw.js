// public/sw.js
const CACHE_NAME = 'multichain-wallet-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const API_CACHE = 'api-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/coingecko',
  '/api/health',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Cache first - for static assets
  cacheFirst: [
    /\.(js|css|woff2|woff|ttf|png|jpg|jpeg|svg|ico|webp)$/,
    /^\/icons\//,
    /^\/images\//,
  ],
  
  // Network first - for API calls
  networkFirst: [
    /^\/api\//,
    /coingecko\.com/,
  ],
  
  // Stale while revalidate - for pages
  staleWhileRevalidate: [
    /^\/$/,
    /^\/\w+$/,
  ],
};

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      }),
      self.skipWaiting(),
    ])
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (![CACHE_NAME, STATIC_CACHE, DYNAMIC_CACHE, API_CACHE].includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      self.clients.claim(),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip WebSocket connections
  if (url.protocol === 'ws:' || url.protocol === 'wss:') return;

  // Determine cache strategy
  let strategy = 'networkFirst'; // default

  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => pattern.test(url.pathname) || pattern.test(url.href))) {
      strategy = strategyName;
      break;
    }
  }

  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'networkFirst':
      event.respondWith(networkFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

// Cache first strategy
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Update cache in background
    fetch(request)
      .then(response => {
        if (response && response.ok) {
          cache.put(request, response.clone());
        }
      })
      .catch(() => {
        // Ignore errors in background update
      });
    
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    
    // Return offline fallback if available
    if (request.destination === 'document') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Network first strategy
async function networkFirst(request) {
  const cacheName = request.url.includes('/api/') ? API_CACHE : DYNAMIC_CACHE;
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      // Cache successful responses
      const responseClone = networkResponse.clone();
      
      // Set appropriate cache TTL based on content type
      const ttl = request.url.includes('/api/coingecko') ? 60000 : 300000; // 1 min for prices, 5 min for others
      
      cache.put(request, responseClone).catch(err => {
        console.warn('[SW] Failed to cache response:', err);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Network request failed, trying cache:', error);
    
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    // Return custom offline response for API requests
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({
          error: 'Offline',
          message: 'No cached data available',
          offline: true,
        }),
        {
          status: 503,
          statusText: 'Service Unavailable',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    throw error;
  }
}

// Stale while revalidate strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request)
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(error => {
      console.warn('[SW] Fetch failed:', error);
      return cachedResponse;
    });
  
  return cachedResponse || fetchPromise;
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('[SW] Performing background sync');
  // Implementation for retrying failed requests
}

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push message received');
  
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1',
    },
    actions: [
      {
        action: 'explore',
        title: 'Open Wallet',
        icon: '/icons/open-icon.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification('MultiChain Wallet', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification click received');
  
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

console.log('[SW] Service Worker loaded');
