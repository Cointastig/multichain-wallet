import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Currency formatting
export function formatCurrency(
  amount: number, 
  currency = 'USD', 
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals } = options;
  
  if (compact && amount >= 1000000) {
    if (amount >= 1000000000000) {
      return `$${(amount / 1000000000000).toFixed(1)}T`;
    } else if (amount >= 1000000000) {
      return `$${(amount / 1000000000).toFixed(1)}B`;
    } else if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals ?? (amount < 1 ? 4 : 2),
    maximumFractionDigits: decimals ?? (amount < 1 ? 6 : 2),
  }).format(amount);
}

// Token amount formatting
export function formatTokenAmount(
  amount: number, 
  decimals = 18, 
  maxDecimals = 6
): string {
  if (amount === 0) return '0';
  
  // For very small amounts, show more decimals
  if (amount < 0.000001) {
    return amount.toExponential(2);
  }
  
  // For small amounts, show more precision
  if (amount < 1) {
    const formatted = amount.toFixed(maxDecimals);
    return parseFloat(formatted).toString();
  }
  
  // For larger amounts, use standard formatting
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(6, maxDecimals),
  }).format(amount);
}

// Percentage formatting
export function formatPercentage(
  percentage: number, 
  options: { signed?: boolean; decimals?: number } = {}
): string {
  const { signed = true, decimals = 2 } = options;
  const formatted = percentage.toFixed(decimals);
  
  if (signed && percentage > 0) {
    return `+${formatted}%`;
  }
  
  return `${formatted}%`;
}

// Address formatting
export function formatAddress(
  address: string, 
  options: { start?: number; end?: number } = {}
): string {
  const { start = 6, end = 4 } = options;
  
  if (address.length <= start + end) {
    return address;
  }
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

// Time formatting
export function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  
  if (diff < minute) {
    return 'Just now';
  } else if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `${minutes}m ago`;
  } else if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `${hours}h ago`;
  } else if (diff < week) {
    const days = Math.floor(diff / day);
    return `${days}d ago`;
  } else if (diff < month) {
    const weeks = Math.floor(diff / week);
    return `${weeks}w ago`;
  } else if (diff < year) {
    const months = Math.floor(diff / month);
    return `${months}mo ago`;
  } else {
    const years = Math.floor(diff / year);
    return `${years}y ago`;
  }
}

// Number formatting
export function formatNumber(
  num: number, 
  options: { compact?: boolean; decimals?: number } = {}
): string {
  const { compact = false, decimals = 2 } = options;
  
  if (compact) {
    if (num >= 1000000000000) {
      return `${(num / 1000000000000).toFixed(decimals)}T`;
    } else if (num >= 1000000000) {
      return `${(num / 1000000000).toFixed(decimals)}B`;
    } else if (num >= 1000000) {
      return `${(num / 1000000).toFixed(decimals)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(decimals)}K`;
    }
  }
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(num);
}

// Gas price formatting (for Ethereum-based chains)
export function formatGasPrice(gwei: number): string {
  if (gwei < 1) {
    return `${(gwei * 1000).toFixed(0)} mGwei`;
  }
  return `${gwei.toFixed(1)} Gwei`;
}

// Transaction status formatting
export function getTransactionStatusColor(status: string): string {
  switch (status) {
    case 'confirmed':
    case 'success':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-yellow-600 bg-yellow-100';
    case 'failed':
    case 'error':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Validation helpers
export function isValidEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function isValidBitcoinAddress(address: string): boolean {
  // Basic Bitcoin address validation (P2PKH, P2SH, Bech32)
  return /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address) || // Legacy
         /^bc1[a-z0-9]{39,59}$/.test(address); // Bech32
}

export function isValidSolanaAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function validateAddress(address: string, chainType: string): boolean {
  switch (chainType) {
    case 'ethereum':
    case 'bsc':
    case 'polygon':
    case 'arbitrum':
    case 'optimism':
    case 'avalanche':
    case 'fantom':
      return isValidEthereumAddress(address);
    case 'bitcoin':
      return isValidBitcoinAddress(address);
    case 'solana':
      return isValidSolanaAddress(address);
    default:
      return false;
  }
}

// Price change helpers
export function getPriceChangeColor(change: number): string {
  if (change > 0) return 'text-green-600';
  if (change < 0) return 'text-red-600';
  return 'text-gray-600';
}

export function getPriceChangeIcon(change: number): string {
  if (change > 0) return '↗';
  if (change < 0) return '↘';
  return '→';
}

// Portfolio helpers
export function calculatePortfolioValue(tokens: any[]): number {
  return tokens.reduce((total, token) => {
    const balance = parseFloat(token.balance || '0');
    const price = token.price || 0;
    return total + (balance * price);
  }, 0);
}

export function calculatePortfolioChange(
  tokens: any[], 
  period = '24h'
): { change: number; changePercent: number } {
  let totalValue = 0;
  let totalPreviousValue = 0;
  
  tokens.forEach(token => {
    const balance = parseFloat(token.balance || '0');
    const currentPrice = token.price || 0;
    const priceChange = token.priceChange24h || 0;
    const previousPrice = currentPrice - (currentPrice * priceChange / 100);
    
    totalValue += balance * currentPrice;
    totalPreviousValue += balance * previousPrice;
  });
  
  const change = totalValue - totalPreviousValue;
  const changePercent = totalPreviousValue > 0 ? (change / totalPreviousValue) * 100 : 0;
  
  return { change, changePercent };
}

// Error handling
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Local storage helpers
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}

// URL helpers
export function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    56: 'https://bscscan.com',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    43114: 'https://snowtrace.io',
    250: 'https://ftmscan.com',
  };
  
  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/tx/${txHash}`;
}

export function getAddressExplorerUrl(chainId: number, address: string): string {
  const explorers: Record<number, string> = {
    1: 'https://etherscan.io',
    56: 'https://bscscan.com',
    137: 'https://polygonscan.com',
    42161: 'https://arbiscan.io',
    10: 'https://optimistic.etherscan.io',
    43114: 'https://snowtrace.io',
    250: 'https://ftmscan.com',
  };
  
  const baseUrl = explorers[chainId] || 'https://etherscan.io';
  return `${baseUrl}/address/${address}`;
}

// Fee calculation helpers
export function calculateTransactionFee(
  gasLimit: string, 
  gasPrice: string, 
  decimals = 18
): string {
  const fee = (parseFloat(gasLimit) * parseFloat(gasPrice)) / Math.pow(10, 9 + decimals);
  return fee.toFixed(6);
}

export function estimateTransactionTime(gasPrice: number): string {
  if (gasPrice >= 50) return '< 1 min';
  if (gasPrice >= 30) return '< 2 min';
  if (gasPrice >= 20) return '< 5 min';
  if (gasPrice >= 10) return '< 10 min';
  return '> 10 min';
}

// Color utilities
export function generateColorFromString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

export function getTokenColorBySymbol(symbol: string): string {
  const colors: Record<string, string> = {
    BTC: '#F7931A',
    ETH: '#627EEA',
    USDT: '#26A17B',
    USDC: '#2775CA',
    BNB: '#F3BA2F',
    SOL: '#14F195',
    ADA: '#0033AD',
    DOT: '#E6007A',
    AVAX: '#E84142',
    MATIC: '#8247E5',
  };
  
  return colors[symbol.toUpperCase()] || generateColorFromString(symbol);
}
