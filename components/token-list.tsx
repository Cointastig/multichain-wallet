'use client';

import { useState } from 'react';
import { Token } from '@/types/wallet';
import { useWalletStore } from '@/store/walletStore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown,
  Star,
  MoreVertical,
  Send,
  ArrowUpDown
} from 'lucide-react';
import { formatCurrency, formatTokenAmount, cn } from '@/lib/utils';
import { SendModal } from '@/components/send-modal';
import { SwapModal } from '@/components/swap-modal';

interface TokenListProps {
  tokens: Token[];
  showActions?: boolean;
}

export function TokenList({ tokens, showActions = true }: TokenListProps) {
  const { settings, removeToken, selectedChain } = useWalletStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         token.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const hasBalance = parseFloat(token.balance || '0') > 0;
    
    return matchesSearch && (showHidden || hasBalance);
  });

  const handleTokenAction = (token: Token, action: 'send' | 'swap' | 'remove') => {
    setSelectedToken(token);
    
    switch (action) {
      case 'send':
        setShowSendModal(true);
        break;
      case 'swap':
        setShowSwapModal(true);
        break;
      case 'remove':
        if (confirm(`Remove ${token.symbol} from your token list?`)) {
          removeToken(token.address, token.chainId);
        }
        break;
    }
  };

  if (tokens.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Tokens Found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Add tokens to start managing your portfolio on {selectedChain.name}
          </p>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Token
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
        >
          {showHidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showHidden ? 'Hide Zero' : 'Show All'}
        </Button>
      </div>

      {/* Token List */}
      <div className="space-y-2">
        {filteredTokens.map((token) => (
          <TokenItem
            key={`${token.address}-${token.chainId}`}
            token={token}
            showActions={showActions}
            onAction={handleTokenAction}
          />
        ))}
      </div>

      {filteredTokens.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No tokens found for "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      {selectedToken && (
        <>
          <SendModal
            open={showSendModal}
            onOpenChange={setShowSendModal}
            defaultToken={selectedToken}
          />
          <SwapModal
            open={showSwapModal}
            onOpenChange={setShowSwapModal}
            defaultFromToken={selectedToken}
          />
        </>
      )}
    </div>
  );
}

interface TokenItemProps {
  token: Token;
  showActions: boolean;
  onAction: (token: Token, action: 'send' | 'swap' | 'remove') => void;
}

function TokenItem({ token, showActions, onAction }: TokenItemProps) {
  const { settings } = useWalletStore();
  const [showExtendedActions, setShowExtendedActions] = useState(false);
  
  const balance = parseFloat(token.balance || '0');
  const balanceUSD = token.balanceUSD || 0;
  const priceChange = token.priceChange24h || 0;
  const isPositive = priceChange >= 0;
  const hasBalance = balance > 0;

  return (
    <Card className={cn(
      "transition-all duration-200 hover:shadow-md",
      !hasBalance && "opacity-60"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Token Icon */}
            <div className="relative">
              {token.logoURI ? (
                <img
                  src={token.logoURI}
                  alt={token.symbol}
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={cn(
                "w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-sm font-semibold",
                token.logoURI && "hidden"
              )}>
                {token.symbol.slice(0, 2).toUpperCase()}
              </div>
              {hasBalance && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>

            {/* Token Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">{token.symbol}</h4>
                {token.priceChange24h !== undefined && (
                  <Badge variant={isPositive ? "default" : "destructive"} className="text-xs">
                    {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                    {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate">{token.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Info */}
            <div className="text-right">
              <p className="font-semibold">
                {formatTokenAmount(balance, token.decimals)} {token.symbol}
              </p>
              {balanceUSD > 0 && (
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(balanceUSD, settings.currency)}
                </p>
              )}
            </div>

            {/* Actions */}
            {showActions && hasBalance && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(token, 'send')}
                  className="h-8 w-8 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAction(token, 'swap')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExtendedActions(!showExtendedActions)}
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Extended Actions */}
        {showExtendedActions && (
          <div className="mt-3 pt-3 border-t flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(token, 'send')}
              disabled={!hasBalance}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(token, 'swap')}
              disabled={!hasBalance}
              className="flex-1"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Swap
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction(token, 'remove')}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add Token Modal Component
export function AddTokenModal({ 
  open, 
  onOpenChange 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
}) {
  const { addToken, importTokensByAddress, selectedChain } = useWalletStore();
  const [method, setMethod] = useState<'search' | 'custom'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Search tokens using CoinGecko API
      const response = await fetch(`/api/coingecko/search?query=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.coins || []);
    } catch (err) {
      setError('Failed to search tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomToken = async () => {
    if (!tokenAddress.trim()) {
      setError('Please enter a token address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const tokens = await importTokensByAddress([tokenAddress], selectedChain.chainId);
      if (tokens.length > 0) {
        onOpenChange(false);
        setTokenAddress('');
      } else {
        setError('Invalid token address or token not found');
      }
    } catch (err) {
      setError('Failed to add token');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToken = async (tokenData: any) => {
    try {
      const token: Token = {
        address: tokenData.contract_address || '',
        symbol: tokenData.symbol.toUpperCase(),
        name: tokenData.name,
        decimals: 18, // Default, would be fetched from contract
        chainId: selectedChain.chainId,
        logoURI: tokenData.large,
        balance: '0',
        balanceUSD: 0,
      };

      await addToken(token);
      onOpenChange(false);
    } catch (err) {
      setError('Failed to add token');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Token</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={method === 'search' ? 'default' : 'outline'}
              onClick={() => setMethod('search')}
              className="flex-1"
            >
              Search
            </Button>
            <Button
              variant={method === 'custom' ? 'default' : 'outline'}
              onClick={() => setMethod('custom')}
              className="flex-1"
            >
              Custom Token
            </Button>
          </div>

          {method === 'search' ? (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search for a token..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-2">
                {searchResults.map((token) => (
                  <Card key={token.id} className="cursor-pointer hover:bg-muted/50">
                    <CardContent className="p-3" onClick={() => handleAddToken(token)}>
                      <div className="flex items-center gap-3">
                        <img
                          src={token.thumb}
                          alt={token.symbol}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{token.symbol.toUpperCase()}</p>
                          <p className="text-sm text-muted-foreground">{token.name}</p>
                        </div>
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                placeholder="Token contract address"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
              />
              <Button onClick={handleAddCustomToken} disabled={loading} className="w-full">
                {loading ? 'Adding Token...' : 'Add Token'}
              </Button>
            </div>
          )}

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
