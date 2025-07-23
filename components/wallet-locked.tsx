// components/wallet-locked.tsx
'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export function WalletLocked() {
  const { unlockWallet } = useWalletStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = async () => {
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await unlockWallet(pin);
      if (!success) {
        setError('Invalid PIN');
        setPin('');
      }
    } catch (err) {
      setError('Failed to unlock wallet');
    } finally {
      setLoading(false);
    }
  };

  const handlePinInput = (value: string) => {
    if (value.length <= 6 && /^\d*$/.test(value)) {
      setPin(value);
      if (value.length === 6) {
        setTimeout(() => handleUnlock(), 100);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Unlock Wallet</CardTitle>
          <p className="text-muted-foreground">Enter your 6-digit PIN</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-4 h-4 rounded-full border-2",
                    index < pin.length
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/30"
                  )}
                />
              ))}
            </div>

            <Input
              type="password"
              placeholder="Enter PIN"
              value={pin}
              onChange={(e) => handlePinInput(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={6}
              autoFocus
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }, (_, i) => i + 1).map((num) => (
              <Button
                key={num}
                variant="outline"
                onClick={() => handlePinInput(pin + num)}
                disabled={pin.length >= 6 || loading}
                className="h-12 text-lg"
              >
                {num}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => setPin(pin.slice(0, -1))}
              disabled={pin.length === 0 || loading}
              className="h-12"
            >
              ⌫
            </Button>
            <Button
              variant="outline"
              onClick={() => handlePinInput(pin + '0')}
              disabled={pin.length >= 6 || loading}
              className="h-12 text-lg"
            >
              0
            </Button>
            <Button
              variant="outline"
              onClick={() => setPin('')}
              disabled={pin.length === 0 || loading}
              className="h-12"
            >
              Clear
            </Button>
          </div>

          <Button
            onClick={handleUnlock}
            disabled={pin.length !== 6 || loading}
            className="w-full"
          >
            {loading ? 'Unlocking...' : 'Unlock'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
