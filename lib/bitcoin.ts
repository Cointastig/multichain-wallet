import * as bitcoin from 'bitcoinjs-lib';
import { mnemonicToSeedSync } from 'bip39';
import HDKey from 'hdkey';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';

const ECPair = ECPairFactory(ecc);

export interface BitcoinWallet {
  address: string;
  privateKey: string;
  publicKey: string;
  type: 'legacy' | 'segwit' | 'nativeSegwit';
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  scriptPubKey: string;
  address: string;
  confirmations: number;
}

export class BitcoinService {
  private static network = bitcoin.networks.bitcoin;
  private static apiBaseUrl = 'https://blockstream.info/api';

  static createWalletFromMnemonic(
    mnemonic: string,
    type: 'legacy' | 'segwit' | 'nativeSegwit' = 'nativeSegwit'
  ): BitcoinWallet {
    const seed = mnemonicToSeedSync(mnemonic);
    const hdkey = HDKey.fromMasterSeed(seed);
    
    // BIP44 path for Bitcoin
    const path = type === 'legacy' ? "m/44'/0'/0'/0/0" : 
                 type === 'segwit' ? "m/49'/0'/0'/0/0" : 
                 "m/84'/0'/0'/0/0"; // Native SegWit
    
    const child = hdkey.derive(path);
    const keyPair = ECPair.fromPrivateKey(child.privateKey);
    
    let address: string;
    
    switch (type) {
      case 'legacy':
        const p2pkh = bitcoin.payments.p2pkh({ 
          pubkey: keyPair.publicKey,
          network: this.network 
        });
        address = p2pkh.address!;
        break;
        
      case 'segwit':
        const p2sh = bitcoin.payments.p2sh({
          redeem: bitcoin.payments.p2wpkh({ 
            pubkey: keyPair.publicKey,
            network: this.network 
          }),
          network: this.network
        });
        address = p2sh.address!;
        break;
        
      case 'nativeSegwit':
      default:
        const p2wpkh = bitcoin.payments.p2wpkh({ 
          pubkey: keyPair.publicKey,
          network: this.network 
        });
        address = p2wpkh.address!;
        break;
    }
    
    return {
      address,
      privateKey: child.privateKey.toString('hex'),
      publicKey: keyPair.publicKey.toString('hex'),
      type
    };
  }

  static async getBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/address/${address}`);
      const data = await response.json();
      
      const balanceSats = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
      return (balanceSats / 100000000).toString(); // Convert satoshis to BTC
    } catch (error) {
      console.error('Error getting Bitcoin balance:', error);
      return '0';
    }
  }

  static async getUTXOs(address: string): Promise<UTXO[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/address/${address}/utxo`);
      const utxos = await response.json();
      
      return utxos.map((utxo: any) => ({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        scriptPubKey: '', // Would need additional API call
        address,
        confirmations: utxo.status.confirmed ? utxo.status.block_height : 0,
      }));
    } catch (error) {
      console.error('Error getting UTXOs:', error);
      return [];
    }
  }

  static async sendTransaction(
    privateKey: string,
    to: string,
    amount: string,
    feeRate?: number
  ): Promise<string> {
    try {
      const keyPair = ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex'));
      
      // Determine address type from private key
      const p2wpkh = bitcoin.payments.p2wpkh({ 
        pubkey: keyPair.publicKey,
        network: this.network 
      });
      const fromAddress = p2wpkh.address!;
      
      // Get UTXOs
      const utxos = await this.getUTXOs(fromAddress);
      if (utxos.length === 0) {
        throw new Error('No UTXOs available');
      }
      
      // Calculate amount in satoshis
      const amountSats = Math.floor(parseFloat(amount) * 100000000);
      
      // Get fee rate if not provided
      if (!feeRate) {
        const feeResponse = await fetch('https://mempool.space/api/v1/fees/recommended');
        const fees = await feeResponse.json();
        feeRate = fees.fastestFee;
      }
      
      // Build transaction
      const psbt = new bitcoin.Psbt({ network: this.network });
      
      let inputValue = 0;
      for (const utxo of utxos) {
        if (inputValue >= amountSats) break;
        
        // Get raw transaction for input
        const txResponse = await fetch(`${this.apiBaseUrl}/tx/${utxo.txid}/hex`);
        const txHex = await txResponse.text();
        
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: p2wpkh.output!,
            value: utxo.value,
          },
        });
        
        inputValue += utxo.value;
      }
      
      // Add output
      psbt.addOutput({
        address: to,
        value: amountSats,
      });
      
      // Calculate fee
      const estimatedSize = psbt.inputCount * 148 + psbt.outputCount * 34 + 10;
      const fee = estimatedSize * feeRate;
      
      // Add change output if necessary
      const change = inputValue - amountSats - fee;
      if (change > 546) { // Dust limit
        psbt.addOutput({
          address: fromAddress,
          value: change,
        });
      }
      
      // Sign all inputs
      psbt.signAllInputs(keyPair);
      psbt.finalizeAllInputs();
      
      // Get transaction hex
      const tx = psbt.extractTransaction();
      const txHex = tx.toHex();
      
      // Broadcast transaction
      const broadcastResponse = await fetch(`${this.apiBaseUrl}/tx`, {
        method: 'POST',
        body: txHex,
      });
      
      if (!broadcastResponse.ok) {
        const error = await broadcastResponse.text();
        throw new Error(`Broadcast failed: ${error}`);
      }
      
      return tx.getId();
    } catch (error) {
      console.error('Error sending Bitcoin transaction:', error);
      throw error;
    }
  }

  static async estimateGas(to: string, amount: string): Promise<string> {
    try {
      // Get current fee rates
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      const fees = await response.json();
      
      // Estimate transaction size (1 input, 2 outputs for typical transaction)
      const estimatedVSize = 141; // vBytes for native segwit
      const feeRate = fees.fastestFee; // sat/vB
      const totalFeeSats = estimatedVSize * feeRate;
      
      return (totalFeeSats / 100000000).toString(); // Convert to BTC
    } catch (error) {
      console.error('Error estimating Bitcoin fee:', error);
      return '0.0001'; // Default fee
    }
  }

  static async getTransactionHistory(address: string, limit = 25): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/address/${address}/txs`);
      const transactions = await response.json();
      
      return transactions.slice(0, limit).map((tx: any) => ({
        hash: tx.txid,
        timestamp: tx.status.block_time || Date.now() / 1000,
        confirmations: tx.status.confirmed ? tx.status.block_height : 0,
        fee: tx.fee,
        value: this.getTransactionValue(tx, address),
        type: this.getTransactionType(tx, address),
      }));
    } catch (error) {
      console.error('Error getting Bitcoin transaction history:', error);
      return [];
    }
  }

  private static getTransactionValue(tx: any, address: string): number {
    let value = 0;
    
    // Calculate received amount
    for (const vout of tx.vout) {
      if (vout.scriptpubkey_address === address) {
        value += vout.value;
      }
    }
    
    // Calculate sent amount
    for (const vin of tx.vin) {
      if (vin.prevout && vin.prevout.scriptpubkey_address === address) {
        value -= vin.prevout.value;
      }
    }
    
    return Math.abs(value);
  }

  private static getTransactionType(tx: any, address: string): 'send' | 'receive' {
    // Check if any input is from our address
    for (const vin of tx.vin) {
      if (vin.prevout && vin.prevout.scriptpubkey_address === address) {
        return 'send';
      }
    }
    return 'receive';
  }

  static async getCurrentBlockHeight(): Promise<number> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/blocks/tip/height`);
      const height = await response.text();
      return parseInt(height);
    } catch (error) {
      console.error('Error getting block height:', error);
      return 0;
    }
  }

  static async getFeeEstimates(): Promise<{
    fastest: number;
    halfHour: number;
    hour: number;
    economy: number;
    minimum: number;
  }> {
    try {
      const response = await fetch('https://mempool.space/api/v1/fees/recommended');
      const fees = await response.json();
      
      return {
        fastest: fees.fastestFee,
        halfHour: fees.halfHourFee,
        hour: fees.hourFee,
        economy: fees.economyFee,
        minimum: fees.minimumFee,
      };
    } catch (error) {
      console.error('Error getting fee estimates:', error);
      return {
        fastest: 20,
        halfHour: 10,
        hour: 5,
        economy: 2,
        minimum: 1,
      };
    }
  }

  static validateAddress(address: string): boolean {
    try {
      // Try to decode as various address types
      const isP2PKH = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
      const isP2SH = /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address);
      const isBech32 = /^bc1[a-z0-9]{39,59}$/.test(address);
      
      return isP2PKH || isP2SH || isBech32;
    } catch (error) {
      return false;
    }
  }

  static getAddressType(address: string): 'legacy' | 'segwit' | 'nativeSegwit' | 'unknown' {
    if (/^[1][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
      return 'legacy';
    } else if (/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) {
      return 'segwit';
    } else if (/^bc1[a-z0-9]{39,59}$/.test(address)) {
      return 'nativeSegwit';
    }
    return 'unknown';
  }
}

// Re-export for backward compatibility
export default BitcoinService;
