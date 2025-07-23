import { 
  Connection, 
  PublicKey, 
  Transaction, 
  SystemProgram, 
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  Keypair,
  TransactionInstruction,
  ParsedAccountData
} from '@solana/web3.js';
import { 
  Token,
  TOKEN_PROGRAM_ID,
  AccountLayout
} from '@solana/spl-token';
import { mnemonicToSeedSync } from 'bip39';
import HDKey from 'hdkey';
import * as ed25519 from 'ed25519-hd-key';
import * as nacl from 'tweetnacl';

export class SolanaService {
  private static connection = new Connection(
    process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.mainnet-beta.solana.com',
    'confirmed'
  );

  static async createWalletFromMnemonic(mnemonic: string): Promise<{ publicKey: string; privateKey: string }> {
    const seed = mnemonicToSeedSync(mnemonic);
    const derivationPath = "m/44'/501'/0'/0'";
    const derivedSeed = ed25519.derivePath(derivationPath, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    
    return {
      publicKey: keypair.publicKey.toString(),
      privateKey: Buffer.from(keypair.secretKey).toString('hex'),
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
      
      const accountInfo = AccountLayout.decode(accounts.value[0].account.data);
      const amount = accountInfo.amount.toString();
      
      // Get decimals
      const mintInfo = await token.getMintInfo();
      const balance = parseInt(amount) / Math.pow(10, mintInfo.decimals);
      
      return balance.toString();
    } catch (error) {
      console.error('Error getting Solana token balance:', error);
      return '0';
    }
  }

  static async getTokenInfo(tokenMint: string): Promise<{
    name: string;
    symbol: string;
    decimals: number;
  } | null> {
    try {
      const tokenMintKey = new PublicKey(tokenMint);
      const token = new Token(
        this.connection,
        tokenMintKey,
        TOKEN_PROGRAM_ID,
        {} as any
      );
      
      const mintInfo = await token.getMintInfo();
      
      // Get token metadata (would need Metaplex SDK for full metadata)
      // For now, return basic info
      return {
        name: 'Unknown Token',
        symbol: 'UNK',
        decimals: mintInfo.decimals,
      };
    } catch (error) {
      console.error('Error getting Solana token info:', error);
      return null;
    }
  }

  static async sendTransaction(
    privateKey: string,
    to: string,
    amount: string,
    tokenMint?: string
  ): Promise<string> {
    try {
      const fromKeypair = Keypair.fromSecretKey(
        Buffer.from(privateKey, 'hex')
      );
      const toPubkey = new PublicKey(to);
      
      const transaction = new Transaction();
      
      if (tokenMint) {
        // SPL Token transfer - simplified implementation
        throw new Error('SPL token transfers require additional implementation');
      } else {
        // SOL transfer
        const lamports = parseFloat(amount) * LAMPORTS_PER_SOL;
        
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: fromKeypair.publicKey,
            toPubkey: toPubkey,
            lamports,
          })
        );
      }
      
      const { blockhash } = await this.connection.getRecentBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromKeypair.publicKey;
      
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [fromKeypair]
      );
      
      return signature;
    } catch (error) {
      console.error('Error sending Solana transaction:', error);
      throw error;
    }
  }

  static async estimateGas(to: string, amount: string, tokenMint?: string): Promise<string> {
    try {
      // Solana has fixed fees, but we can estimate based on transaction size
      const recentBlockhash = await this.connection.getRecentBlockhash();
      const fee = recentBlockhash.feeCalculator.lamportsPerSignature;
      
      // Convert to SOL
      return (fee / LAMPORTS_PER_SOL).toString();
    } catch (error) {
      console.error('Error estimating Solana gas:', error);
      return '0.000005'; // Default 5000 lamports
    }
  }

  static async signMessage(privateKey: string, message: string): Promise<string> {
    try {
      const keypair = Keypair.fromSecretKey(
        Buffer.from(privateKey, 'hex')
      );
      
      const messageBytes = new TextEncoder().encode(message);
      const signature = nacl.sign.detached(messageBytes, keypair.secretKey);
      
      return Buffer.from(signature).toString('hex');
    } catch (error) {
      console.error('Error signing Solana message:', error);
      throw error;
    }
  }

  static async getTransactionHistory(address: string, limit = 20): Promise<any[]> {
    try {
      const publicKey = new PublicKey(address);
      const signatures = await this.connection.getSignaturesForAddress(
        publicKey,
        { limit }
      );
      
      const transactions = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await this.connection.getTransaction(sig.signature, {
            maxSupportedTransactionVersion: 0
          });
          return {
            signature: sig.signature,
            slot: sig.slot,
            timestamp: sig.blockTime,
            transaction: tx,
          };
        })
      );
      
      return transactions;
    } catch (error) {
      console.error('Error getting Solana transaction history:', error);
      return [];
    }
  }

  static async getTokenAccounts(address: string): Promise<any[]> {
    try {
      const publicKey = new PublicKey(address);
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        publicKey,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      return tokenAccounts.value.map(accountInfo => {
        const parsedInfo = (accountInfo.account.data as ParsedAccountData).parsed.info;
        return {
          mint: parsedInfo.mint,
          amount: parsedInfo.tokenAmount.amount,
          decimals: parsedInfo.tokenAmount.decimals,
          uiAmount: parsedInfo.tokenAmount.uiAmount,
        };
      });
    } catch (error) {
      console.error('Error getting Solana token accounts:', error);
      return [];
    }
  }

  static async airdropSol(address: string, amount: number): Promise<string> {
    try {
      // Only works on devnet/testnet
      if (!this.connection.rpcEndpoint.includes('devnet') && 
          !this.connection.rpcEndpoint.includes('testnet')) {
        throw new Error('Airdrop only available on devnet/testnet');
      }
      
      const publicKey = new PublicKey(address);
      const signature = await this.connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Error airdropping SOL:', error);
      throw error;
    }
  }
}

// Re-export for backward compatibility
export default SolanaService;