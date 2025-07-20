'use client';

import { useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { WalletSetup } from '@/components/wallet-setup';
import { WalletLocked } from '@/components/wallet-locked';
import { WalletDashboard } from '@/components/wallet-dashboard';
import { LoadingScreen } from '@/components/loading-screen';

export default function HomePage() {
  const { 
    wallets, 
    activeWallet, 
    isLocked, 
    isConnected,
    updateMarketData 
  } = useWalletStore();

  useEffect(() => {
    // Update market data on app load
    updateMarketData();
    
    // Set up interval for periodic updates
    const interval = setInterval(() => {
      updateMarketData();
    }, 60000); // Update every minute

    return () => clearInterval(interval);
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
