'use client';

import { useState } from 'react';
import { Token } from '@/types/wallet';
import { useWalletStore } from '@/store/walletStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Search, Plus, Loader2 } from 'lucide-react';

interface AddTokenModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTokenModal({ open, onOpenChange }: AddTokenModalProps) {
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
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? 'Adding Token...' : 'Add Token'}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
