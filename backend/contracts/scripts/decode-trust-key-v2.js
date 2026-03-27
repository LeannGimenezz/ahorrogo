const { Buffer } = require('buffer');
const crypto = require('crypto');
const bip39 = require('bip39');
const { HDKey } = require('hdkey');
const { privateToAddress } = require('ethereumjs-util');
const bs58 = require('bs58');

const BASE64_STRING = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';
const EXPECTED_ADDRESS = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';

function bufferToHex(buf) {
    return '0x' + buf.toString('hex');
}

function deriveAddress(privateKey) {
    try {
        const addressBuf = privateToAddress(privateKey);
        return '0x' + addressBuf.toString('hex');
    } catch (e) {
        return null;
    }
}

const decoded = Buffer.from(BASE64_STRING, 'base64');
console.log('='.repeat(80));
console.log('Trust Wallet Private Key Decoder - HD Wallet Interpretations');
console.log('='.repeat(80));
console.log(`Decoded length: ${decoded.length} bytes`);

const results = [];

constDERIVATION_PATHS = [
    "m/44'/60'/0'/0/0",
    "m/44'/60'/0'/0",
    "m/44'/60'/0'",
    "m/44'/60'/0/0",
    "m/44'/60'/0/0/0",
    "m/44'/60'/0",
    "m/0'/0'/0'",
    "m/44'/60'",
];

console.log('\n=== Attempt: Using first 64 bytes as BIP-32 master seed ===');
try {
    const seed64 = decoded.slice(0, 64);
    const hdkey = HDKey.fromMasterSeed(seed64);
    
    for (const path of DERIVATION_PATHS) {
        try {
            const derived = hdkey.derive(path);
            const privKey = derived.privateKey;
            if (privKey) {
                const addr = deriveAddress(privKey);
                const match = addr?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
                console.log(`Path ${path}: ${addr}${match ? ' ✓ MATCH!' : ''}`);
                results.push({ desc: `Seed64 ${path}`, key: bufferToHex(privKey), address: addr, match });
            }
        } catch (e) {
            console.log(`Path ${path}: Error - ${e.message}`);
        }
    }
} catch (e) {
    console.log(`Error: ${e.message}`);
}

console.log('\n=== Attempt: Using all 96 bytes as BIP-32 seed (non-standard) ===');
try {
    const hdkey96 = HDKey.fromMasterSeed(decoded);
    for (const path of DERIVATION_PATHS) {
        try {
            const derived = hdkey96.derive(path);
            const privKey = derived.privateKey;
            if (privKey) {
                const addr = deriveAddress(privKey);
                const match = addr?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
                console.log(`Path ${path}: ${addr}${match ? ' ✓ MATCH!' : ''}`);
                results.push({ desc: `Seed96 ${path}`, key: bufferToHex(privKey), address: addr, match });
            }
        } catch (e) {
            console.log(`Path ${path}: Error - ${e.message}`);
        }
    }
} catch (e) {
    console.log(`Error: ${e.message}`);
}

console.log('\n=== Attempt: Using first 32 bytes as BIP-32 seed ===');
try {
    const seed32 = decoded.slice(0, 32);
    const hdkey32 = HDKey.fromMasterSeed(seed32);
    for (const path of DERIVATION_PATHS) {
        try {
            const derived = hdkey32.derive(path);
            const privKey = derived.privateKey;
            if (privKey) {
                const addr = deriveAddress(privKey);
                const match = addr?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
                console.log(`Path ${path}: ${addr}${match ? ' ✓ MATCH!' : ''}`);
                results.push({ desc: `Seed32 ${path}`, key: bufferToHex(privKey), address: addr, match });
            }
        } catch (e) {
            console.log(`Path ${path}: Error - ${e.message}`);
        }
    }
} catch (e) {
    console.log(`Error: ${e.message}`);
}

console.log('\n=== Attempt: Converting bytes to BIP-39 mnemonic ===');
// Try converting each slice to mnemonic
const slicesToTry = [
    { name: 'first 32', data: decoded.slice(0, 32) },
    { name: 'first 64', data: decoded.slice(0, 64) },
    { name: 'bytes 32-96', data: decoded.slice(32) },
];

for (const slice of slicesToTry) {
    try {
        // Check if valid entropy length for bip39 (16, 20, 24, 28, 32 bytes)
        if ([16,20, 24, 28, 32].includes(slice.data.length)) {
            const mnemonic = bip39.entropyToMnemonic(slice.data);
            console.log(`\n${slice.name} bytes as entropy -> mnemonic:`);
            console.log(`"${mnemonic}"`);
            
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const hdkey = HDKey.fromMasterSeed(seed);
            
            for (const path of DERIVATION_PATHS.slice(0,3)) {
                try {
                    const derived = hdkey.derive(path);
                    const privKey = derived.privateKey;
                    if (privKey) {
                        const addr = deriveAddress(privKey);
                        const match = addr?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
                        console.log(`  Path ${path}: ${addr}${match ? ' ✓ MATCH!' : ''}`);
                        results.push({ desc: `Mnemonic(${slice.name}) ${path}`, key: bufferToHex(privKey), address: addr, match });
                    }
                } catch (e) {}
            }
        } else {
            console.log(`${slice.name}: Not a valid entropy length (${slice.data.length} bytes)`);
        }
    } catch (e) {
        console.log(`${slice.name}: ${e.message}`);
    }
}

console.log('\n=== Attempt: Raw bytes as xpriv (extended private key) ===');
// Try to interpret as BIP-32 extended key directly
// BIP-32 xpriv format: version(4) + depth(1) + fingerprint(4) + child_num(4) + chain_code(32) + key(33)
// Total: 78 bytes, but we have 96

// Try treating first 78 bytes as xpriv
try {
    // Build xpriv from bytes (versionprefix for mainnet xpriv)
    const version = Buffer.from('0488ade4', 'hex'); // xpriv version
    const depth = Buffer.from('00', 'hex');
    const fingerprint = Buffer.from('00000000', 'hex');
    const childNum = Buffer.from('00000000', 'hex');
    
    // Maybe first 32 bytes is key, next 32 is chain code
    const keyBytes = decoded.slice(0, 32);
    const chainCode = decoded.slice(32, 64);
    
    const xprivBytes = Buffer.concat([
        version,
        depth,
        fingerprint,
        childNum,
        chainCode,
        Buffer.from('00', 'hex'), // private key prefix
        keyBytes
    ]);
    
    const xpriv = 'xprv' + bs58.encode(xprivBytes);
    console.log(`Builtxpriv: ${xpriv.slice(0, 30)}...`);
    
    const hdkey = HDKey.fromExtendedKey(xpriv);
    console.log(`Derived address: ${deriveAddress(hdkey.privateKey)}`);
    
    for (const path of ["m/0", "m/0'/0'/0'", "m/44'/60'/0'/0/0"]) {
        try {
            const derived = hdkey.derive(path);
            const privKey = derived.privateKey;
            if (privKey) {
                const addr = deriveAddress(privKey);
                const match = addr?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase();
                console.log(`Path ${path}: ${addr}${match ? ' ✓ MATCH!' : ''}`);
                results.push({ desc: `xpriv ${path}`, key: bufferToHex(privKey), address: addr, match });
            }
        } catch (e) {}
    }
} catch (e) {
    console.log(`xpriv error: ${e.message}`);
}

console.log('\n=== Attempt: Trust Wallet specific - maybe encrypted ===');
// Trust Wallet sometimes encrypts keys with a password
// The format could be: iv(16) + ciphertext(80) for AES-256
// Or: salt(16) + iv(16) + ciphertext(64)
console.log('The 96 bytes could be encrypted with AES-256.');
console.log('Common formats:');
console.log('- IV (16 bytes) + ciphertext (80 bytes)');
console.log('- Salt (16) + IV (16) + ciphertext (64)');

// SUMMARY
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

const matches = results.filter(r => r.match);
if (matches.length > 0) {
    console.log('\n✓ SUCCESS! Found matching interpretation(s):');
    matches.forEach((m, i) => {
        console.log(`\n${i + 1}. ${m.desc}`);
        console.log(`   Private Key: ${m.key}`);
        console.log(`   Address: ${m.address}`);
    });
} else {
    console.log('\n✗ NO MATCH FOUND');
    console.log('\nTried:');
    results.forEach(r => console.log(`  - ${r.desc}: ${r.address}`));
    console.log('\n\nThe key may be:');
    console.log('1. Encrypted with a password/passphrase');
    console.log('2. Using a custom Trust Wallet derivation path');
    console.log('3. A different key format (not standard BIP-32/39)');
    console.log('\nAsk the user for: encryption password, or the original mnemonic phrase.');
}