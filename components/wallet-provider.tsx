// components/wallet-provider.tsx
'use client';

import { ReactNode } from 'react';
import { useWalletStore } from '@/store/walletStore';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Initialize any wallet-specific providers here
  return <>{children}</>;
}
