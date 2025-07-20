import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { ethers } from 'ethers';
import { generateMnemonic, mnemonicToSeedSync } from 'bip39';
import HDKey from 'hdkey';
import { WalletState, WalletActions, Wallet, Chain, Token, SUPPORTED_CHAINS } from '@/types/wallet';
import { encrypt, decrypt } from '@/lib/crypto';
import { Web3Service } from '@/lib/web3';
import { SolanaService } from '@/lib/solana';
import { BitcoinService } from '@/lib/bitcoin';

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
        const phrase = mnemonic || generateMnemonic();
        const seed = mnemonicToSeedSync(phrase);
        const hdkey = HDKey.fromMasterSeed(seed);

        // Generate addresses for all supported chains
        const wallets: Record<string, string> = {};
        const privateKeys: Record<string, string> = {};

        // Ethereum-based chains (using same derivation path)
        const ethDerivationPath = "m/44'/60'/0'/0/0";
        const ethChild = hdkey.derive(ethDerivationPath);
        const ethPrivateKey = ethChild.privateKey.toString('hex');
        const ethWallet = new ethers.Wallet(ethPrivateKey);
        
        const ethChains = ['ethereum', 'bsc', 'polygon', 'arbitrum', 'optimism', 'avalanche', 'fantom'];
        ethChains.forEach(chainId => {
          wallets[chainId] = ethWallet.address;
          privateKeys[chainId] = ethPrivateKey;
        });

        // Solana
        try {
          const solanaWallet = await SolanaService.createWalletFromMnemonic(phrase);
          wallets.solana = solanaWallet.publicKey;
          privateKeys.solana = solanaWallet.privateKey;
        } catch (error) {
          console.warn('Failed to create Solana wallet:', error);
        }

        // Bitcoin
        try {
          const btcWallet = BitcoinService.createWalletFromMnemonic(phrase);
          wallets.bitcoin = btcWallet.address;
          privateKeys.bitcoin = btcWallet.privateKey;
        } catch (error) {
          console.warn('Failed to create Bitcoin wallet:', error);
        }

        const wallet: Wallet = {
          id: Date.now().toString(),
          name,
          address: ethWallet.address, // Primary address (Ethereum)
          privateKey: await encrypt(JSON.stringify(privateKeys)),
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

        // Initialize tokens and balances
        await get().updateTokenBalance('', get().selectedChain.chainId);
        
        return wallet;
      },

      importWallet: async (privateKeyOrMnemonic: string, name = 'Imported Wallet') => {
        let mnemonic = '';
        let privateKey = '';
        
        // Check if input is mnemonic or private key
        if (privateKeyOrMnemonic.split(' ').length >= 12) {
          mnemonic = privateKeyOrMnemonic.trim();
          const seed = mnemonicToSeedSync(mnemonic);
          const hdkey = HDKey.fromMasterSeed(seed);
          const ethChild = hdkey.derive("m/44'/60'/0'/0/0");
          privateKey = ethChild.privateKey.toString('hex');
        } else {
          privateKey = privateKeyOrMnemonic.startsWith('0x') ? 
            privateKeyOrMnemonic.slice(2) : privateKeyOrMnemonic;
        }

        const ethWallet = new ethers.Wallet(privateKey);
        
        const wallet: Wallet = {
          id: Date.now().toString(),
          name,
          address: ethWallet.address,
          privateKey: await encrypt(privateKey),
          mnemonic: mnemonic ? await encrypt(mnemonic) : undefined,
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
        // In production, implement proper PIN verification
        const isValid = pin.length === 6; // Simple validation
        
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
          
          // Update balances for new chain
          await get().updateTokenBalance('', chainId);
        }
      },

      addCustomChain: async (chain: Chain) => {
        set(state => {
          const existingChain = Object.values(SUPPORTED_CHAINS).find(c => c.chainId === chain.chainId);
          if (!existingChain) {
            // Add to supported chains (in production, this would be handled differently)
            state.selectedChain = chain;
          }
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
        
        // Update balance for new token
        await get().updateTokenBalance(token.address, token.chainId);
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
          
          if (!tokenAddress) {
            // Native token balance
            if (selectedChain.id === 'solana') {
              balance = await SolanaService.getBalance(activeWallet.address);
            } else if (selectedChain.id === 'bitcoin') {
              balance = await BitcoinService.getBalance(activeWallet.address);
            } else {
              // Ethereum-based chains
              const web3Service = new Web3Service(selectedChain.rpcUrl);
              balance = await web3Service.getBalance(activeWallet.address);
            }
          } else {
            // Token balance
            if (selectedChain.id === 'solana') {
              balance = await SolanaService.getTokenBalance(activeWallet.address, tokenAddress);
            } else {
              const web3Service = new Web3Service(selectedChain.rpcUrl);
              balance = await web3Service.getTokenBalance(activeWallet.address, tokenAddress);
            }
          }

          // Get USD value
          const tokenSymbol = tokenAddress ? 
            get().tokens.find(t => t.address === tokenAddress)?.symbol :
            selectedChain.symbol;
            
          if (tokenSymbol) {
            const price = await get().getTokenPrice(tokenSymbol.toLowerCase());
            balanceUSD = parseFloat(balance) * price;
          }

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
          console.error('Failed to update token balance:', error);
        }
      },

      importTokensByAddress: async (addresses: string[], chainId: number) => {
        const tokens: Token[] = [];
        
        for (const address of addresses) {
          try {
            let tokenInfo;
            
            if (get().selectedChain.id === 'solana') {
              tokenInfo = await SolanaService.getTokenInfo(address);
            } else {
              const web3Service = new Web3Service(get().selectedChain.rpcUrl);
              tokenInfo = await web3Service.getTokenInfo(address);
            }
            
            if (tokenInfo) {
              const token: Token = {
                address,
                symbol: tokenInfo.symbol,
                name: tokenInfo.name,
                decimals: tokenInfo.decimals,
                chainId,
                balance: '0',
                balanceUSD: 0,
              };
              
              tokens.push(token);
              await get().addToken(token);
            }
          } catch (error) {
            console.error(`Failed to import token ${address}:`, error);
          }
        }
        
        return tokens;
      },

      // Transaction management
      sendTransaction: async (to: string, amount: string, token?: Token) => {
        const { activeWallet, selectedChain } = get();
        if (!activeWallet || !activeWallet.privateKey) {
          throw new Error('No active wallet');
        }

        const privateKey = await decrypt(activeWallet.privateKey);
        let txHash = '';

        try {
          if (selectedChain.id === 'solana') {
            txHash = await SolanaService.sendTransaction(
              privateKey,
              to,
              amount,
              token?.address
            );
          } else if (selectedChain.id === 'bitcoin') {
            txHash = await BitcoinService.sendTransaction(
              privateKey,
              to,
              amount
            );
          } else {
            // Ethereum-based chains
            const web3Service = new Web3Service(selectedChain.rpcUrl);
            txHash = await web3Service.sendTransaction(
              privateKey,
              to,
              amount,
              token?.address
            );
          }

          // Add transaction to history
          set(state => {
            state.transactions.unshift({
              hash: txHash,
              from: activeWallet.address,
              to,
              value: amount,
              timestamp: Date.now(),
              status: 'pending',
              chainId: selectedChain.chainId,
              type: 'send',
              tokenSymbol: token?.symbol,
              tokenAddress: token?.address,
            });
          });

          return txHash;
        } catch (error) {
          console.error('Transaction failed:', error);
          throw error;
        }
      },

      signMessage: async (message: string) => {
        const { activeWallet, selectedChain } = get();
        if (!activeWallet || !activeWallet.privateKey) {
          throw new Error('No active wallet');
        }

        const privateKey = await decrypt(activeWallet.privateKey);
        
        if (selectedChain.id === 'solana') {
          return await SolanaService.signMessage(privateKey, message);
        } else {
          const wallet = new ethers.Wallet(privateKey);
          return await wallet.signMessage(message);
        }
      },

      estimateGas: async (to: string, amount: string, token?: Token) => {
        const { selectedChain } = get();
        
        if (selectedChain.id === 'solana') {
          return await SolanaService.estimateGas(to, amount, token?.address);
        } else if (selectedChain.id === 'bitcoin') {
          return await BitcoinService.estimateGas(to, amount);
        } else {
          const web3Service = new Web3Service(selectedChain.rpcUrl);
          return await web3Service.estimateGas(to, amount, token?.address);
        }
      },

      // DeFi operations
      approveToken: async (tokenAddress: string, spender: string, amount: string) => {
        const { activeWallet, selectedChain } = get();
        if (!activeWallet || !activeWallet.privateKey) {
          throw new Error('No active wallet');
        }

        const privateKey = await decrypt(activeWallet.privateKey);
        const web3Service = new Web3Service(selectedChain.rpcUrl);
        
        return await web3Service.approveToken(privateKey, tokenAddress, spender, amount);
      },

      swapTokens: async (fromToken: Token, toToken: Token, amount: string, slippage: number) => {
        // Implementation would depend on DEX aggregator (1inch, Paraswap, etc.)
        throw new Error('Swap functionality not yet implemented');
      },

      // Market data
      updateMarketData: async () => {
        try {
          const response = await fetch('/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true');
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
          console.error('Failed to update market data:', error);
        }
      },

      getTokenPrice: async (tokenId: string) => {
        try {
          const response = await fetch(`/api/coingecko/simple/price?ids=${tokenId}&vs_currencies=usd`);
          const data = await response.json();
          return data[tokenId]?.usd || 0;
        } catch (error) {
          console.error('Failed to get token price:', error);
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
    }
  )
);
