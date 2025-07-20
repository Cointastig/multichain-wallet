// components/wallet-provider.tsx
'use client';

import { ReactNode } from 'react';
import { useWalletStore } from '@/store/walletStore';

interface WalletProviderProps {
  children: ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  // Initialize any wallet-specific providers here
  return <>{children}</>;
}

// components/theme-provider.tsx
'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        "fade-out": {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        "slide-in-from-top": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "slide-in-from-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-in-from-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "slide-out-to-top": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
        "slide-out-to-bottom": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
        "slide-out-to-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "slide-out-to-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "zoom-in": {
          "0%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
        "zoom-out": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(0.95)" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8,0,1,1)",
          },
          "50%": {
            transform: "none",
            animationTimingFunction: "cubic-bezier(0,0,0.2,1)",
          },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        "fade-out": "fade-out 0.2s ease-out",
        "slide-in-from-top": "slide-in-from-top 0.2s ease-out",
        "slide-in-from-bottom": "slide-in-from-bottom 0.2s ease-out",
        "slide-in-from-left": "slide-in-from-left 0.2s ease-out",
        "slide-in-from-right": "slide-in-from-right 0.2s ease-out",
        "slide-out-to-top": "slide-out-to-top 0.2s ease-out",
        "slide-out-to-bottom": "slide-out-to-bottom 0.2s ease-out",
        "slide-out-to-left": "slide-out-to-left 0.2s ease-out",
        "slide-out-to-right": "slide-out-to-right 0.2s ease-out",
        "zoom-in": "zoom-in 0.2s ease-out",
        "zoom-out": "zoom-out 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
        spin: "spin 1s linear infinite",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Consolas", "Monaco", "monospace"],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/forms"),
  ],
}

// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.75rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    @apply bg-muted;
  }

  ::-webkit-scrollbar-thumb {
    @apply bg-muted-foreground/30 rounded-full;
  }

  ::-webkit-scrollbar-thumb:hover {
    @apply bg-muted-foreground/50;
  }

  /* Focus styles */
  .focus-ring {
    @apply focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background;
  }

  /* Selection styles */
  ::selection {
    @apply bg-primary/20;
  }

  /* Animations */
  @keyframes gradient-x {
    0%, 100% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(100%);
    }
  }

  .animate-gradient-x {
    animation: gradient-x 3s ease infinite;
  }

  /* Safe area insets for mobile */
  .safe-top {
    padding-top: env(safe-area-inset-top);
  }

  .safe-bottom {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .safe-left {
    padding-left: env(safe-area-inset-left);
  }

  .safe-right {
    padding-right: env(safe-area-inset-right);
  }

  /* Mobile optimizations */
  @media (max-width: 768px) {
    .container {
      @apply px-4;
    }
  }

  /* Prevent zoom on iOS */
  input, select, textarea {
    font-size: 16px;
  }

  @media (max-width: 768px) {
    input, select, textarea {
      font-size: 16px;
      transform-origin: top left;
    }
  }

  /* PWA specific styles */
  @media (display-mode: standalone) {
    body {
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }

    .selectable {
      user-select: text;
      -webkit-user-select: text;
    }
  }

  /* Touch device optimizations */
  @media (hover: none) and (pointer: coarse) {
    .hover\:scale-105:hover {
      transform: none;
    }
    
    .hover\:shadow-lg:hover {
      box-shadow: none;
    }
  }

  /* Dark mode specific adjustments */
  .dark {
    color-scheme: dark;
  }

  .dark img {
    filter: brightness(0.9);
  }

  /* Glassmorphism effect */
  .glass {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .dark .glass {
    background: rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Gradient backgrounds */
  .gradient-bg {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .gradient-text {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  /* Loading skeleton */
  .skeleton {
    @apply animate-pulse bg-muted rounded;
  }

  /* Shimmer effect */
  .shimmer {
    position: relative;
    overflow: hidden;
  }

  .shimmer::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.6),
      transparent
    );
    animation: shimmer 2s infinite;
  }

  .dark .shimmer::after {
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent
    );
  }

  /* Button enhancements */
  .btn-haptic {
    transition: all 0.1s ease;
  }

  .btn-haptic:active {
    transform: scale(0.98);
  }

  /* Card hover effects */
  .card-hover {
    transition: all 0.2s ease;
  }

  .card-hover:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }

  .dark .card-hover:hover {
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }

  /* Loading states */
  .loading-dots {
    display: inline-block;
  }

  .loading-dots::after {
    content: '';
    animation: loading-dots 1.5s infinite;
  }

  @keyframes loading-dots {
    0%, 20% { content: ''; }
    40% { content: '.'; }
    60% { content: '..'; }
    80%, 100% { content: '...'; }
  }
}

@layer components {
  /* Custom component styles */
  .wallet-card {
    @apply relative overflow-hidden rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md;
  }

  .wallet-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .wallet-card:hover::before {
    opacity: 1;
  }

  .transaction-item {
    @apply flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer;
  }

  .token-item {
    @apply flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer;
  }

  .market-item {
    @apply flex items-center justify-between p-4 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors cursor-pointer;
  }

  .stat-card {
    @apply p-4 rounded-lg border bg-card text-center;
  }

  .action-button {
    @apply flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer text-sm;
  }

  .network-badge {
    @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary;
  }

  .status-badge {
    @apply inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium;
  }

  .status-badge.confirmed {
    @apply bg-green-100 text-green-700;
  }

  .status-badge.pending {
    @apply bg-yellow-100 text-yellow-700;
  }

  .status-badge.failed {
    @apply bg-red-100 text-red-700;
  }

  .dark .status-badge.confirmed {
    @apply bg-green-900/30 text-green-400;
  }

  .dark .status-badge.pending {
    @apply bg-yellow-900/30 text-yellow-400;
  }

  .dark .status-badge.failed {
    @apply bg-red-900/30 text-red-400;
  }
}

@layer utilities {
  /* Utility classes */
  .text-gradient {
    @apply bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent;
  }

  .border-gradient {
    background: linear-gradient(hsl(var(--background)), hsl(var(--background))) padding-box,
                linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary))/50) border-box;
    border: 1px solid transparent;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .touch-action-none {
    touch-action: none;
  }

  .touch-action-pan-x {
    touch-action: pan-x;
  }

  .touch-action-pan-y {
    touch-action: pan-y;
  }

  /* Responsive utilities */
  .container-padding {
    @apply px-4 sm:px-6 lg:px-8;
  }

  .section-padding {
    @apply py-8 sm:py-12 lg:py-16;
  }

  /* Animation utilities */
  .animate-in {
    animation: fade-in 0.2s ease-out;
  }

  .animate-out {
    animation: fade-out 0.2s ease-out;
  }

  .animate-slide-in-from-top {
    animation: slide-in-from-top 0.3s ease-out;
  }

  .animate-slide-in-from-bottom {
    animation: slide-in-from-bottom 0.3s ease-out;
  }
}

/* Print styles */
@media print {
  .no-print {
    display: none !important;
  }

  body {
    -webkit-print-color-adjust: exact;
    color-adjust: exact;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .card, .button {
    border-width: 2px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

// public/manifest.json
{
  "name": "MultiChain Wallet - Professional Crypto Management",
  "short_name": "MultiChain Wallet",
  "description": "Secure, feature-rich multi-chain cryptocurrency wallet supporting Ethereum, Bitcoin, Solana, and more.",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "orientation": "portrait-primary",
  "scope": "/",
  "lang": "en",
  "dir": "ltr",
  "categories": ["finance", "cryptocurrency", "productivity", "utilities"],
  "prefer_related_applications": false,
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Desktop wallet dashboard"
    },
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "390x844",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile wallet interface"
    }
  ],
  "shortcuts": [
    {
      "name": "Send Crypto",
      "short_name": "Send",
      "description": "Send cryptocurrency to another address",
      "url": "/?action=send",
      "icons": [
        {
          "src": "/icons/send-icon.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Receive Crypto",
      "short_name": "Receive", 
      "description": "Show QR code to receive cryptocurrency",
      "url": "/?action=receive",
      "icons": [
        {
          "src": "/icons/receive-icon.png",
          "sizes": "96x96",
          "type": "image/png"
        }
      ]
    },
    {
      "name": "Swap Tokens",
      "short_name": "Swap",
      "description": "Exchange one cryptocurrency for another",
      "url": "/?action=swap",
      "icons": [
        {
          "src": "/icons/swap-icon.png",
          "sizes": "96x96", 
          "type": "image/png"
        }
      ]
    }
  ],
  "related_applications": [],
  "features": [
    "multi-chain-support",
    "secure-storage",
    "biometric-authentication",
    "real-time-prices",
    "defi-integration",
    "nft-support",
    "transaction-history",
    "address-book",
    "portfolio-tracking",
    "market-data"
  ],
  "launch_handler": {
    "client_mode": "navigate-existing"
  },
  "handle_links": "preferred",
  "edge_side_panel": {
    "preferred_width": 400
  },
  "protocol_handlers": [
    {
      "protocol": "ethereum",
      "url": "/?protocol=ethereum&data=%s"
    },
    {
      "protocol": "bitcoin",
      "url": "/?protocol=bitcoin&data=%s"
    }
  ]
}

// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
