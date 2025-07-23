import { NextRequest, NextResponse } from 'next/server';
import Bottleneck from 'bottleneck';

const COINGECKO_BASE_URL = 'https://api.coingecko.com/api/v3';

// Create a limiter instance - 30 requests per minute for Demo tier
const limiter = new Bottleneck({
  minTime: 2000, // Minimum 2 seconds between requests
  maxConcurrent: 1, // One request at a time
  reservoir: 30, // 30 requests available
  reservoirRefreshAmount: 30, // Refill to 30 requests
  reservoirRefreshInterval: 60 * 1000, // Every 60 seconds
  retryCondition: (error: any) => {
    // Retry on rate limit or server errors
    return error?.response?.status === 429 || 
           (error?.response?.status >= 500 && error?.response?.status < 600);
  },
  strategy: Bottleneck.strategy.OVERFLOW_PRIORITY
});

// Track per-IP rate limits
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
             request.headers.get('x-real-ip') || 
             request.headers.get('cf-connecting-ip') ||
             'unknown';
  return ip;
}

function isIpRateLimited(ip: string, limit = 20): boolean {
  const now = Date.now();
  const userRequest = ipRateLimits.get(ip);
  
  if (!userRequest || now > userRequest.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + 60000 });
    return false;
  }
  
  if (userRequest.count >= limit) {
    return true;
  }
  
  userRequest.count++;
  return false;
}

// Exponential backoff with jitter
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  initialDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on client errors (except rate limit)
      if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
        throw error;
      }
      
      if (attempt < maxRetries - 1) {
        // Calculate delay with exponential backoff and jitter
        const baseDelay = Math.min(initialDelay * Math.pow(2, attempt), 30000);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;
        
        // If we got a Retry-After header, use that instead
        const retryAfter = error.response?.headers?.['retry-after'];
        const finalDelay = retryAfter ? parseInt(retryAfter) * 1000 : delay;
        
        console.log(`[CoinGecko Proxy] Retrying after ${finalDelay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, finalDelay));
      }
    }
  }
  
  throw lastError;
}

// Clean up old rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRateLimits.entries()) {
    if (now > data.resetTime + 300000) { // 5 minutes after reset
      ipRateLimits.delete(ip);
    }
  }
}, 300000); // Every 5 minutes

export async function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  
  try {
    // Enable CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Check IP rate limiting
    if (isIpRateLimited(clientIp)) {
      console.warn(`[CoinGecko Proxy] Rate limit exceeded for IP: ${clientIp}`);
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: 'Too many requests from your IP. Please try again later.'
        },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': '60' } }
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
      'trending',
      'exchange_rates',
    ];

    const isAllowed = allowedEndpoints.some(allowed => endpoint.startsWith(allowed));
    if (!isAllowed) {
      console.warn(`[CoinGecko Proxy] Blocked endpoint: ${endpoint}`);
      return NextResponse.json(
        { error: 'Endpoint not allowed' },
        { status: 403, headers: corsHeaders }
      );
    }

    // Build the CoinGecko URL
    const coingeckoUrl = `${COINGECKO_BASE_URL}/${endpoint}${searchParams ? `?${searchParams}` : ''}`;
    
    console.log(`[CoinGecko Proxy] Fetching: ${coingeckoUrl} for IP: ${clientIp}`);

    // Execute request with rate limiting and retry logic
    const response = await limiter.schedule(() => 
      retryWithBackoff(async () => {
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

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        try {
          const res = await fetch(coingeckoUrl, {
            headers,
            signal: controller.signal,
            next: { revalidate: 60 }, // Cache for 1 minute
          });

          clearTimeout(timeoutId);

          if (!res.ok) {
            const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
            (error as any).response = {
              status: res.status,
              headers: Object.fromEntries(res.headers.entries())
            };
            throw error;
          }

          return res;
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            const timeoutError = new Error('Request timeout');
            (timeoutError as any).response = { status: 504 };
            throw timeoutError;
          }
          throw error;
        }
      })
    );

    const data = await response.json();
    
    // Add cache headers
    const responseHeaders = {
      ...corsHeaders,
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': '30',
      'X-RateLimit-Remaining': limiter.reservoir?.toString() || '0',
    };

    return NextResponse.json(data, { headers: responseHeaders });

  } catch (error: any) {
    console.error('[CoinGecko Proxy] Error:', error);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    if (error.response?.status === 429) {
      return NextResponse.json(
        { 
          error: 'CoinGecko rate limit exceeded',
          message: 'The API rate limit has been exceeded. Please try again later.',
          retryAfter: error.response.headers['retry-after'] || '60'
        },
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'Retry-After': error.response.headers['retry-after'] || '60'
          }
        }
      );
    }
    
    if (error.response?.status === 504 || error.message === 'Request timeout') {
      return NextResponse.json(
        { 
          error: 'Request timeout',
          message: 'The request took too long to complete.'
        },
        { status: 504, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while fetching data'
      },
      { status: 500, headers: corsHeaders }
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
      'Access-Control-Max-Age': '86400',
    },
  });
}
