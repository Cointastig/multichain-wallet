// Core wallet types for multi-chain support
export interface Chain {
  id: string;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  chainId: number;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  iconUrl?: string;
  testnet?: boolean;
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
  balance?: string;
  balanceUSD?: number;
  price?: number;
  priceChange24h?: number;
}

export interface NFT {
  tokenId: string;
  contractAddress: string;
  name: string;
  description?: string;
  image?: string;
  chainId: number;
  standard: 'ERC721' | 'ERC1155' | 'SPL';
  metadata?: Record<string, any>;
}

export interface Wallet {
  id: string;
  name: string;
  address: string;
  privateKey?: string; // Encrypted
  mnemonic?: string; // Encrypted
  type: 'imported' | 'generated' | 'hardware';
  chains: Chain[];
  tokens: Token[];
  nfts?: NFT[];
  createdAt: number;
  lastUsed: number;
}

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice?: string;
  gasLimit?: string;
  gasUsed?: string;
  nonce?: number;
  blockNumber?: number;
  blockHash?: string;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
  chainId: number;
  type: 'send' | 'receive' | 'swap' | 'approve' | 'contract';
  tokenSymbol?: string;
  tokenAddress?: string;
  fee?: string;
  feeUSD?: number;
}

export interface SwapQuote {
  fromToken: Token;
  toToken: Token;
  fromAmount: string;
  toAmount: string;
  slippage: number;
  priceImpact: number;
  route: any[];
  gasEstimate?: string;
  fees: {
    platform: number;
    gas: string;
  };
  provider: string;
  validUntil: number;
}

export interface DeFiPosition {
  id: string;
  protocol: string;
  type: 'lending' | 'borrowing' | 'staking' | 'liquidity' | 'farming';
  chainId: number;
  tokens: Token[];
  apy: number;
  value: number;
  rewards?: Token[];
  unlockDate?: number;
}

export interface WalletState {
  wallets: Wallet[];
  activeWallet: Wallet | null;
  selectedChain: Chain;
  transactions: Transaction[];
  tokens: Token[];
  nfts: NFT[];
  defiPositions: DeFiPosition[];
  isLocked: boolean;
  isConnected: boolean;
  totalBalance: number;
  settings: {
    currency: string;
    language: string;
    notifications: boolean;
    biometric: boolean;
    autoLock: number;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface MarketData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number;
  max_supply: number;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d: {
    price: number[];
  };
}

export interface ChainConfig {
  ethereum: Chain;
  bsc: Chain;
  polygon: Chain;
  arbitrum: Chain;
  optimism: Chain;
  avalanche: Chain;
  fantom: Chain;
  solana: Chain;
  bitcoin: Chain;
}

export const SUPPORTED_CHAINS: ChainConfig = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.public-rpc.com',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    iconUrl: '/chains/ethereum.png',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    symbol: 'BNB',
    chainId: 56,
    rpcUrl: process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed1.binance.org',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    iconUrl: '/chains/bsc.png',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: 137,
    rpcUrl: process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-rpc.com',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18,
    },
    iconUrl: '/chains/polygon.png',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    symbol: 'ETH',
    chainId: 42161,
    rpcUrl: process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    iconUrl: '/chains/arbitrum.png',
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    chainId: 10,
    rpcUrl: process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
    iconUrl: '/chains/optimism.png',
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    chainId: 43114,
    rpcUrl: process.env.NEXT_PUBLIC_AVALANCHE_RPC || 'https://api.avax.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    iconUrl: '/chains/avalanche.png',
  },
  fantom: {
    id: 'fantom',
    name: 'Fantom',
    symbol: 'FTM',
    chainId: 250,
    rpcUrl: process.env.NEXT_PUBLIC_FANTOM_RPC || 'https://rpc.ftm.tools',
    explorerUrl: 'https://ftmscan.com',
    nativeCurrency: {
      name: 'Fantom',
      symbol: 'FTM',
      decimals: 18,
    },
    iconUrl: '/chains/fantom.png',
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    chainId: 101,
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9,
    },
    iconUrl: '/chains/solana.png',
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    chainId: 0,
    rpcUrl: '',
    explorerUrl: 'https://blockstream.info',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 8,
    },
    iconUrl: '/chains/bitcoin.png',
  },
};

// Default tokens for each chain
export const DEFAULT_TOKENS: Record<string, Token[]> = {
  ethereum: [
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 1,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 1,
      logoURI: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png',
    },
  ],
  bsc: [
    {
      address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      chainId: 56,
      logoURI: 'https://assets.coingecko.com/coins/images/6319/thumb/USD_Coin_icon.png',
    },
  ],
};

export interface WalletActions {
  // Wallet management
  createWallet: (name: string, mnemonic?: string) => Promise<Wallet>;
  importWallet: (privateKey: string, name?: string) => Promise<Wallet>;
  deleteWallet: (walletId: string) => Promise<void>;
  switchWallet: (walletId: string) => void;
  lockWallet: () => void;
  unlockWallet: (pin: string) => Promise<boolean>;
  
  // Chain management
  switchChain: (chainId: number) => Promise<void>;
  addCustomChain: (chain: Chain) => Promise<void>;
  
  // Token management
  addToken: (token: Token) => Promise<void>;
  removeToken: (tokenAddress: string, chainId: number) => Promise<void>;
  updateTokenBalance: (tokenAddress: string, chainId: number) => Promise<void>;
  importTokensByAddress: (addresses: string[], chainId: number) => Promise<Token[]>;
  
  // Transaction management
  sendTransaction: (to: string, amount: string, token?: Token) => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  estimateGas: (to: string, amount: string, token?: Token) => Promise<string>;
  
  // DeFi operations
  approveToken: (tokenAddress: string, spender: string, amount: string) => Promise<string>;
  swapTokens: (fromToken: Token, toToken: Token, amount: string, slippage: number) => Promise<string>;
  
  // Market data
  updateMarketData: () => Promise<void>;
  getTokenPrice: (tokenId: string) => Promise<number>;
  
  // Settings
  updateSettings: (settings: Partial<WalletState['settings']>) => void;
}
