// store/walletStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { ethers } from 'ethers';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import { WalletState, WalletActions, Wallet, Chain, Token, SUPPORTED_CHAINS } from '@/types/wallet';
import { encrypt, decrypt } from '@/lib/crypto';

// Safe dynamic imports with fallbacks
const importWeb3Service = async () => {
  try {
    const { Web3Service } = await import('@/lib/web3');
    return Web3Service;
  } catch {
    return null;
  }
};

const importSolanaService = async () => {
  try {
    const { SolanaService } = await import('@/lib/solana');
    return SolanaService;
  } catch {
    return null;
  }
};

const importBitcoinService = async () => {
  try {
    const { BitcoinService } = await import('@/lib/bitcoin');
    return BitcoinService;
  } catch {
    return null;
  }
};

type WalletStore = WalletState & WalletActions;

export const useWalletStore = create<WalletStore>()(
  persist(
    immer((set, get) => ({
      // Initial state
      wallets: [],
      activeWallet: null,
      selectedChain: SUPPORTED_CHAINS.ethereum,
      transactions: [],
      tokens: [],
      nfts: [],
      defiPositions: [],
      isLocked: true,
      isConnected: false,
      totalBalance: 0,
      settings: {
        currency: 'USD',
        language: 'en',
        notifications: true,
        biometric: false,
        autoLock: 300000, // 5 minutes
        theme: 'light' as const,
      },

      // Wallet management actions
      createWallet: async (name: string, mnemonic?: string) => {
        try {
          const phrase = mnemonic || generateMnemonic();
          const seed = mnemonicToSeedSync(phrase);
          
          // Create Ethereum wallet (always works)
          const ethWallet = ethers.Wallet.fromPhrase(phrase);

          const wallet: Wallet = {
            id: Date.now().toString(),
            name,
            address: ethWallet.address,
            privateKey: await encrypt(ethWallet.privateKey),
            mnemonic: await encrypt(phrase),
            type: 'generated',
            chains: Object.values(SUPPORTED_CHAINS),
            tokens: [],
            createdAt: Date.now(),
            lastUsed: Date.now(),
          };

          set(state => {
            state.wallets.push(wallet);
            state.activeWallet = wallet;
            state.isLocked = false;
            state.isConnected = true;
          });

          // Initialize tokens and balances safely
          try {
            await get().updateTokenBalance('', get().selectedChain.chainId);
          } catch (error) {
            console.warn('Failed to update initial balance:', error);
          }
          
          return wallet;
        } catch (error) {
          console.error('Failed to create wallet:', error);
          throw new Error('Failed to create wallet');
        }
      },

      importWallet: async (privateKeyOrMnemonic: string, name = 'Imported Wallet') => {
        try {
          let ethWallet: ethers.Wallet;
          
          // Check if input is mnemonic or private key
          if (privateKeyOrMnemonic.split(' ').length >= 12) {
            ethWallet = ethers.Wallet.fromPhrase(privateKeyOrMnemonic.trim());
          } else {
            const privateKey = privateKeyOrMnemonic.startsWith('0x') ? 
              privateKeyOrMnemonic : '0x' + privateKeyOrMnemonic;
            ethWallet = new ethers.Wallet(privateKey);
          }
          
          const wallet: Wallet = {
            id: Date.now().toString(),
            name,
            address: ethWallet.address,
            privateKey: await encrypt(ethWallet.privateKey),
            mnemonic: privateKeyOrMnemonic.split(' ').length >= 12 ? 
              await encrypt(privateKeyOrMnemonic.trim()) : undefined,
            type: 'imported',
            chains: Object.values(SUPPORTED_CHAINS),
            tokens: [],
            createdAt: Date.now(),
            lastUsed: Date.now(),
          };

          set(state => {
            state.wallets.push(wallet);
            state.activeWallet = wallet;
            state.isLocked = false;
            state.isConnected = true;
          });

          return wallet;
        } catch (error) {
          console.error('Failed to import wallet:', error);
          throw new Error('Failed to import wallet');
        }
      },

      deleteWallet: async (walletId: string) => {
        set(state => {
          const index = state.wallets.findIndex(w => w.id === walletId);
          if (index !== -1) {
            state.wallets.splice(index, 1);
            if (state.activeWallet?.id === walletId) {
              state.activeWallet = state.wallets[0] || null;
              if (!state.activeWallet) {
                state.isConnected = false;
                state.isLocked = true;
              }
            }
          }
        });
      },

      switchWallet: (walletId: string) => {
        set(state => {
          const wallet = state.wallets.find(w => w.id === walletId);
          if (wallet) {
            state.activeWallet = wallet;
            wallet.lastUsed = Date.now();
          }
        });
      },

      lockWallet: () => {
        set(state => {
          state.isLocked = true;
          state.isConnected = false;
        });
      },

      unlockWallet: async (pin: string) => {
        // Simple PIN validation - in production implement proper hashing
        const isValid = pin.length === 6 && /^\d{6}$/.test(pin);
        
        if (isValid) {
          set(state => {
            state.isLocked = false;
            state.isConnected = true;
          });
        }
        
        return isValid;
      },

      // Chain management
      switchChain: async (chainId: number) => {
        const chain = Object.values(SUPPORTED_CHAINS).find(c => c.chainId === chainId);
        if (chain) {
          set(state => {
            state.selectedChain = chain;
          });
          
          // Update balances for new chain safely
          try {
            await get().updateTokenBalance('', chainId);
          } catch (error) {
            console.warn('Failed to update balance for chain:', chainId, error);
          }
        }
      },

      addCustomChain: async (chain: Chain) => {
        set(state => {
          state.selectedChain = chain;
        });
      },

      // Token management
      addToken: async (token: Token) => {
        set(state => {
          const existingToken = state.tokens.find(
            t => t.address.toLowerCase() === token.address.toLowerCase() && 
                 t.chainId === token.chainId
          );
          
          if (!existingToken) {
            state.tokens.push(token);
          }
        });
        
        // Update balance for new token safely
        try {
          await get().updateTokenBalance(token.address, token.chainId);
        } catch (error) {
          console.warn('Failed to update token balance:', error);
        }
      },

      removeToken: async (tokenAddress: string, chainId: number) => {
        set(state => {
          const index = state.tokens.findIndex(
            t => t.address.toLowerCase() === tokenAddress.toLowerCase() && 
                 t.chainId === chainId
          );
          
          if (index !== -1) {
            state.tokens.splice(index, 1);
          }
        });
      },

      updateTokenBalance: async (tokenAddress: string, chainId: number) => {
        const { activeWallet, selectedChain } = get();
        if (!activeWallet) return;

        try {
          let balance = '0';
          let balanceUSD = 0;
          
          // Use dynamic imports with fallbacks
          if (selectedChain.id === 'ethereum' || selectedChain.id === 'bsc' || selectedChain.id === 'polygon') {
            const Web3Service = await importWeb3Service();
            if (Web3Service) {
              const web3Service = new Web3Service(selectedChain.rpcUrl || 'https://eth.public-rpc.com');
              if (!tokenAddress) {
                balance = await web3Service.getBalance(activeWallet.address);
              } else {
                balance = await web3Service.getTokenBalance(activeWallet.address, tokenAddress);
              }
            }
          } else if (selectedChain.id === 'solana') {
            const SolanaService = await importSolanaService();
            if (SolanaService) {
              if (!tokenAddress) {
                balance = await SolanaService.getBalance(activeWallet.address);
              } else {
                balance = await SolanaService.getTokenBalance(activeWallet.address, tokenAddress);
              }
            }
          } else if (selectedChain.id === 'bitcoin') {
            const BitcoinService = await importBitcoinService();
            if (BitcoinService) {
              balance = await BitcoinService.getBalance(activeWallet.address);
            }
          }

          // Update state
          set(state => {
            if (!tokenAddress) {
              // Update native balance (implement as needed)
            } else {
              const token = state.tokens.find(
                t => t.address.toLowerCase() === tokenAddress.toLowerCase() && 
                     t.chainId === chainId
              );
              if (token) {
                token.balance = balance;
                token.balanceUSD = balanceUSD;
              }
            }
          });

        } catch (error) {
          console.warn('Failed to update token balance:', error);
        }
      },

      importTokensByAddress: async (addresses: string[], chainId: number) => {
        const tokens: Token[] = [];
        
        for (const address of addresses) {
          try {
            // Create basic token info
            const token: Token = {
              address,
              symbol: 'TOKEN',
              name: 'Unknown Token',
              decimals: 18,
              chainId,
              balance: '0',
              balanceUSD: 0,
            };
            
            tokens.push(token);
            await get().addToken(token);
          } catch (error) {
            console.warn(`Failed to import token ${address}:`, error);
          }
        }
        
        return tokens;
      },

      // Transaction management
      sendTransaction: async (to: string, amount: string, token?: Token) => {
        throw new Error('Transaction functionality requires secure environment');
      },

      signMessage: async (message: string) => {
        throw new Error('Message signing requires secure environment');
      },

      estimateGas: async (to: string, amount: string, token?: Token) => {
        return '21000'; // Default estimate
      },

      // DeFi operations
      approveToken: async (tokenAddress: string, spender: string, amount: string) => {
        throw new Error('Token approval requires secure environment');
      },

      swapTokens: async (fromToken: Token, toToken: Token, amount: string, slippage: number) => {
        throw new Error('Swap functionality not yet implemented');
      },

      // Market data
      updateMarketData: async () => {
        try {
          const response = await fetch('/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true');
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          
          const marketData = await response.json();
          
          set(state => {
            state.tokens.forEach(token => {
              const market = marketData.find((m: any) => 
                m.symbol.toLowerCase() === token.symbol.toLowerCase()
              );
              if (market) {
                token.price = market.current_price;
                token.priceChange24h = market.price_change_percentage_24h;
                if (token.balance) {
                  token.balanceUSD = parseFloat(token.balance) * market.current_price;
                }
              }
            });
          });
        } catch (error) {
          console.warn('Failed to update market data:', error);
        }
      },

      getTokenPrice: async (tokenId: string) => {
        try {
          const response = await fetch(`/api/coingecko/simple/price?ids=${tokenId}&vs_currencies=usd`);
          if (!response.ok) return 0;
          
          const data = await response.json();
          return data[tokenId]?.usd || 0;
        } catch (error) {
          console.warn('Failed to get token price:', error);
          return 0;
        }
      },

      // Settings
      updateSettings: (settings) => {
        set(state => {
          Object.assign(state.settings, settings);
        });
      },
    })),
    {
      name: 'wallet-store',
      partialize: (state) => ({
        wallets: state.wallets,
        settings: state.settings,
      }),
      version: 1,
    }
  )
);
