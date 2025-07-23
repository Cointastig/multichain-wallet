# 🚀 MultiChain Wallet - Professional Crypto Management

A modern, secure, and feature-rich multi-chain cryptocurrency wallet built with Next.js 14, TypeScript, and Tailwind CSS. Supports Ethereum, Bitcoin, Solana, and many other blockchain networks.

![MultiChain Wallet](https://img.shields.io/badge/Version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Features

### 🔐 Security First
- **End-to-End Encryption**: All private keys encrypted locally
- **Biometric Authentication**: Face ID / Touch ID support via WebAuthn
- **PIN Protection**: 6-digit PIN with attempt limiting
- **Secure Storage**: No server-side key storage
- **Hardware Wallet Ready**: Extensible for hardware wallet integration

### 🌐 Multi-Chain Support
- **Ethereum** and EVM-compatible chains (BSC, Polygon, Arbitrum, Optimism, Avalanche, Fantom)
- **Bitcoin** support with multiple address formats
- **Solana** ecosystem integration
- **Easy to extend** for additional blockchains

### 💰 Comprehensive Wallet Features
- **Send & Receive**: Cross-chain transactions with QR code support
- **Token Management**: Add, import, and manage custom tokens
- **Portfolio Tracking**: Real-time balance and price tracking
- **Transaction History**: Complete transaction management
- **Address Book**: Save and manage frequently used addresses

### 🔄 DeFi Integration
- **Token Swaps**: Built-in DEX aggregation
- **Staking**: Earn rewards through staking protocols
- **Liquidity Pools**: Provide liquidity and earn fees
- **Yield Farming**: Access to various farming opportunities

### 📊 Market Data
- **Real-Time Prices**: Live cryptocurrency prices via CoinGecko
- **Market Analytics**: Price charts, market cap, volume data
- **Portfolio Performance**: Track gains/losses and performance metrics
- **Price Alerts**: Set custom price notifications

### 📱 Progressive Web App (PWA)
- **Offline Support**: Core functionality works offline
- **Mobile Optimized**: Native app-like experience
- **Push Notifications**: Transaction and price alerts
- **Install to Home Screen**: Works like a native app

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI Components
- **State Management**: Zustand with Immer
- **Blockchain**: Ethers.js, Web3.js, Solana Web3.js
- **Crypto**: Bitcoin.js, BIP39, HDKey
- **API**: CoinGecko API for market data
- **PWA**: Next-PWA for offline support
- **Authentication**: WebAuthn for biometrics

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/multichain-wallet.git
cd multichain-wallet
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
# Optional: CoinGecko Pro API Key for higher rate limits
COINGECKO_API_KEY=your_coingecko_api_key

# Optional: Infura Project ID for Ethereum RPC
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id

# Optional: Alchemy API Key for enhanced features
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# App Configuration
NEXT_PUBLIC_APP_NAME="MultiChain Wallet"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL="https://your-domain.com"

# Security Configuration
ENCRYPTION_SECRET=your_32_character_secret_key_here
```

4. **Run the development server**
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
multichain-wallet/
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes
│   │   ├── coingecko/     # CoinGecko proxy
│   │   └── health/        # Health check
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── wallet-dashboard.tsx
│   ├── wallet-setup.tsx
│   ├── token-list.tsx
│   ├── transaction-modals.tsx
│   └── ...
├── lib/                  # Utility libraries
│   ├── web3.ts          # Multi-chain web3 services
│   ├── crypto.ts        # Encryption utilities
│   └── utils.ts         # Helper functions
├── store/               # State management
│   └── walletStore.ts   # Main wallet store
├── types/               # TypeScript definitions
│   └── wallet.ts        # Wallet type definitions
├── public/              # Static assets
│   ├── icons/          # PWA icons
│   ├── manifest.json   # PWA manifest
│   └── sw.js          # Service worker
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Keys (Optional but recommended for production)
COINGECKO_API_KEY=your_coingecko_pro_api_key
NEXT_PUBLIC_INFURA_PROJECT_ID=your_infura_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key

# RPC Endpoints (Override defaults)
NEXT_PUBLIC_ETHEREUM_RPC=https://mainnet.infura.io/v3/YOUR_KEY
NEXT_PUBLIC_BSC_RPC=https://bsc-dataseed1.binance.org
NEXT_PUBLIC_POLYGON_RPC=https://polygon-rpc.com
NEXT_PUBLIC_ARBITRUM_RPC=https://arb1.arbitrum.io/rpc
NEXT_PUBLIC_OPTIMISM_RPC=https://mainnet.optimism.io
NEXT_PUBLIC_AVALANCHE_RPC=https://api.avax.network/ext/bc/C/rpc
NEXT_PUBLIC_FANTOM_RPC=https://rpc.ftm.tools
NEXT_PUBLIC_SOLANA_RPC=https://api.mainnet-beta.solana.com

# Security
ENCRYPTION_SECRET=your_32_character_secret_key_here
NEXTAUTH_SECRET=your_nextauth_secret_key_here

# App Configuration
NEXT_PUBLIC_APP_NAME="MultiChain Wallet"
NEXT_PUBLIC_APP_VERSION="1.0.0"
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Features (Enable/Disable)
NEXT_PUBLIC_ENABLE_BIOMETRIC=true
NEXT_PUBLIC_ENABLE_HARDWARE_WALLET=true
NEXT_PUBLIC_ENABLE_DEFI=true
NEXT_PUBLIC_ENABLE_NFT=true

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Adding Custom RPC Endpoints

Edit `types/wallet.ts` to add custom RPC endpoints:

```typescript
export const SUPPORTED_CHAINS: ChainConfig = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    rpcUrl: process.env.NEXT_PUBLIC_ETHEREUM_RPC || 'https://eth.public-rpc.com',
    explorerUrl: 'https://etherscan.io',
    // ... other config
  },
  // Add your custom chain here
  mychain: {
    id: 'mychain',
    name: 'My Custom Chain',
    symbol: 'MCC',
    chainId: 12345,
    rpcUrl: 'https://rpc.mychain.com',
    explorerUrl: 'https://explorer.mychain.com',
    nativeCurrency: {
      name: 'My Custom Coin',
      symbol: 'MCC',
      decimals: 18,
    },
  },
};
```

## 🔐 Security Features

### Local Encryption
- All private keys are encrypted using AES-256-GCM
- Encryption keys derived from user PIN using PBKDF2
- No private keys ever leave the device

### PIN Security
- 6-digit PIN requirement
- Rate limiting: 5 attempts before lockout
- 30-minute lockout period after failed attempts
- Secure PIN storage using hashed values

### Biometric Authentication
- WebAuthn-based biometric authentication
- Platform authenticator support (Face ID, Touch ID, Windows Hello)
- Fallback to PIN if biometric fails
- Optional biometric enablement

### Additional Security
- Content Security Policy (CSP) headers
- XSS protection
- CSRF protection
- Secure headers configuration

## 🌐 Supported Networks

### Mainnet Support
- **Ethereum** (ETH) - Full support with EIP-1559
- **Bitcoin** (BTC) - Legacy, SegWit, and Native SegWit
- **Binance Smart Chain** (BNB) - Full EVM compatibility
- **Polygon** (MATIC) - High-speed transactions
- **Arbitrum** (ETH) - Layer 2 scaling
- **Optimism** (ETH) - Optimistic rollup
- **Avalanche** (AVAX) - C-Chain support
- **Fantom** (FTM) - Opera mainnet
- **Solana** (SOL) - Native Solana support

### Testnet Support
All mainnets also support their respective testnets for development and testing.

## 🧪 Development

### Running Tests
```bash
npm run test
# or
yarn test
```

### Type Checking
```bash
npm run type-check
# or
yarn type-check
```

### Linting
```bash
npm run lint
# or
yarn lint
```

### Building for Production
```bash
npm run build
# or
yarn build
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Connect your repository to Vercel**
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Automatic deployments on push

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/multichain-wallet)

### Netlify

1. **Connect repository** to Netlify
2. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Set environment variables**
4. **Deploy**

### Docker

```dockerfile
FROM node:18-alpine AS base
# ... Docker configuration
```

Build and run:
```bash
docker build -t multichain-wallet .
docker run -p 3000:3000 multichain-wallet
```

### Self-Hosted

1. **Build the application**
```bash
npm run build
```

2. **Start the production server**
```bash
npm start
```

3. **Configure reverse proxy** (nginx, Apache, etc.)

## 🔌 API Integration

### CoinGecko API
For market data and price information:
- Free tier: 50 calls/minute
- Pro tier: Higher limits with API key
- Automatic fallback to cached data

### Custom RPC Providers
Integrate with your preferred RPC providers:
- Infura
- Alchemy  
- QuickNode
- Custom RPC endpoints

### Adding New APIs
Create new API routes in `app/api/`:

```typescript
// app/api/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Your API logic here
  return NextResponse.json({ data: 'success' });
}
```

## 🎨 Customization

### Theming
Customize colors in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(221.2 83.2% 53.3%)", // Change primary color
        foreground: "hsl(210 40% 98%)",
      },
      // Add custom colors
    },
  },
},
```

### Adding New Tokens
Extend token support in `lib/web3.ts`:
```typescript
export const DEFAULT_TOKENS: Record<string, Token[]> = {
  ethereum: [
    {
      address: '0x...',
      symbol: 'CUSTOM',
      name: 'Custom Token',
      decimals: 18,
      chainId: 1,
    },
  ],
};
```

### Custom Components
Create reusable components in `components/`:
```typescript
// components/custom-feature.tsx
export function CustomFeature() {
  return (
    <div className="custom-component">
      {/* Your custom feature */}
    </div>
  );
}
```

## 📱 Mobile Optimization

### PWA Features
- Offline functionality
- Install to home screen
- Push notifications
- Background sync

### Mobile-Specific Optimizations
- Touch-friendly interface
- Haptic feedback support
- Mobile-optimized modals
- Responsive design

### iOS Specific
- Safari PWA support
- iOS safe area handling
- Touch ID / Face ID integration
- iOS share sheet integration

### Android Specific
- Chrome PWA features
- Android biometric API
- Material Design patterns
- Android share intent

## 🔄 State Management

### Zustand Store
The app uses Zustand for state management:

```typescript
// store/walletStore.ts
export const useWalletStore = create<WalletStore>()(
  persist(
    immer((set, get) => ({
      // State and actions
    })),
    {
      name: 'wallet-store',
      // Persistence configuration
    }
  )
);
```

### Key State Features
- Persistent wallet storage
- Encrypted sensitive data
- Optimistic updates
- Background synchronization

## 🧩 Extensions

### Adding New Blockchains
1. **Add chain configuration** in `types/wallet.ts`
2. **Implement web3 service** in `lib/web3.ts`
3. **Update UI components** to support new chain
4. **Add RPC endpoints** and explorers

### Hardware Wallet Integration
```typescript
// lib/hardware-wallet.ts
export class HardwareWalletService {
  async connectLedger() {
    // Ledger integration
  }
  
  async connectTrezor() {
    // Trezor integration
  }
}
```

### DeFi Protocol Integration
```typescript
// lib/defi.ts
export class DeFiService {
  async getStakingRewards(address: string) {
    // Staking integration
  }
  
  async getLiquidityPositions(address: string) {
    // LP integration
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**Type Errors**
```bash
# Run type checking
npm run type-check
```

**Environment Variables Not Loading**
- Ensure `.env.local` exists
- Check variable names start with `NEXT_PUBLIC_` for client-side
- Restart development server

**RPC Connection Issues**
- Verify RPC endpoints are accessible
- Check API key validity
- Monitor rate limits

**Wallet Connection Problems**
- Clear browser storage
- Check network connectivity
- Verify chain configuration

### Debug Mode
Enable debug logging:
```env
NEXT_PUBLIC_DEBUG=true
```

### Performance Issues
- Enable React Strict Mode
- Use React DevTools Profiler
- Monitor network requests
- Check for memory leaks

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Disclaimer

This wallet is for educational and development purposes. For production use:

1. **Conduct thorough security audits**
2. **Use hardware wallets for large amounts**
3. **Enable all security features**
4. **Keep the app updated**
5. **Backup your recovery phrases securely**

**Never share your private keys or recovery phrases with anyone.**

## 🆘 Support

- 📧 Email: support@multichain-wallet.com
- 💬 Discord: [Join our community](https://discord.gg/multichain-wallet)
- 🐛 Issues: [GitHub Issues](https://github.com/your-username/multichain-wallet/issues)
- 📖 Docs: [Documentation](https://docs.multichain-wallet.com)

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Ethers.js](https://ethers.org/) - Ethereum library
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/) - Solana library
- [CoinGecko](https://coingecko.com/) - Market data API
- [Radix UI](https://radix-ui.com/) - Unstyled UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

Built with ❤️ by the MultiChain Wallet team
