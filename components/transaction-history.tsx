'use client';

import { useState } from 'react';
import { Transaction } from '@/types/wallet';
import { useWalletStore } from '@/store/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Send, 
  Download, 
  ArrowUpDown, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink,
  Copy,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatCurrency, formatTokenAmount, formatTime, formatAddress, getExplorerUrl, cn } from '@/lib/utils';

interface TransactionHistoryProps {
  transactions: Transaction[];
  showFilters?: boolean;
  maxItems?: number;
}

export function TransactionHistory({ 
  transactions, 
  showFilters = true, 
  maxItems 
}: TransactionHistoryProps) {
  const { selectedChain, settings } = useWalletStore();
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'swap' | 'approve'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesType = filter === 'all' || tx.type === filter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesSearch = !searchQuery || 
        tx.hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.tokenSymbol && tx.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesType && matchesStatus && matchesSearch;
    })
    .slice(0, maxItems);

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Transactions Yet</h3>
          <p className="text-muted-foreground text-center">
            Your transaction history will appear here once you start using your wallet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="send">Send</SelectItem>
                <SelectItem value="receive">Receive</SelectItem>
                <SelectItem value="swap">Swap</SelectItem>
                <SelectItem value="approve">Approve</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-2">
        {filteredTransactions.map((transaction) => (
          <TransactionItem
            key={transaction.hash}
            transaction={transaction}
            onClick={() => setSelectedTransaction(transaction)}
          />
        ))}
      </div>

      {filteredTransactions.length === 0 && (searchQuery || filter !== 'all' || statusFilter !== 'all') && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No transactions match your filters</p>
          </CardContent>
        </Card>
      )}

      {/* Transaction Details Modal */}
      <TransactionDetailsModal
        transaction={selectedTransaction}
        open={!!selectedTransaction}
        onOpenChange={(open) => !open && setSelectedTransaction(null)}
      />
    </div>
  );
}

interface TransactionItemProps {
  transaction: Transaction;
  onClick: () => void;
}

function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const { selectedChain, settings } = useWalletStore();

  const getTransactionIcon = () => {
    switch (transaction.type) {
      case 'send':
        return <Send className="h-5 w-5" />;
      case 'receive':
        return <Download className="h-5 w-5" />;
      case 'swap':
        return <ArrowUpDown className="h-5 w-5" />;
      default:
        return <Send className="h-5 w-5" />;
    }
  };

  const getStatusIcon = () => {
    switch (transaction.status) {
      case 'confirmed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAmountDisplay = () => {
    const amount = parseFloat(transaction.value);
    const symbol = transaction.tokenSymbol || selectedChain.symbol;
    const isPositive = transaction.type === 'receive';
    
    return (
      <div className="text-right">
        <p className={cn(
          "font-semibold",
          isPositive ? "text-green-600" : "text-foreground"
        )}>
          {isPositive ? '+' : '-'}{formatTokenAmount(amount)} {symbol}
        </p>
        {transaction.feeUSD && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(transaction.feeUSD, settings.currency)}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Transaction Type Icon */}
          <div className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center",
            transaction.type === 'send' && "bg-red-100 text-red-600",
            transaction.type === 'receive' && "bg-green-100 text-green-600",
            transaction.type === 'swap' && "bg-blue-100 text-blue-600",
            transaction.type === 'approve' && "bg-purple-100 text-purple-600"
          )}>
            {getTransactionIcon()}
          </div>

          {/* Transaction Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold capitalize">{transaction.type}</h4>
              {getStatusIcon()}
              <Badge 
                variant={transaction.status === 'confirmed' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {transaction.status}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{formatTime(transaction.timestamp)}</span>
              <span>•</span>
              <span className="font-mono">
                {transaction.type === 'send' ? 'To' : 'From'}: {formatAddress(
                  transaction.type === 'send' ? transaction.to : transaction.from
                )}
              </span>
            </div>
            
            {transaction.fee && (
              <p className="text-xs text-muted-foreground mt-1">
                Fee: {transaction.fee} {selectedChain.symbol}
              </p>
            )}
          </div>

          {/* Amount */}
          {getAmountDisplay()}
        </div>
      </CardContent>
    </Card>
  );
}

interface TransactionDetailsModalProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function TransactionDetailsModal({ transaction, open, onOpenChange }: TransactionDetailsModalProps) {
  const { selectedChain, settings } = useWalletStore();

  if (!transaction) return null;

  const copyHash = () => {
    navigator.clipboard.writeText(transaction.hash);
  };

  const openInExplorer = () => {
    const url = getExplorerUrl(transaction.chainId, transaction.hash);
    window.open(url, '_blank');
  };

  const getStatusColor = () => {
    switch (transaction.status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize">
            {transaction.type === 'send' && <Send className="h-5 w-5" />}
            {transaction.type === 'receive' && <Download className="h-5 w-5" />}
            {transaction.type === 'swap' && <ArrowUpDown className="h-5 w-5" />}
            {transaction.type} Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge className={cn("text-xs", getStatusColor())}>
              {transaction.status}
            </Badge>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <div className="text-right">
                <p className="font-semibold">
                  {formatTokenAmount(parseFloat(transaction.value))} {
                    transaction.tokenSymbol || selectedChain.symbol
                  }
                </p>
                {transaction.feeUSD && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatCurrency(transaction.feeUSD, settings.currency)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Addresses */}
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">From</p>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="font-mono text-sm">{formatAddress(transaction.from)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => navigator.clipboard.writeText(transaction.from)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">To</p>
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="font-mono text-sm">{formatAddress(transaction.to)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => navigator.clipboard.writeText(transaction.to)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          {/* Transaction Hash */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="font-mono text-sm">{formatAddress(transaction.hash, { start: 8, end: 8 })}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={copyHash}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Gas Information */}
          {(transaction.gasUsed || transaction.fee) && (
            <div className="space-y-2">
              {transaction.gasUsed && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gas Used</span>
                  <span className="text-sm font-medium">{transaction.gasUsed}</span>
                </div>
              )}
              {transaction.fee && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transaction Fee</span>
                  <span className="text-sm font-medium">
                    {transaction.fee} {selectedChain.symbol}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Block Information */}
          {transaction.blockNumber && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Block Number</span>
              <span className="text-sm font-medium">{transaction.blockNumber.toLocaleString()}</span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Time</span>
            <span className="text-sm font-medium">
              {new Date(transaction.timestamp).toLocaleString()}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={copyHash} className="flex-1">
              <Copy className="h-4 w-4 mr-2" />
              Copy Hash
            </Button>
            <Button onClick={openInExplorer} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Transaction Statistics Component
export function TransactionStats({ transactions }: { transactions: Transaction[] }) {
  const { settings } = useWalletStore();

  const stats = transactions.reduce((acc, tx) => {
    const amount = parseFloat(tx.value);
    const fee = parseFloat(tx.fee || '0');
    
    if (tx.type === 'send') {
      acc.totalSent += amount;
      acc.totalFees += fee;
      acc.sendCount++;
    } else if (tx.type === 'receive') {
      acc.totalReceived += amount;
      acc.receiveCount++;
    } else if (tx.type === 'swap') {
      acc.swapCount++;
      acc.totalFees += fee;
    }
    
    return acc;
  }, {
    totalSent: 0,
    totalReceived: 0,
    totalFees: 0,
    sendCount: 0,
    receiveCount: 0,
    swapCount: 0,
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">Total Received</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(stats.totalReceived, settings.currency)}</p>
          <p className="text-xs text-muted-foreground">{stats.receiveCount} transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-red-600" />
            <span className="text-sm text-muted-foreground">Total Sent</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(stats.totalSent, settings.currency)}</p>
          <p className="text-xs text-muted-foreground">{stats.sendCount} transactions</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpDown className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">Swaps</span>
          </div>
          <p className="text-lg font-bold">{stats.swapCount}</p>
          <p className="text-xs text-muted-foreground">Total swaps</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-4 w-4 bg-yellow-600 rounded" />
            <span className="text-sm text-muted-foreground">Total Fees</span>
          </div>
          <p className="text-lg font-bold">{formatCurrency(stats.totalFees, settings.currency)}</p>
          <p className="text-xs text-muted-foreground">Network fees paid</p>
        </CardContent>
      </Card>
    </div>
  );
}
