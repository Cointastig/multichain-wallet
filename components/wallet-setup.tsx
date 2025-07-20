'use client';

import { useState } from 'react';
import { useWalletStore } from '@/store/walletStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wallet, 
  Plus, 
  Download, 
  Shield, 
  Key, 
  Eye, 
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Shuffle
} from 'lucide-react';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { cn } from '@/lib/utils';

export function WalletSetup() {
  const { createWallet, importWallet } = useWalletStore();
  const [activeTab, setActiveTab] = useState('create');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Create wallet state
  const [walletName, setWalletName] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [confirmedBackup, setConfirmedBackup] = useState(false);
  
  // Import wallet state
  const [importData, setImportData] = useState('');
  const [importName, setImportName] = useState('');

  const handleCreateWallet = async () => {
    if (!walletName.trim()) {
      setError('Please enter a wallet name');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const newMnemonic = generateMnemonic();
      setMnemonic(newMnemonic);
      setStep(2);
    } catch (err) {
      setError('Failed to generate wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBackup = async () => {
    if (!confirmedBackup) {
      setError('Please confirm you have backed up your recovery phrase');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await createWallet(walletName, mnemonic);
      // Wallet creation successful, component will unmount
    } catch (err) {
      setError('Failed to create wallet');
      setLoading(false);
    }
  };

  const handleImportWallet = async () => {
    if (!importData.trim()) {
      setError('Please enter your recovery phrase or private key');
      return;
    }

    if (!importName.trim()) {
      setError('Please enter a wallet name');
      return;
    }

    // Validate mnemonic if it looks like one
    if (importData.split(' ').length >= 12) {
      if (!validateMnemonic(importData.trim())) {
        setError('Invalid recovery phrase');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      await importWallet(importData.trim(), importName);
      // Import successful, component will unmount
    } catch (err) {
      setError('Failed to import wallet');
      setLoading(false);
    }
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
  };

  const generateNewMnemonic = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic);
  };

  if (step === 2 && activeTab === 'create') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-2xl">
              <Shield className="h-6 w-6 text-primary" />
              Backup Your Wallet
            </CardTitle>
            <p className="text-muted-foreground">
              Save your recovery phrase in a secure location
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Your recovery phrase is the only way to restore your wallet. 
                Store it securely and never share it with anyone.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Recovery Phrase</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMnemonic(!showMnemonic)}
                  >
                    {showMnemonic ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" onClick={copyMnemonic}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateNewMnemonic}>
                    <Shuffle className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 bg-muted/50 rounded-lg">
                {(showMnemonic ? mnemonic : '•••• •••• •••• ••••').split(' ').map((word, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-background rounded text-sm font-mono"
                  >
                    <span className="text-muted-foreground w-6">{index + 1}.</span>
                    <span>{word}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="backup-confirmed"
                  checked={confirmedBackup}
                  onChange={(e) => setConfirmedBackup(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="backup-confirmed" className="text-sm">
                  I have safely stored my recovery phrase
                </Label>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleConfirmBackup}
                  disabled={!confirmedBackup || loading}
                  className="flex-1"
                >
                  {loading ? 'Creating Wallet...' : 'Create Wallet'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <Wallet className="h-6 w-6 text-primary" />
            MultiChain Wallet
          </CardTitle>
          <p className="text-muted-foreground">
            Create or import your crypto wallet
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Import
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="wallet-name">Wallet Name</Label>
                <Input
                  id="wallet-name"
                  placeholder="My Wallet"
                  value={walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Shield className="h-4 w-4 text-green-600" />
                  Secure & Private
                </div>
                <p className="text-xs text-muted-foreground">
                  Your keys are encrypted and stored locally. We never have access to your funds.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleCreateWallet}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Create New Wallet'}
              </Button>
            </TabsContent>

            <TabsContent value="import" className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="import-data">Recovery Phrase or Private Key</Label>
                <Textarea
                  id="import-data"
                  placeholder="Enter your 12-24 word recovery phrase or private key"
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="import-name">Wallet Name</Label>
                <Input
                  id="import-name"
                  placeholder="Imported Wallet"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4 text-blue-600" />
                  Import Existing Wallet
                </div>
                <p className="text-xs text-muted-foreground">
                  Restore access to your existing wallet using your recovery phrase or private key.
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handleImportWallet}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Importing...' : 'Import Wallet'}
              </Button>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Wallet Locked Component
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

// Loading Screen Component
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
