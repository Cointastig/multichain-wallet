// lib/crypto.ts
// Simplified crypto utilities optimized for Vercel deployment

const ENCRYPTION_KEY_STORAGE = 'wallet_encryption_key';

// Generate or retrieve encryption key
function getEncryptionKey(): string {
  if (typeof window === 'undefined') return 'fallback-key';
  
  let key = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  
  if (!key) {
    try {
      // Generate a new key
      key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      localStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
    } catch (error) {
      // Fallback for environments without crypto
      key = Math.random().toString(36).substring(2, 34);
      localStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
    }
  }
  
  return key;
}

// Simple XOR encryption (for demo purposes only)
function xorEncrypt(text: string, key: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const keyChar = key.charCodeAt(i % key.length);
    const textChar = text.charCodeAt(i);
    result += String.fromCharCode(textChar ^ keyChar);
  }
  return btoa(result); // Base64 encode
}

function xorDecrypt(encrypted: string, key: string): string {
  try {
    const decoded = atob(encrypted); // Base64 decode
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const keyChar = key.charCodeAt(i % key.length);
      const encryptedChar = decoded.charCodeAt(i);
      result += String.fromCharCode(encryptedChar ^ keyChar);
    }
    return result;
  } catch (error) {
    console.error('Decryption failed:', error);
    return '';
  }
}

// Web Crypto API implementation with fallbacks
async function webCryptoEncrypt(text: string, password: string): Promise<string> {
  // Check if Web Crypto API is available
  if (typeof window === 'undefined' || !crypto.subtle) {
    return xorEncrypt(text, password);
  }

  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const passwordBuffer = encoder.encode(password);
    
    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Generate salt
    const salt = crypto.getRandomValues(new Uint8Array(16));
    
    // Derive encryption key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.warn('Web Crypto encryption failed, falling back to simple encryption:', error);
    return xorEncrypt(text, password);
  }
}

async function webCryptoDecrypt(encryptedData: string, password: string): Promise<string> {
  // Check if Web Crypto API is available
  if (typeof window === 'undefined' || !crypto.subtle) {
    return xorDecrypt(encryptedData, password);
  }

  try {
    // Try to determine if this is web crypto encrypted or simple encrypted
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // If data is too short for web crypto format, it's probably simple encrypted
    if (combined.length < 28) {
      return xorDecrypt(encryptedData, password);
    }
    
    // Extract components
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    
    // Derive key from password
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Decrypt data
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    // Return as string
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.warn('Web Crypto decryption failed, trying simple decryption:', error);
    return xorDecrypt(encryptedData, password);
  }
}

// Public API functions with fallbacks
export async function encrypt(text: string, password?: string): Promise<string> {
  const key = password || getEncryptionKey();
  
  // Use Web Crypto API if available
  if (typeof window !== 'undefined' && crypto.subtle && password) {
    return await webCryptoEncrypt(text, password);
  }
  
  // Fallback to simple encryption
  return xorEncrypt(text, key);
}

export async function decrypt(encryptedText: string, password?: string): Promise<string> {
  const key = password || getEncryptionKey();
  
  // Try Web Crypto API first if password provided
  if (typeof window !== 'undefined' && crypto.subtle && password) {
    return await webCryptoDecrypt(encryptedText, password);
  }
  
  // Fallback to simple decryption
  return xorDecrypt(encryptedText, key);
}

// Hash functions with fallbacks
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const data = password + (salt || 'ctc_wallet_salt');
  
  if (typeof window !== 'undefined' && crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.warn('SHA-256 failed, using fallback hash');
    }
  }
  
  // Simple hash fallback
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

// Generate secure random values with fallback
export function generateSecureRandom(length: number): string {
  try {
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(array);
    } else {
      // Fallback for server-side or environments without crypto
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    // Final fallback
    return Math.random().toString(36).substring(2, 2 + length);
  }
}

// Export remaining functions with simplified implementations
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12 || words.length === 15 || words.length === 18 || words.length === 21 || words.length === 24;
}

export function validatePrivateKey(privateKey: string): boolean {
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  return /^[a-fA-F0-9]{64}$/.test(key);
}
