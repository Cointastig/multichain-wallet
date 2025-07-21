'use client';

import { Progress } from '@/components/ui/progress';
import { Wallet } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
          <Wallet className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Loading Wallet</h3>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
        <Progress value={undefined} className="w-48 mx-auto" />
      </div>
    </div>
  );
}
