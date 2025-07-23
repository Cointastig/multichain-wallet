'use client';

import { useState } from 'react';
import { Token } from '@/types/wallet';
import { useWalletStore } from '@/store/walletStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowUpDown, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { formatTokenAmount, cn } from '@/lib/utils';

interface SwapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFromToken?: Token;
}

export function SwapModal({ open, onOpenChange, defaultFromToken }: SwapModalProps) {
  const { tokens, selectedChain, swapTokens } = useWalletStore();
  const [fromToken, setFromToken] = useState<Token | null>(defaultFromToken || null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState('0.5');
  const [loading, setLoading] = useState(false);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState('');

  const availableTokens = tokens.filter(token => token.chainId === selectedChain.chainId);

  const switchTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleSwap = async () => {
    if (!fromToken || !toToken || !fromAmount) return;

    setLoading(true);
    setError('');

    try {
      await swapTokens(fromToken, toToken, fromAmount, parseFloat(slippage));
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Swap failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUpDown className="h-5 w-5" />
            Swap Tokens
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* From Token */}
          <div className="space-y-2">
            <Label>From</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Select
                    value={fromToken?.address || ''}
                    onValueChange={(address) => {
                      const token = availableTokens.find(t => t.address === address);
                      setFromToken(token || null);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select">
                        {fromToken && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                              {fromToken.symbol.slice(0, 2)}
                            </div>
                            <span>{fromToken.symbol}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                              {token.symbol.slice(0, 2)}
                            </div>
                            <span>{token.symbol}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    className="flex-1 ml-3 text-right text-lg"
                  />
                </div>
                
                {fromToken && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Balance: {formatTokenAmount(parseFloat(fromToken.balance || '0'), fromToken.decimals)}</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFromAmount(fromToken.balance || '0')}
                      className="h-auto p-0 text-xs"
                    >
                      Max
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="icon"
              onClick={switchTokens}
              className="rounded-full"
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </div>

          {/* To Token */}
          <div className="space-y-2">
            <Label>To</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Select
                    value={toToken?.address || ''}
                    onValueChange={(address) => {
                      const token = availableTokens.find(t => t.address === address);
                      setToToken(token || null);
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Select">
                        {toToken && (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                              {toToken.symbol.slice(0, 2)}
                            </div>
                            <span>{toToken.symbol}</span>
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address}>
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                              {token.symbol.slice(0, 2)}
                            </div>
                            <span>{token.symbol}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={toAmount}
                    readOnly
                    className="flex-1 ml-3 text-right text-lg bg-muted"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Swap Details */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Slippage Tolerance</span>
                <div className="flex gap-1">
                  {['0.1', '0.5', '1.0'].map((value) => (
                    <Button
                      key={value}
                      variant={slippage === value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSlippage(value)}
                      className="h-6 px-2 text-xs"
                    >
                      {value}%
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleSwap}
            disabled={!fromToken || !toToken || !fromAmount || loading}
            className="w-full"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {loading ? 'Swapping...' : 'Swap Tokens'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
