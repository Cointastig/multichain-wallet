+190
-0

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
