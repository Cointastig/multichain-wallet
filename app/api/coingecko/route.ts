// app/api/coingecko/route.ts
import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';
const RATE_LIMIT = 50; // requests per minute
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  return ip;
}

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const userRequest = requestCounts.get(key);
  
  if (!userRequest || now > userRequest.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute
    return false;
  }
  
  if (userRequest.count >= RATE_LIMIT) {
    return true;
  }
  
  userRequest.count++;
  return false;
}

export async function GET(request: NextRequest) {
  try {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: corsHeaders }
      );
    }

    // Get the path from the URL
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').slice(3); // Remove /api/coingecko
    const endpoint = pathSegments.join('/');
    const searchParams = url.searchParams.toString();
    
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate endpoint against allowed paths
    const allowedEndpoints = [
      'simple/price',
      'coins/markets',
      'coins/list',
      'search',
      'ping',
      'global',
      'coins/bitcoin',
      'coins/ethereum',
      'coins/tether',
      'coins/binancecoin',
      'coins/solana',
      'coins/cardano',
      'coins/polkadot',
      'coins/avalanche-2',
      'coins/matic-network',
      'coins/fantom',
    ];

    const isAllowed = allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Endpoint not allowed' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Build the CoinGecko URL
    const coingeckoUrl = `${COINGECKO_BASE_URL}/${endpoint}${searchParams ? `?${searchParams}` : ''}`;
    
    console.log(`[CoinGecko Proxy] Fetching: ${coingeckoUrl}`);

    // Prepare headers for CoinGecko request
    const headers: HeadersInit = {
      'Accept': 'application/json',
      'User-Agent': 'MultiChain-Wallet/1.0.0',
    };

    // Add API key if available
    const apiKey = process.env.COINGECKO_API_KEY;
    if (apiKey) {
      headers['X-Cg-Pro-Api-Key'] = apiKey;
    }

    // Make the request to CoinGecko
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(coingeckoUrl, {
      headers,
      signal: controller.signal,
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[CoinGecko Proxy] Error: ${response.status} ${response.statusText}`);
      
      if (response.status === 429) {
        return NextResponse.json(
          { 
            error: 'CoinGecko rate limit exceeded',
            retryAfter: response.headers.get('Retry-After') || '60'
          },
          { 
            status: 429, 
            headers: {
              ...corsHeaders,
              'Retry-After': response.headers.get('Retry-After') || '60'
            }
          }
        );
      }

      return NextResponse.json(
        { 
          error: 'CoinGecko API error',
          status: response.status,
          message: response.statusText
        },
        { status: response.status, headers: corsHeaders }
      );
    }

    const data = await response.json();
    
    // Add cache headers
    const responseHeaders = {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/json',
    };

    return NextResponse.json(data, { headers: responseHeaders });

  } catch (error) {
    console.error('[CoinGecko Proxy] Error:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error?.toString() : 'An error occurred'
      },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      coingecko: 'operational',
      database: 'operational',
    }
  });
}

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

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'price-update') {
    event.waitUntil(updatePrices());
  }
});

async function updatePrices() {
  try {
    const response = await fetch('/api/coingecko/simple/price?ids=bitcoin,ethereum,tether&vs_currencies=usd');
    
    if (response.ok) {
      const prices = await response.json();
      
      // Store in cache
      const cache = await caches.open(API_CACHE);
      await cache.put(
        new Request('/api/coingecko/prices'),
        new Response(JSON.stringify(prices), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
      
      // Notify clients of price update
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'PRICE_UPDATE',
          data: prices,
        });
      });
    }
  } catch (error) {
    console.error('[SW] Failed to update prices:', error);
  }
}

// Message handling for client communication
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  } else if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(clearAllCaches());
  }
});

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[SW] All caches cleared');
}

console.log('[SW] Service Worker loaded');

// public/offline.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Offline - MultiChain Wallet</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        .container {
            text-align: center;
            max-width: 400px;
            padding: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .icon {
            width: 80px;
            height: 80px;
            margin: 0 auto 20px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
        }
        h1 {
            margin: 0 0 10px;
            font-size: 24px;
            font-weight: 600;
        }
        p {
            margin: 0 0 30px;
            opacity: 0.9;
            line-height: 1.5;
        }
        .button {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 12px 24px;
            border-radius: 10px;
            text-decoration: none;
            display: inline-block;
            font-weight: 500;
            transition: all 0.3s ease;
        }
        .button:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="icon">📱</div>
        <h1>You're Offline</h1>
        <p>Your wallet is working offline with cached data. Some features may be limited until you reconnect to the internet.</p>
        <a href="/" class="button" onclick="window.location.reload()">Try Again</a>
    </div>
    
    <script>
        // Auto-retry when connection is restored
        window.addEventListener('online', () => {
            window.location.reload();
        });
    </script>
</body>
</html>
