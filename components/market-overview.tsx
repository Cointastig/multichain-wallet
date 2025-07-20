'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  TrendingUp, 
  TrendingDown,
  Star,
  BarChart3,
  Activity,
  DollarSign,
  Search,
  Filter,
  Zap
} from 'lucide-react';
import { formatCurrency, formatPercentage, cn } from '@/lib/utils';
import useSWR from 'swr';

export function MarketOverview() {
  const [filter, setFilter] = useState<'all' | 'favorites' | 'gainers' | 'losers'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);

  const { data: marketData, error, isLoading } = useSWR(
    '/api/coingecko/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=true',
    async (url) => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch market data');
      return response.json();
    },
    { refreshInterval: 60000 } // Refresh every minute
  );

  const toggleFavorite = (coinId: string) => {
    setFavorites(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  const filteredData = marketData?.filter((coin: any) => {
    const matchesSearch = coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    
    switch (filter) {
      case 'favorites':
        return matchesSearch && favorites.includes(coin.id);
      case 'gainers':
        return matchesSearch && coin.price_change_percentage_24h > 0;
      case 'losers':
        return matchesSearch && coin.price_change_percentage_24h < 0;
      default:
        return matchesSearch;
    }
  }) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/6" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-20" />
                  <div className="h-3 bg-muted rounded w-16" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Market Data</h3>
          <p className="text-muted-foreground text-center">
            Unable to fetch market data. Please check your connection and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Market Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Market Cap</span>
            </div>
            <p className="text-lg font-bold">$1.2T</p>
            <p className="text-xs text-green-600">+2.4%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">24h Volume</span>
            </div>
            <p className="text-lg font-bold">$45.2B</p>
            <p className="text-xs text-red-600">-1.2%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">BTC Dominance</span>
            </div>
            <p className="text-lg font-bold">52.3%</p>
            <p className="text-xs text-green-600">+0.8%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Fear & Greed</span>
            </div>
            <p className="text-lg font-bold">67</p>
            <p className="text-xs text-muted-foreground">Greed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search cryptocurrencies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          {(['all', 'favorites', 'gainers', 'losers'] as const).map((filterType) => (
            <Button
              key={filterType}
              variant={filter === filterType ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(filterType)}
              className="capitalize"
            >
              {filterType === 'favorites' && <Star className="h-4 w-4 mr-1" />}
              {filterType === 'gainers' && <TrendingUp className="h-4 w-4 mr-1" />}
              {filterType === 'losers' && <TrendingDown className="h-4 w-4 mr-1" />}
              {filterType}
            </Button>
          ))}
        </div>
      </div>

      {/* Market List */}
      <div className="space-y-2">
        {filteredData.map((coin: any, index: number) => (
          <MarketItem
            key={coin.id}
            coin={coin}
            rank={index + 1}
            isFavorite={favorites.includes(coin.id)}
            onToggleFavorite={() => toggleFavorite(coin.id)}
          />
        ))}
      </div>

      {filteredData.length === 0 && searchQuery && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No cryptocurrencies found for "{searchQuery}"</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface MarketItemProps {
  coin: any;
  rank: number;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function MarketItem({ coin, rank, isFavorite, onToggleFavorite }: MarketItemProps) {
  const priceChange = coin.price_change_percentage_24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {/* Rank */}
          <div className="w-8 text-center text-sm text-muted-foreground font-medium">
            {rank}
          </div>

          {/* Favorite Star */}
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            className="h-6 w-6 p-0"
          >
            <Star className={cn(
              "h-4 w-4",
              isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )} />
          </Button>

          {/* Coin Info */}
          <div className="flex items-center gap-3 flex-1">
            <img
              src={coin.image}
              alt={coin.name}
              className="w-8 h-8 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-semibold hidden">
              {coin.symbol.slice(0, 2).toUpperCase()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold truncate">{coin.symbol.toUpperCase()}</p>
                <Badge variant="secondary" className="text-xs">
                  #{coin.market_cap_rank}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">{coin.name}</p>
            </div>
          </div>

          {/* Price Info */}
          <div className="text-right">
            <p className="font-semibold">
              {formatCurrency(coin.current_price, 'USD')}
            </p>
            <div className={cn(
              "flex items-center gap-1 text-sm",
              isPositive ? "text-green-600" : "text-red-600"
            )}>
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{formatPercentage(priceChange)}</span>
            </div>
          </div>

          {/* Market Cap */}
          <div className="text-right hidden lg:block">
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="font-medium">
              {formatCurrency(coin.market_cap, 'USD', { compact: true })}
            </p>
          </div>

          {/* 24h Volume */}
          <div className="text-right hidden xl:block">
            <p className="text-sm text-muted-foreground">24h Volume</p>
            <p className="font-medium">
              {formatCurrency(coin.total_volume, 'USD', { compact: true })}
            </p>
          </div>

          {/* Sparkline */}
          <div className="w-24 h-12 hidden lg:block">
            {coin.sparkline_in_7d?.price && (
              <div className="w-full h-full flex items-end justify-between">
                {coin.sparkline_in_7d.price.slice(-20).map((price: number, index: number) => (
                  <div
                    key={index}
                    className={cn(
                      "w-0.5 rounded-t",
                      isPositive ? "bg-green-500" : "bg-red-500"
                    )}
                    style={{
                      height: `${Math.max(2, (price / Math.max(...coin.sparkline_in_7d.price.slice(-20))) * 100)}%`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
