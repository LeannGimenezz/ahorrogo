const { Buffer } = require('buffer');
const crypto = require('crypto');
const bip39 = require('bip39');
const { HDNodeWallet, Mnemonic } = require('ethers');
const { privateToAddress } = require('ethereumjs-util');

const BASE64_STRING = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';
const EXPECTED_ADDRESS = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';

function bufferToHex(buf) {
    return '0x'+ buf.toString('hex');
}

function deriveAddress(privateKey) {
    try {
        const key = typeof privateKey === 'string' && !privateKey.startsWith('0x') ? Buffer.from(privateKey, 'hex') : 
                    typeof privateKey === 'string' && privateKey.startsWith('0x') ? Buffer.from(privateKey.slice(2), 'hex') :
                    privateKey;
        const addressBuf = privateToAddress(key);
        return '0x' + addressBuf.toString('hex');
    } catch (e) {
        return null;
    }
}

const decoded = Buffer.from(BASE64_STRING, 'base64');
console.log('='.repeat(80));
console.log('Trust Wallet Private Key Decoder v3');
console.log('='.repeat(80));
console.log(`Decoded length: ${decoded.length} bytes`);
console.log(`Hex: ${bufferToHex(decoded)}`);
console.log(`Expected address: ${EXPECTED_ADDRESS}`);

const results = [];

// DERIVATION PATHSfor Ethereum
const DERIVATION_PATHS = [
    "m/44'/60'/0'/0/0",  // Standard Ethereum
    "m/44'/60'/0'/0",     // Alternative
    "m/44'/60'/0'",       // Account only
    "m/44'/60'/0/0",      // No hardened
    "m/0'/0'/0'",         // Simple
    "m/44'/60'",          // Root Ethereum
    "m/44'/60'/0'/0/1",   // Second address
    "m/44'/60'/1'/0/0",   // Second account
];

console.log('\n' + '='.repeat(80));
console.log('ATTEMPT 1: Direct 32-byte slices as private keys');
console.log('='.repeat(80));

// Sliding window - try every 32-byte slice
for (let i = 0; i <= decoded.length - 32; i++) {
    const slice = decoded.slice(i, i + 32);
    const addr = deriveAddress(slice);
    if (addr) {
        const match = addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
        if (match) {
            console.log(`\n✓✓✓ FOUND at offset ${i}!`);
            console.log(`Private Key: ${bufferToHex(slice)}`);
            console.log(`Address: ${addr}`);
            results.push({ desc: `Offset ${i}`, key: bufferToHex(slice), address: addr, match: true });
        }
    }
}

if (results.filter(r => r.match).length === 0) {
    console.log('No match found in direct slices.');
}

console.log('\n' + '='.repeat(80));
console.log('ATTEMPT 2: BIP-39 Mnemonic derivations');
console.log('='.repeat(80));

// Try entropy-to-mnemonic conversions
const entropyLengths = [16, 20, 24, 28, 32];
const offsets = [
    { name: 'start', offset: 0 },
    { name: 'bytes 32-64', offset: 32 },
    { name: 'bytes 64-end', offset: 64 },
];

for (const len of entropyLengths) {
    for (const { name, offset } of offsets) {
        if (offset + len > decoded.length) continue;
        
        const entropy = decoded.slice(offset, offset + len);
        try {
            const mnemonic = bip39.entropyToMnemonic(entropy);
            console.log(`\nEntropy ${len}B @ ${name}: "${mnemonic.split(' ').slice(0, 4).join(' ')}..."`);
            
            for (const path of DERIVATION_PATHS) {
                try {
                    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
                    const match = wallet.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
                    if (match) {
                        console.log(`✓✓✓ MATCH with path ${path}!`);
                        console.log(`Mnemonic: "${mnemonic}"`);
                        console.log(`Private Key: ${wallet.privateKey}`);
                        console.log(`Address: ${wallet.address}`);
                        results.push({ desc: `Mnemonic(${len}B@${name}) ${path}`, key: wallet.privateKey, address: wallet.address, match: true });
                    }
                } catch (e) {}
            }
        } catch (e) {}
    }
}

console.log('\n' + '='.repeat(80));
console.log('ATTEMPT 3: Modified entropy (reversed, XOR patterns)');
console.log('='.repeat(80));

// Try reversed bytes
const reversed = Buffer.from(decoded).reverse();
console.log('\nTrying reversed bytes...');
for (let i = 0; i <= reversed.length - 32; i++) {
    const slice = reversed.slice(i, i + 32);
    const addr = deriveAddress(slice);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ FOUND reversed at offset ${i}!`);
        console.log(`Private Key: ${bufferToHex(slice)}`);
        results.push({ desc: `Reversed offset ${i}`, key: bufferToHex(slice), address: addr, match: true });
    }
}

// Try last32 bytes as-is (already tried, but let's confirm)
console.log('\n' + '='.repeat(80));
console.log('ATTEMPT 4: Trust Wallet specific formats');
console.log('='.repeat(80));

// The 96 bytes might be structured as:
// -16 bytes IV + 80 bytes ciphertext (AES-256-CBC encrypted)
// - 16 bytes salt + 16 bytes IV + 64 bytes ciphertext (PBKDF2 + AES)
// - 64 bytes xprv + 32 bytes something extra

console.log('\nPossible encrypted format: IV (16) + ciphertext (80)');
console.log('Possible PBKDF2 format: Salt (16) + IV (16) + ciphertext (64)');
console.log('Need password to decrypt.\n');

// Let's also try common Trust Wallet derivation paths with mnemonic
console.log('\n' + '='.repeat(80));
console.log('ATTEMPT 5: Full mnemonic search on first 32 bytes');
console.log('='.repeat(80));

const entropy32 = decoded.slice(0, 32);
try {
    const mnemonic = bip39.entropyToMnemonic(entropy32);
    console.log(`Mnemonic (24 words): "${mnemonic}"`);
    
    // Try common paths
    for (const path of DERIVATION_PATHS) {
        try {
            const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
            console.log(`  ${path}: ${wallet.address}`);
            if (wallet.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
                console.log(`✓✓✓ MATCH!`);
                results.push({ desc: `First 32B mnemonic ${path}`, key: wallet.privateKey, address: wallet.address, match: true });
            }
        } catch (e) {}
    }
    
    // Also try without derivation path
    const walletNoPath = HDNodeWallet.fromPhrase(mnemonic);
    console.log(`  (no path): ${walletNoPath.address}`);
    if (walletNoPath.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        results.push({ desc: 'First 32B mnemonic (no path)', key: walletNoPath.privateKey, address: walletNoPath.address, match: true });
    }
} catch (e) {
    console.log(`Error: ${e.message}`);
}

// SUMMARY
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const matches = results.filter(r => r.match);
if (matches.length > 0) {
    console.log('\n✓ FOUND MATCHING KEY(S):');
    matches.forEach((m, i) => {
        console.log(`\n${i + 1}. ${m.desc}`);
        console.log(`   Private Key: ${m.key}`);
        console.log(`   Address: ${m.address}`);
    });
} else {
    console.log('\n✗ NO MATCH FOUND');
    console.log('\nAll tested derivations produced different addresses than expected.');
    console.log('\nPOSSIBLE REASONS:');
    console.log('1. The base64 string is ENCRYPTED and requires a password');
    console.log('2. Trust Wallet uses a non-standard format we don\'t recognize');
    console.log('3. The address provided doesn\'t match this key');
    console.log('\nNEXT STEPS:');
    console.log('- Ask user for encryption password (if any)');
    console.log('- Compare with original mnemonic phrase');
    console.log('- Check if this is the correct backup format for Trust Wallet');
}

process.exit(0);