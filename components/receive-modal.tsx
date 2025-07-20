'use client';

import { useState, useEffect } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, Copy, AlertTriangle, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

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
