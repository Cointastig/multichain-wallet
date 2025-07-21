// app/page.tsx
'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWalletStore } from '@/store/walletStore';
import { LoadingScreen } from '@/components/loading-screen';

// Dynamic imports to reduce initial bundle size
const WalletSetup = dynamic(
  () => import('@/components/wallet-setup').then(mod => ({ default: mod.WalletSetup })),
  { 
    loading: () => <LoadingScreen />,
    ssr: false
  }
);

const WalletLocked = dynamic(
  () => import('@/components/wallet-locked').then(mod => ({ default: mod.WalletLocked })),
  { 
    loading: () => <LoadingScreen />,
    ssr: false
  }
);

const WalletDashboard = dynamic(
  () => import('@/components/wallet-dashboard').then(mod => ({ default: mod.WalletDashboard })),
  { 
    loading: () => <LoadingScreen />,
    ssr: false
  }
);

export default function HomePage() {
  const { 
    wallets, 
    activeWallet, 
    isLocked, 
    isConnected,
    updateMarketData 
  } = useWalletStore();

  useEffect(() => {
    let mounted = true;
    
    const initializeApp = async () => {
      try {
        // Update market data on app load
        await updateMarketData();
        
        // Set up interval for periodic updates
        const interval = setInterval(() => {
          if (mounted) {
            updateMarketData();
          }
        }, 60000); // Update every minute

        return () => {
          mounted = false;
          clearInterval(interval);
        };
      } catch (error) {
        console.warn('Failed to initialize market data:', error);
      }
    };

    initializeApp();

    return () => {
      mounted = false;
    };
  }, [updateMarketData]);

  // No wallets created yet
  if (wallets.length === 0) {
    return <WalletSetup />;
  }

  // Wallet is locked
  if (isLocked || !isConnected) {
    return <WalletLocked />;
  }

  // Show loading if no active wallet but wallets exist
  if (!activeWallet) {
    return <LoadingScreen />;
  }

  // Main wallet dashboard
  return <WalletDashboard />;
}
