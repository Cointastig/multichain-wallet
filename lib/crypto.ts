// Crypto utilities for wallet encryption and security
// WARNING: This is a simplified implementation for demo purposes
// In production, use proper encryption libraries and secure key management

const ENCRYPTION_KEY_STORAGE = 'wallet_encryption_key';

// Generate or retrieve encryption key
function getEncryptionKey(): string {
  let key = localStorage.getItem(ENCRYPTION_KEY_STORAGE);
  
  if (!key) {
    // Generate a new key (in production, derive from user password/PIN)
    key = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    localStorage.setItem(ENCRYPTION_KEY_STORAGE, key);
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

// Web Crypto API implementation (preferred for production)
async function webCryptoEncrypt(text: string, password: string): Promise<string> {
  try {
    // Derive key from password
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
    console.error('Web Crypto encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

async function webCryptoDecrypt(encryptedData: string, password: string): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
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
    console.error('Web Crypto decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

// Public API functions
export async function encrypt(text: string, password?: string): Promise<string> {
  // Use Web Crypto API if available and password provided
  if (crypto.subtle && password) {
    return await webCryptoEncrypt(text, password);
  }
  
  // Fallback to simple encryption (demo only)
  const key = password || getEncryptionKey();
  return xorEncrypt(text, key);
}

export async function decrypt(encryptedText: string, password?: string): Promise<string> {
  // Try Web Crypto API first if password provided
  if (crypto.subtle && password) {
    try {
      return await webCryptoDecrypt(encryptedText, password);
    } catch (error) {
      // Fallback to simple decryption
    }
  }
  
  // Fallback to simple decryption
  const key = password || getEncryptionKey();
  return xorDecrypt(encryptedText, key);
}

// Hash functions
export async function hashPassword(password: string, salt?: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + (salt || 'ctc_wallet_salt'));
  
  if (crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Simple hash fallback (not secure)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data[i];
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

// Generate secure random values
export function generateSecureRandom(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Mnemonic validation
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  return words.length === 12 || words.length === 15 || words.length === 18 || words.length === 21 || words.length === 24;
}

// Private key validation
export function validatePrivateKey(privateKey: string): boolean {
  // Remove 0x prefix if present
  const key = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;
  
  // Check if it's a valid hex string of correct length
  return /^[a-fA-F0-9]{64}$/.test(key);
}

// Key derivation utilities
export async function deriveKeyFromPassword(password: string, salt: string): Promise<string> {
  if (!crypto.subtle) {
    // Simple fallback
    return await hashPassword(password, salt);
  }
  
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const saltBuffer = encoder.encode(salt);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Derive key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );
  
  // Export key as raw bytes
  const exportedKey = await crypto.subtle.exportKey('raw', derivedKey);
  const keyArray = Array.from(new Uint8Array(exportedKey));
  return keyArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Secure storage utilities
export class SecureStorage {
  private static prefix = 'ctc_secure_';
  
  static async setItem(key: string, value: string, password?: string): Promise<void> {
    try {
      const encrypted = await encrypt(value, password);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      console.error('Secure storage set failed:', error);
      throw error;
    }
  }
  
  static async getItem(key: string, password?: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(this.prefix + key);
      if (!encrypted) return null;
      
      return await decrypt(encrypted, password);
    } catch (error) {
      console.error('Secure storage get failed:', error);
      return null;
    }
  }
  
  static removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  static clear(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix));
    keys.forEach(key => localStorage.removeItem(key));
  }
}

// PIN utilities
export class PINManager {
  private static readonly PIN_KEY = 'user_pin';
  private static readonly ATTEMPTS_KEY = 'pin_attempts';
  private static readonly LOCKOUT_KEY = 'pin_lockout';
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutes
  
  static async setPIN(pin: string): Promise<void> {
    const hashedPIN = await hashPassword(pin);
    localStorage.setItem(this.PIN_KEY, hashedPIN);
    this.resetAttempts();
  }
  
  static async verifyPIN(pin: string): Promise<boolean> {
    if (this.isLockedOut()) {
      throw new Error('Account is locked due to too many failed attempts');
    }
    
    const storedPIN = localStorage.getItem(this.PIN_KEY);
    if (!storedPIN) return false;
    
    const hashedPIN = await hashPassword(pin);
    const isValid = hashedPIN === storedPIN;
    
    if (isValid) {
      this.resetAttempts();
    } else {
      this.incrementAttempts();
    }
    
    return isValid;
  }
  
  static hasPIN(): boolean {
    return !!localStorage.getItem(this.PIN_KEY);
  }
  
  static removePIN(): void {
    localStorage.removeItem(this.PIN_KEY);
    this.resetAttempts();
  }
  
  private static getAttempts(): number {
    const attempts = localStorage.getItem(this.ATTEMPTS_KEY);
    return attempts ? parseInt(attempts, 10) : 0;
  }
  
  private static incrementAttempts(): void {
    const attempts = this.getAttempts() + 1;
    localStorage.setItem(this.ATTEMPTS_KEY, attempts.toString());
    
    if (attempts >= this.MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + this.LOCKOUT_DURATION;
      localStorage.setItem(this.LOCKOUT_KEY, lockoutUntil.toString());
    }
  }
  
  private static resetAttempts(): void {
    localStorage.removeItem(this.ATTEMPTS_KEY);
    localStorage.removeItem(this.LOCKOUT_KEY);
  }
  
  private static isLockedOut(): boolean {
    const lockoutUntil = localStorage.getItem(this.LOCKOUT_KEY);
    if (!lockoutUntil) return false;
    
    const lockoutTime = parseInt(lockoutUntil, 10);
    if (Date.now() > lockoutTime) {
      this.resetAttempts();
      return false;
    }
    
    return true;
  }
  
  static getRemainingLockoutTime(): number {
    const lockoutUntil = localStorage.getItem(this.LOCKOUT_KEY);
    if (!lockoutUntil) return 0;
    
    const lockoutTime = parseInt(lockoutUntil, 10);
    return Math.max(0, lockoutTime - Date.now());
  }
  
  static getRemainingAttempts(): number {
    return Math.max(0, this.MAX_ATTEMPTS - this.getAttempts());
  }
}

// Backup and recovery utilities
export class BackupManager {
  static async createBackup(walletData: any, password: string): Promise<string> {
    const backup = {
      version: '1.0.0',
      timestamp: Date.now(),
      data: walletData
    };
    
    return await encrypt(JSON.stringify(backup), password);
  }
  
  static async restoreBackup(backupData: string, password: string): Promise<any> {
    try {
      const decrypted = await decrypt(backupData, password);
      const backup = JSON.parse(decrypted);
      
      if (!backup.version || !backup.data) {
        throw new Error('Invalid backup format');
      }
      
      return backup.data;
    } catch (error) {
      throw new Error('Failed to restore backup: Invalid password or corrupted data');
    }
  }
  
  static async exportWallet(walletData: any, format: 'json' | 'encrypted' = 'encrypted'): Promise<string> {
    if (format === 'encrypted') {
      const password = prompt('Enter password to encrypt backup:');
      if (!password) throw new Error('Password required for encrypted backup');
      return await this.createBackup(walletData, password);
    }
    
    return JSON.stringify(walletData, null, 2);
  }
}
