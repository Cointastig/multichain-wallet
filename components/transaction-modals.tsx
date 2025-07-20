'use client';

import { useState, useEffect } from 'react';
import { Token } from '@/types/wallet';
import { useWalletStore } from '@/store/walletStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Send, 
  QrCode, 
  ArrowUpDown, 
  Copy, 
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Calculator,
  Zap,
  Clock,
  Fuel
} from 'lucide-react';
import { formatCurrency, formatTokenAmount, formatAddress, cn } from '@/lib/utils';
import QRCode from 'qrcode';

// Send Modal Component
interface SendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultToken?: Token;
}

export function SendModal({ open, onOpenChange, defaultToken }: SendModalProps) {
  const { 
    activeWallet, 
    selectedChain, 
    tokens, 
    sendTransaction, 
    estimateGas,
    settings 
  } = useWalletStore();

  const [selectedToken, setSelectedToken] = useState<Token | null>(defaultToken || null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [gasPrice, setGasPrice] = useState('');
  const [gasLimit, setGasLimit] = useState('');
  const [loading, setLoading] = useState(false);
  const [estimating, setEstimating] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'sending' | 'success'>('form');
  const [txHash, setTxHash] = useState('');

  const availableTokens = tokens.filter(token => 
    token.chainId === selectedChain.chainId && 
    parseFloat(token.balance || '0') > 0
  );

  const selectedTokenBalance = selectedToken ? parseFloat(selectedToken.balance || '0') : 0;
  const isAmountValid = parseFloat(amount) > 0 && parseFloat(amount) <= selectedTokenBalance;
  const estimatedFee = gasPrice && gasLimit ? 
    (parseFloat(gasPrice) * parseFloat(gasLimit) / 1e9).toFixed(6) : '0';

  useEffect(() => {
    if (defaultToken) {
      setSelectedToken(defaultToken);
    }
  }, [defaultToken]);

  useEffect(() => {
    if (recipient && amount && selectedToken && isAmountValid) {
      handleEstimateGas();
    }
  }, [recipient, amount, selectedToken]);

  const handleEstimateGas = async () => {
    if (!recipient || !amount || !selectedToken) return;

    setEstimating(true);
    try {
      const estimate = await estimateGas(recipient, amount, selectedToken);
      setGasLimit(estimate);
      setGasPrice('20'); // Default gas price in Gwei
    } catch (err) {
      console.error('Gas estimation failed:', err);
    } finally {
      setEstimating(false);
    }
  };

  const handleSend = async () => {
    if (!selectedToken || !recipient || !amount) return;

    setLoading(true);
    setError('');
    setStep('sending');

    try {
      const hash = await sendTransaction(recipient, amount, selectedToken);
      setTxHash(hash);
      setStep('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setTimeout(() => {
      setStep('form');
      setRecipient('');
      setAmount('');
      setError('');
      setTxHash('');
      if (!defaultToken) setSelectedToken(null);
    }, 300);
  };

  const renderStep = () => {
    switch (step) {
      case 'form':
        return (
          <div className="space-y-4">
            {/* Token Selection */}
            <div className="space-y-2">
              <Label>Token</Label>
              <Select 
                value={selectedToken?.address || ''} 
                onValueChange={(address) => {
                  const token = availableTokens.find(t => t.address === address);
                  setSelectedToken(token || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select token to send">
                    {selectedToken && (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                          {selectedToken.symbol.slice(0, 2)}
                        </div>
                        <span>{selectedToken.symbol}</span>
                        <span className="text-muted-foreground">
                          (Balance: {formatTokenAmount(selectedTokenBalance, selectedToken.decimals)})
                        </span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold">
                          {token.symbol.slice(0, 2)}
                        </div>
                        <span>{token.symbol}</span>
                        <span className="text-muted-foreground">
                          ({formatTokenAmount(parseFloat(token.balance || '0'), token.decimals)})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recipient */}
            <div className="space-y-2">
              <Label>Recipient Address</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter recipient address"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    onClick={() => setAmount(selectedTokenBalance.toString())}
                    disabled={!selectedToken}
                  >
                    Max
                  </Button>
                </div>
                {selectedToken && amount && (
                  <p className="text-sm text-muted-foreground">
                    ≈ {formatCurrency(
                      parseFloat(amount) * (selectedToken.price || 0), 
                      settings.currency
                    )}
                  </p>
                )}
              </div>
            </div>

            {/* Gas Settings */}
            {gasLimit && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      <Label className="text-sm">Network Fee</Label>
                    </div>
                    {estimating && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Gas Price (Gwei)</p>
                      <p className="font-medium">{gasPrice}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Estimated Fee</p>
                      <p className="font-medium">{estimatedFee} {selectedChain.symbol}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => setStep('confirm')}
                disabled={!isAmountValid || !recipient || !selectedToken}
                className="flex-1"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Confirm Transaction</h3>
              <p className="text-muted-foreground">Review your transaction details</p>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token</span>
                    <span className="font-medium">{selectedToken?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">{amount} {selectedToken?.symbol}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">To</span>
                    <span className="font-mono text-sm">{formatAddress(recipient)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Network Fee</span>
                    <span className="font-medium">{estimatedFee} {selectedChain.symbol}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total Cost</span>
                    <span>{amount} {selectedToken?.symbol} + {estimatedFee} {selectedChain.symbol}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('form')} className="flex-1">
                Back
              </Button>
              <Button onClick={handleSend} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Send Transaction
              </Button>
            </div>
          </div>
        );

      case 'sending':
        return (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Sending Transaction</h3>
              <p className="text-muted-foreground">Please wait while we process your transaction</p>
            </div>
            <Progress value={undefined} className="w-full" />
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4 py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transaction Sent!</h3>
              <p className="text-muted-foreground">Your transaction has been submitted successfully</p>
            </div>
            
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{formatAddress(txHash)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigator.clipboard.writeText(txHash)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.open(`${selectedChain.explorerUrl}/tx/${txHash}`, '_blank')}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send {selectedToken?.symbol || 'Token'}
          </DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}

// Receive Modal Component
interface ReceiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReceiveModal({ open, onOpenChange }: ReceiveModalProps) {
  const { activeWallet, selectedChain } = useWalletStore();
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    if (activeWallet && open) {
      generateQRCode();
    }
  }, [activeWallet, open]);

  const generateQRCode = async () => {
    if (!activeWallet) return;
    
    try {
      const qrCodeDataURL = await QRCode.toDataURL(activeWallet.address, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });
      setQrCode(qrCodeDataURL);
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  const copyAddress = () => {
    if (activeWallet) {
      navigator.clipboard.writeText(activeWallet.address);
    }
  };

  const shareAddress = async () => {
    if (activeWallet && navigator.share) {
      try {
        await navigator.share({
          title: 'My Wallet Address',
          text: activeWallet.address,
        });
      } catch (err) {
        copyAddress();
      }
    } else {
      copyAddress();
    }
  };

  if (!activeWallet) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Receive {selectedChain.symbol}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* QR Code */}
          <div className="text-center">
            <div className="inline-block p-4 bg-white rounded-xl">
              {qrCode ? (
                <img src={qrCode} alt="Wallet QR Code" className="w-48 h-48" />
              ) : (
                <div className="w-48 h-48 bg-muted flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label>Your {selectedChain.name} Address</Label>
            <Card>
              <CardContent className="p-3 flex items-center justify-between">
                <span className="font-mono text-sm break-all">
                  {activeWallet.address}
                </span>
                <Button variant="ghost" size="icon" onClick={copyAddress}>
                  <Copy className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Warning */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Only send {selectedChain.name} assets to this address. 
              Sending other assets may result in permanent loss.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={copyAddress} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Address
            </Button>
            <Button onClick={shareAddress} className="flex-1">
              Share Address
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Swap Modal Component  
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
