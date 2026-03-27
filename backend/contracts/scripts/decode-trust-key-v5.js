const { Buffer } = require('buffer');
const crypto = require('crypto');
const { HDNodeWallet } = require('ethers');
const { privateToAddress } = require('ethereumjs-util');
const bs58check = require('bs58check');

const BASE64_STRING = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';
const EXPECTED_ADDRESS = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';

function bufferToHex(buf) {
    return '0x'+ buf.toString('hex');
}

function deriveAddress(privateKey) {
    try {
        const key = typeof privateKey === 'string'? 
            (privateKey.startsWith('0x') ? Buffer.from(privateKey.slice(2), 'hex') : Buffer.from(privateKey, 'hex')) :
            privateKey;
        const addressBuf = privateToAddress(key);
        return '0x' + addressBuf.toString('hex');
    } catch (e) {
        return null;
    }
}

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest();
}

function ripemd160(buf) {
    return crypto.createHash('ripemd160').update(buf).digest();
}

const decoded = Buffer.from(BASE64_STRING, 'base64');
console.log('='.repeat(80));
console.log('Trust Wallet Private Key Decoder v5 - Final Analysis');
console.log('='.repeat(80));
console.log(`\nDecoded: ${decoded.length} bytes`);
console.log(`Expected address: ${EXPECTED_ADDRESS}`);

const matches = [];

console.log('\n' + '='.repeat(80));
console.log('STANDARD PRIVATE KEY ATTEMPTS');
console.log('='.repeat(80));

// Direct 32-byte slices
for (let i = 0; i <= decoded.length - 32; i++) {
    const slice = decoded.slice(i, i + 32);
    const addr = deriveAddress(slice);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ FOUND at offset ${i}!`);
        console.log(`Private Key: ${bufferToHex(slice)}`);
        matches.push({ desc: `Offset ${i}`, key: bufferToHex(slice), address: addr });
    }
}
console.log(`Tested ${decoded.length - 31} 32-byte slices - no direct match`);

console.log('\n' + '='.repeat(80));
console.log('BIP-32 EXTENDED KEY ATTEMPTS');
console.log('='.repeat(80));

// Build xprv and try derivation
const key = decoded.slice(0, 32);
const chainCode = decoded.slice(32, 64);

// xprv version bytes
const xprvVersion = Buffer.from('0488ade4', 'hex');
const depth = Buffer.from('00', 'hex');
const fingerprint = Buffer.from('00000000', 'hex');
const childNum = Buffer.from('00000000', 'hex');
const keyPrefix = Buffer.from('00', 'hex');

const xprvBytes = Buffer.concat([xprvVersion, depth, fingerprint, childNum, chainCode, keyPrefix, key]);

// Add double SHA256 checksum
const checksum = sha256(sha256(xprvBytes)).slice(0, 4);
const xprvWithChecksum = Buffer.concat([xprvBytes, checksum]);

// Base58 encode using ethers (it has a built-in function)
const bs58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function base58Encode(buffer) {
    const digits = [0];
    for (let i = 0; i < buffer.length; i++) {
        let carry = buffer[i];
        for (let j = 0; j < digits.length; j++) {
            carry += digits[j] << 8;
            digits[j] = carry % 58;
            carry = (carry / 58) | 0;
        }
        while (carry) {
            digits.push(carry % 58);
            carry = (carry / 58) | 0;
        }
    }
    let result = '';
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
        result += '1';
    }
    for (let i = digits.length - 1; i >= 0; i--) {
        result += bs58[digits[i]];
    }
    return result;
}

const xprvEncoded = base58Encode(xprvBytes);
console.log(`Built xprv: ${xprvEncoded.slice(0, 20)}...`);

// Try to use this with ethers
try {
    const hdwallet = HDNodeWallet.fromExtendedKey(xprvEncoded);
    console.log(`\nFrom xprv root:`);
    console.log(`  Address: ${hdwallet.address}`);
    if (hdwallet.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ MATCH!`);
        matches.push({ desc: 'xprv root', key: hdwallet.privateKey, address: hdwallet.address });
    }
    
    const paths = ["m/44'/60'/0'/0/0", "m/44'/60'/0'/0", "m/44'/60'/0'", "m/0", "m/0/0", "m/0'/0'/0'"];
    for (const path of paths) {
        try {
            const child = hdwallet.derivePath(path);
            console.log(`  ${path}: ${child.address}`);
            if (child.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
                console.log(`✓✓✓ MATCH!`);
                matches.push({ desc: `xprv ${path}`, key: child.privateKey, address: child.address });
            }
        } catch (e) {}
    }
} catch (e) {
    console.log(`xprv error: ${e.message}`);
}

// Also try with last 32 bytes as key and middle 32 as chain code
console.log('\n--- Alternative xprv configurations ---');

const altConfigs = [
    { key: decoded.slice(0, 32), chain: decoded.slice(32, 64), name: 'first+middle' },
    { key: decoded.slice(0, 32), chain: decoded.slice(64, 96), name: 'first+last' },
    { key: decoded.slice(32, 64), chain: decoded.slice(64, 96), name: 'middle+last' },
    { key: decoded.slice(64, 96), chain: decoded.slice(0, 32), name: 'last+first' },
];

for (const config of altConfigs) {
    const xprv = Buffer.concat([xprvVersion, depth, fingerprint, childNum, config.chain, keyPrefix, config.key, sha256(sha256(Buffer.concat([xprvVersion, depth, fingerprint, childNum, config.chain, keyPrefix, config.key]))).slice(0, 4)]);
    const encoded = base58Encode(xprv);
    try {
        const hd = HDNodeWallet.fromExtendedKey(encoded);
        console.log(`${config.name}: ${hd.address}`);
        if (hd.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
            matches.push({ desc: `xprv ${config.name}`, key: hd.privateKey, address: hd.address });
        }
    } catch (e) {}
}

console.log('\n' + '='.repeat(80));
console.log('HASH-BASED ATTEMPTS');
console.log('='.repeat(80));

const hashAttempts = [
    { name: 'SHA256(full)', data: sha256(decoded) },
    { name: 'Double SHA256', data: sha256(sha256(decoded)) },
    { name: 'SHA256(base64)', data: sha256(Buffer.from(BASE64_STRING)) },
    { name: 'Keccak256-like', data: crypto.createHash('sha3-256').update(decoded).digest() },
];

for (const { name, data } of hashAttempts) {
    const addr = deriveAddress(data);
    console.log(`${name}: ${addr}`);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ MATCH!`);
        matches.push({ desc: name, key: bufferToHex(data), address: addr });
    }
}

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

if (matches.length > 0) {
    console.log('\n✓ FOUND MATCHES:\n');
    matches.forEach((m, i) => {
        console.log(`${i + 1}. ${m.desc}`);
        console.log(`   Private Key: ${m.key}`);
        console.log(`   Address: ${m.address}`);
    });
} else {
    console.log('\n✗ NO MATCHES FOUND\n');
    console.log('The 96-byte base64 data could not be decoded to match the expected address.');
    console.log('\nMost likely explanation:');
    console.log('>>> THE DATA IS ENCRYPTED <<<');
    console.log('\nTrust Wallet exports encrypted keys when backed up with a password.');
    console.log('The 96-byte structure suggests:');
    console.log('  -16 bytes IV + 80 bytes ciphertext (AES-256-CBC)');
    console.log('  - Or:16 bytes salt + 16 bytes IV + 64 bytes ciphertext (PBKDF2 + AES)');
    console.log('\nSOLUTION: Ask the user for:');
    console.log('  1. The encryption password used when exporting');
    console.log('  2. The original 12/24-word mnemonic phrase');
    console.log('  3. Or verify the expected address is correct');
}