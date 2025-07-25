import { ethers } from 'ethers';
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { mnemonicToSeedSync } from 'bip39';
import HDKey from 'hdkey';

// ERC-20 Token ABI (minimal)
const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address, uint256) returns (bool)',
  'function approve(address, uint256) returns (bool)',
  'function allowance(address, address) view returns (uint256)',
];

// Ethereum-based chains service
export class Web3Service {
  private provider: ethers.JsonRpcProvider;

  constructor(rpcUrl: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return '0';
    }
  }

  async getTokenBalance(address: string, tokenAddress: string): Promise<string> {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      const balance = await contract.balanceOf(address);
      const decimals = await contract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  async getTokenInfo(tokenAddress: string) {
    try {
      const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
      
      const [name, symbol, decimals] = await Promise.all([
        contract.name(),
        contract.symbol(),
        contract.decimals(),
      ]);

      return { name, symbol, decimals };
    } catch (error) {
      console.error('Error getting token info:', error);
      return null;
    }
  }

  async sendTransaction(
    privateKey: string, 
    to: string, 
    amount: string, 
    tokenAddress?: string
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    
    try {
      let tx;
      
      if (tokenAddress) {
        // ERC-20 token transfer
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
        const decimals = await contract.decimals();
        const value = ethers.parseUnits(amount, decimals);
        tx = await contract.transfer(to, value);
      } else {
        // Native token transfer
        const value = ethers.parseEther(amount);
        tx = await wallet.sendTransaction({
          to,
          value,
        });
      }

      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async estimateGas(to: string, amount: string, tokenAddress?: string): Promise<string> {
    try {
      let gasEstimate;
      
      if (tokenAddress) {
        const contract = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
        const decimals = await contract.decimals();
        const value = ethers.parseUnits(amount, decimals);
        gasEstimate = await contract.transfer.estimateGas(to, value);
      } else {
        const value = ethers.parseEther(amount);
        gasEstimate = await this.provider.estimateGas({
          to,
          value,
        });
      }

      return gasEstimate.toString();
    } catch (error) {
      console.error('Error estimating gas:', error);
      return '21000'; // Default gas limit
    }
  }

  async approveToken(
    privateKey: string,
    tokenAddress: string,
    spender: string,
    amount: string
  ): Promise<string> {
    const wallet = new ethers.Wallet(privateKey, this.provider);
    const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
    
    try {
      const decimals = await contract.decimals();
      const value = ethers.parseUnits(amount, decimals);
      const tx = await contract.approve(spender, value);
      return tx.hash;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  async getTransactionHistory(address: string): Promise<any[]> {
    // This would typically use a service like Etherscan API
    // For now, return empty array
    return [];
  }
}

// Solana service (simplified version using old API)
export class SolanaService {
  private static connection = new Connection('https://api.mainnet-beta.solana.com');

  static async createWalletFromMnemonic(mnemonic: string) {
    const seed = mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    const solanaPath = "m/44'/501'/0'/0'";
    const solanaChild = hdkey.derive(solanaPath);
    
    // Note: This is a simplified implementation
    // In production, use proper Solana key derivation
    const publicKey = solanaChild.publicKey.toString('hex');
    const privateKey = solanaChild.privateKey!.toString('hex');
    
    return {
      publicKey,
      privateKey,
    };
  }

  static async getBalance(address: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      return (balance / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      console.error('Error getting Solana balance:', error);
      return '0';
    }
  }

  static async getTokenBalance(address: string, tokenMint: string): Promise<string> {
    try {
      const publicKey = new PublicKey(address);
      const tokenMintKey = new PublicKey(tokenMint);
      
      const token = new Token(
        this.connection,
        tokenMintKey,
        TOKEN_PROGRAM_ID,
        {} as any // Dummy payer for read-only operations
      );
      
      const accounts = await this.connection.getTokenAccountsByOwner(publicKey, {
        mint: tokenMintKey
      });
      
      if (accounts.value.length === 0) {
        return '0';
      }
      
      const accountInfo = accounts.value[0].account.data;
      // Simplified balance extraction
      return '0';
    } catch (error) {
      console.error('Error getting Solana token balance:', error);
      return '0';
    }
  }

  static async getTokenInfo(tokenMint: string) {
    // This would typically fetch from a Solana token registry
    // For now, return basic info
    return {
      name: 'Unknown Token',
      symbol: 'UNK',
      decimals: 9,
    };
  }

  static async sendTransaction(
    privateKey: string,
    to: string,
    amount: string,
    tokenMint?: string
  ): Promise<string> {
    try {
      // Note: This is a simplified implementation
      // In production, properly handle Solana transactions
      const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
      
      // Create and send transaction
      // Implementation would involve creating proper Solana transaction
      
      return 'solana_tx_hash_placeholder';
    } catch (error) {
      console.error('Error sending Solana transaction:', error);
      throw error;
    }
  }

  static async estimateGas(to: string, amount: string, tokenMint?: string): Promise<string> {
    // Solana has fixed fees
    return '5000'; // 0.000005 SOL
  }

  static async signMessage(privateKey: string, message: string): Promise<string> {
    // Implement Solana message signing
    return 'signed_message_placeholder';
  }
}

// DEX and DeFi services
export class DeFiService {
  static async getSwapQuote(
    fromTokenAddress: string,
    toTokenAddress: string,
    amount: string,
    chainId: number
  ) {
    // This would integrate with DEX aggregators like 1inch, Paraswap, etc.
    // For now, return placeholder
    return {
      fromAmount: amount,
      toAmount: '0',
      route: [],
      gasEstimate: '0',
      priceImpact: 0,
    };
  }

  static async executeSwap(
    privateKey: string,
    quote: any,
    chainId: number
  ): Promise<string> {
    // Implementation would depend on the DEX aggregator
    throw new Error('Swap functionality not yet implemented');
  }

  static async getStakingPositions(address: string, chainId: number) {
    // Fetch staking positions from various protocols
    return [];
  }

  static async getLendingPositions(address: string, chainId: number) {
    // Fetch lending positions from protocols like Aave, Compound
    return [];
  }
}

// NFT service
export class NFTService {
  static async getNFTs(address: string, chainId: number) {
    // This would use services like Moralis, Alchemy, or OpenSea API
    return [];
  }

  static async getNFTMetadata(contractAddress: string, tokenId: string) {
    // Fetch NFT metadata
    return null;
  }

  static async transferNFT(
    privateKey: string,
    contractAddress: string,
    tokenId: string,
    to: string,
    chainId: number
  ): Promise<string> {
    // Implement NFT transfer
    throw new Error('NFT transfer not yet implemented');
  }
}

// Price and market data service
export class MarketService {
  static async getTokenPrices(tokenIds: string[]): Promise<Record<string, number>> {
    try {
      const response = await fetch(
        `/api/coingecko/simple/price?ids=${tokenIds.join(',')}&vs_currencies=usd`
      );
      const data = await response.json();
      
      const prices: Record<string, number> = {};
      for (const [tokenId, priceData] of Object.entries(data)) {
        prices[tokenId] = (priceData as any).usd;
      }
      
      return prices;
    } catch (error) {
      console.error('Error fetching token prices:', error);
      return {};
    }
  }

  static async getMarketData(page = 1, perPage = 100) {
    try {
      const response = await fetch(
        `/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=true`
      );
      return await response.json();
    } catch (error) {
      console.error('Error fetching market data:', error);
      return [];
    }
  }

  static async searchTokens(query: string) {
    try {
      const response = await fetch(`/api/coingecko/search?query=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Error searching tokens:', error);
      return { coins: [] };
    }
  }
}