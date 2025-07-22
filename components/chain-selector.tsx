'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { SUPPORTED_CHAINS } from '@/types/wallet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Chain Selector Component
export function ChainSelector() {
  const { selectedChain, switchChain } = useWalletStore();
  const [open, setOpen] = useState(false);

  const chains = Object.values(SUPPORTED_CHAINS);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
            {selectedChain.symbol.slice(0, 2)}
          </div>
          <span className="hidden sm:inline">{selectedChain.name}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {chains.map((chain) => (
          <DropdownMenuItem
            key={chain.id}
            onClick={() => switchChain(chain.chainId)}
            className={cn(
              "flex items-center gap-3 p-3 cursor-pointer",
              selectedChain.id === chain.id && "bg-muted"
            )}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold">
              {chain.symbol.slice(0, 2)}
            </div>
            <div className="flex-1">
              <p className="font-medium">{chain.name}</p>
              <p className="text-xs text-muted-foreground">{chain.symbol}</p>
            </div>
            {chain.testnet && (
              <Badge variant="secondary" className="text-xs">
                Testnet
              </Badge>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
