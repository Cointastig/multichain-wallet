'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WalletMenu() {
  const { wallets, activeWallet, switchWallet } = useWalletStore();
  const [open, setOpen] = useState(false);

  if (!activeWallet) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold">
            {activeWallet.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="font-medium">{activeWallet.name}</p>
            <p className="text-xs text-muted-foreground">
              {activeWallet.address.slice(0, 6)}...{activeWallet.address.slice(-4)}
            </p>
          </div>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {wallets.map((wallet) => (
          <DropdownMenuItem
            key={wallet.id}
            onClick={() => switchWallet(wallet.id)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer",
              activeWallet.id === wallet.id && "bg-muted"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold">
              {wallet.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-medium">{wallet.name}</p>
              <p className="text-xs text-muted-foreground font-mono">
                {wallet.address.slice(0, 8)}...{wallet.address.slice(-6)}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {wallet.type} wallet
              </p>
            </div>
            {activeWallet.id === wallet.id && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
