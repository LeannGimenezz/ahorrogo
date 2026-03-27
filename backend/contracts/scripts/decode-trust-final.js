const { Buffer } = require('buffer');
const crypto = require('crypto');
const { HDNodeWallet } = require('ethers');
const { privateToAddress } = require('ethereumjs-util');
const bip39 = require('bip39');

const BASE64_STRING = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';
const EXPECTED_ADDRESS = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';

function bufferToHex(buf) {
    return '0x' + buf.toString('hex');
}

function deriveAddress(privateKey) {
    try {
        const key = typeof privateKey === 'string'? 
            (privateKey.startsWith('0x') ? Buffer.from(privateKey.slice(2), 'hex') : Buffer.from(privateKey, 'hex')) :
            Buffer.from(privateKey);
        const addressBuf = privateToAddress(key);
        return '0x' + addressBuf.toString('hex');
    } catch (e) {
        return null;
    }
}

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest();
}

function tryDecryptAES(ciphertext, iv, password) {
    try {
        // Derive key using PBKDF2
        const key = crypto.pbkdf2Sync(password, iv, 10000, 32, 'sha256');
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
        let decrypted = decipher.update(ciphertext);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted;
    } catch (e) {
        return null;
    }
}

const decoded = Buffer.from(BASE64_STRING, 'base64');

console.log('================================================================================');
console.log('TRUST WALLET PRIVATE KEY DECODER - COMPLETE ANALYSIS');
console.log('================================================================================');
console.log(`\nBase64: ${BASE64_STRING.slice(0, 30)}...`);
console.log(`Decoded: ${decoded.length} bytes`);
console.log(`Expected Address: ${EXPECTED_ADDRESS}`);

console.log('\n================================================================================');
console.log('TRYING ALL KNOWN PRIVATE KEY FORMATS');
console.log('================================================================================');

let found = false;
const results = [];

// =========================================// 1. DIRECT PRIVATE KEY (32 bytes)
// ========================================
console.log('\n1. DIRECT PRIVATE KEY (every 32-byte offset)');

for (let i = 0; i <= decoded.length - 32; i++) {
    const slice = decoded.slice(i, i + 32);
    const addr = deriveAddress(slice);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`   ✓✓✓ MATCH at offset ${i}!`);
        console.log(`   Private Key: ${bufferToHex(slice)}`);
        results.push({ method: `Direct offset ${i}`, key: bufferToHex(slice), address: addr });
        found = true;
        break;
    }
}
if (!found) console.log('   No match');

// ========================================
// 2. BIP-39 MNEMONIC DERIVATION
// ========================================
console.log('\n2. BIP-39 MNEMONIC DERIVATION');

const validEntropyLengths = [16, 20, 24, 28, 32];
for (const len of validEntropyLengths) {
    for (let offset = 0; offset <= decoded.length - len; offset += 32) {
        if (offset + len > decoded.length) continue;
        const entropy = decoded.slice(offset, offset + len);
        try {
            const mnemonic = bip39.entropyToMnemonic(entropy);
            const seed = bip39.mnemonicToSeedSync(mnemonic);
            const paths = ["m/44'/60'/0'/0/0", "m/44'/60'/0'/0", "m/0'/0'/0'", "m"];
            
            for (const path of paths) {
                try {
                    const wallet = HDNodeWallet.fromPhrase(mnemonic, undefined, path);
                    if (wallet.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
                        console.log(`   ✓✓✓ MATCH!`);
                        console.log(`   Mnemonic: "${mnemonic}"`);
                        console.log(`   Path: ${path}`);
                        console.log(`   Private Key: ${wallet.privateKey}`);
                        results.push({ method: `Mnemonic${len}B+${path}`, key: wallet.privateKey, address: wallet.address });
                        found = true;
                        break;
                    }
                } catch (e) {}
            }
        } catch (e) {}
        if (found) break;
    }
    if (found) break;
}
if (!found) console.log('   No match from entropy-to-mnemonic');

// ========================================
// 3. HASH-BASED DERIVATION
// ========================================
console.log('\n3. HASH-BASED DERIVATION');

const hashMethods = [
    { name: 'SHA256(decoded)', fn: () => sha256(decoded) },
    { name: 'Double SHA256', fn: () => sha256(sha256(decoded)) },
    { name: 'SHA256(base64)', fn: () => sha256(Buffer.from(BASE64_STRING)) },
];

for (const { name, fn } of hashMethods) {
    const hash = fn();
    const addr = deriveAddress(hash);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`   ✓✓✓ MATCH: ${name}`);
        console.log(`   Private Key: ${bufferToHex(hash)}`);
        results.push({ method: name, key: bufferToHex(hash), address: addr });
        found = true;
        break;
    }
}
if (!found) console.log('   No match from hash methods');

// ========================================
// 4. ENCRYPTED KEY ANALYSIS
// ========================================
console.log('\n4. ENCRYPTED KEY ANALYSIS');
console.log('\n   The 96 bytes could be encrypted. Common structures:');
console.log('   - IV (16) + ciphertext (80) = AES-256-CBC');
console.log('   - Salt (16) + IV (16) + ciphertext (64) = PBKDF2 + AES');
console.log('   - Auth tag (16) + IV (12) + ciphertext (68) = AES-GCM');

console.log('\n   First 16 bytes (possible IV/Salt):');
console.log(`   ${bufferToHex(decoded.slice(0, 16))}`);
console.log('   Remaining 80 bytes (possible ciphertext):');
console.log(`   ${bufferToHex(decoded.slice(16)).slice(0,50)}...`);

// ========================================
// SUMMARY
// ========================================
console.log('\n================================================================================');
console.log('RESULT');
console.log('================================================================================');

if (results.length > 0) {
    console.log('\n✓ SUCCESS! Found matching private key:\n');
    results.forEach((r, i) => {
        console.log(`   Method: ${r.method}`);
        console.log(`   Private Key: ${r.key}`);
        console.log(`   Address: ${r.address}`);
    });
} else {
    console.log('\n✗ NO MATCH FOUND\n');
    console.log('The base64 string does NOT encode a standard private key format.');
    console.log('\nMost likely scenarios:');
    console.log('1. ENCRYPTED KEY: The data is encrypted and requires a password');
    console.log('2. NON-STANDARD: Trust Wallet uses a proprietary format');
    console.log('3. WRONG DATA: The expected address may not match this backup');
    console.log('\n────────────────────────────────────────────────────────────────────────────────');
    console.log('NEXT STEPS FOR USER:');
    console.log('────────────────────────────────────────────────────────────────────────────────');
    console.log('1. If backup was password-protected, you MUST have the password');
    console.log('2. Try the original 12/24 word mnemonic phrase instead');
    console.log('3. In Trust Wallet: Settings > Wallets > Show Recovery Phrase');
    console.log('4. Verify the address 0xa4E6...F1ff is correct for this wallet');
}

process.exit(0);