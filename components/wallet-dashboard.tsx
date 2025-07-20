'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, 
  Download, 
  ArrowUpDown, 
  Plus, 
  QrCode, 
  Settings,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Wallet,
  Coins,
  History,
  BarChart3
} from 'lucide-react';
import { TokenList } from '@/components/token-list';
import { TransactionHistory } from '@/components/transaction-history';
import { SendModal } from '@/components/send-modal';
import { ReceiveModal } from '@/components/receive-modal';
import { SwapModal } from '@/components/swap-modal';
import { AddTokenModal } from '@/components/add-token-modal';
import { ChainSelector } from '@/components/chain-selector';
import { WalletMenu } from '@/components/wallet-menu';
import { MarketOverview } from '@/components/market-overview';
import { formatCurrency, formatAddress, cn } from '@/lib/utils';

export function WalletDashboard() {
  const { 
    activeWallet, 
    selectedChain, 
    tokens, 
    totalBalance,
    transactions,
    settings 
  } = useWalletStore();

  const [showBalance, setShowBalance] = useState(true);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAddTokenModal, setShowAddTokenModal] = useState(false);

  if (!activeWallet) return null;

  const walletTokens = tokens.filter(token => token.chainId === selectedChain.chainId);
  const recentTransactions = transactions.slice(0, 5);

  const portfolioChange = 12.5; // Calculate from actual data
  const isPositive = portfolioChange >= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WalletMenu />
              <ChainSelector />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <QrCode className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Portfolio Overview */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/5" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
                <div className="flex items-center gap-2">
                  {showBalance ? (
                    <h2 className="text-3xl font-bold">
                      {formatCurrency(totalBalance, settings.currency)}
                    </h2>
                  ) : (
                    <h2 className="text-3xl font-bold">••••••</h2>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setShowBalance(!showBalance)}
                  >
                    {showBalance ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "flex items-center gap-1 text-sm font-medium",
                  isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  {isPositive ? '+' : ''}{portfolioChange.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">24h change</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-4 gap-3">
              <Button 
                className="flex flex-col gap-2 h-16"
                onClick={() => setShowSendModal(true)}
              >
                <Send className="h-5 w-5" />
                <span className="text-xs">Send</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-16"
                onClick={() => setShowReceiveModal(true)}
              >
                <Download className="h-5 w-5" />
                <span className="text-xs">Receive</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-16"
                onClick={() => setShowSwapModal(true)}
              >
                <ArrowUpDown className="h-5 w-5" />
                <span className="text-xs">Swap</span>
              </Button>
              <Button 
                variant="outline" 
                className="flex flex-col gap-2 h-16"
                onClick={() => setShowAddTokenModal(true)}
              >
                <Plus className="h-5 w-5" />
                <span className="text-xs">Add Token</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="tokens" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tokens" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Tokens
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
            <TabsTrigger value="market" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Market
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              DeFi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tokens" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Your Tokens</h3>
              <Badge variant="secondary">
                {walletTokens.length} {walletTokens.length === 1 ? 'Token' : 'Tokens'}
              </Badge>
            </div>
            <TokenList tokens={walletTokens} />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Transaction History</h3>
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </div>
            <TransactionHistory transactions={recentTransactions} />
          </TabsContent>

          <TabsContent value="market" className="space-y-4">
            <MarketOverview />
          </TabsContent>

          <TabsContent value="defi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>DeFi Positions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No DeFi positions found</p>
                  <p className="text-sm">Connect to DeFi protocols to see your positions here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Wallet Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium">Wallet Address</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {formatAddress(activeWallet.address)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigator.clipboard.writeText(activeWallet.address)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Network</p>
                <p className="font-medium">{selectedChain.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Wallet Type</p>
                <p className="font-medium capitalize">{activeWallet.type}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <SendModal open={showSendModal} onOpenChange={setShowSendModal} />
      <ReceiveModal open={showReceiveModal} onOpenChange={setShowReceiveModal} />
      <SwapModal open={showSwapModal} onOpenChange={setShowSwapModal} />
      <AddTokenModal open={showAddTokenModal} onOpenChange={setShowAddTokenModal} />
    </div>
  );
}
