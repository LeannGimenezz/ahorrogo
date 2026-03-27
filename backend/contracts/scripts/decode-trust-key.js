const { Buffer } = require('buffer');
const { privateToAddress } = require('ethereumjs-util');
const crypto = require('crypto');

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

function sha256(buf) {
    return crypto.createHash('sha256').update(buf).digest();
}

function ripemd160(buf) {
    return crypto.createHash('ripemd160').update(buf).digest();
}

function hash256(buf) {
    return sha256(sha256(buf));
}

console.log('='.repeat(80));
console.log('Trust Wallet Private Key Decoder');
console.log('='.repeat(80));

const decoded = Buffer.from(BASE64_STRING, 'base64');
console.log(`\nDecoded length: ${decoded.length} bytes`);
console.log(`Full hex: ${bufferToHex(decoded).slice(0, 100)}...`);
console.log(`Expected address: ${EXPECTED_ADDRESS}`);

console.log('\n' + '='.repeat(80));
console.log('INTERPRETATION ATTEMPTS');
console.log('='.repeat(80));

const results = [];

// 1. First 32 bytes
console.log('\n--- Attempt 1: First 32 bytes ---');
const attempt1 = decoded.slice(0, 32);
const addr1 = deriveAddress(attempt1);
console.log(`Private key: ${bufferToHex(attempt1)}`);
console.log(`Derived address: ${addr1}`);
console.log(`Match: ${addr1?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'First 32 bytes', key: bufferToHex(attempt1), address: addr1, match: addr1?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 2. Last 32 bytes
console.log('\n--- Attempt 2: Last 32 bytes ---');
const attempt2 = decoded.slice(-32);
const addr2 = deriveAddress(attempt2);
console.log(`Private key: ${bufferToHex(attempt2)}`);
console.log(`Derived address: ${addr2}`);
console.log(`Match: ${addr2?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'Last 32 bytes', key: bufferToHex(attempt2), address: addr2, match: addr2?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 3. Middle 32 bytes (bytes 32-64)
console.log('\n--- Attempt 3: Middle 32 bytes (bytes 32-64) ---');
const attempt3 = decoded.slice(32, 64);
const addr3 = deriveAddress(attempt3);
console.log(`Private key: ${bufferToHex(attempt3)}`);
console.log(`Derived address: ${addr3}`);
console.log(`Match: ${addr3?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'Middle 32 bytes (32-64)', key: bufferToHex(attempt3), address: addr3, match: addr3?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 4. Last 32 bytes of 96 (explicitly bytes 64-96)
console.log('\n--- Attempt 4: Bytes 64-96 (last 32 bytes) ---');
const attempt4 = decoded.slice(64, 96);
const addr4 = deriveAddress(attempt4);
console.log(`Private key: ${bufferToHex(attempt4)}`);
console.log(`Derived address: ${addr4}`);
console.log(`Match: ${addr4?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'Bytes 64-96', key: bufferToHex(attempt4), address: addr4, match: addr4?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 5. Try interpreting first 64 bytes as xpriv/hdkey
console.log('\n--- Attempt 5: First 64 bytes (possible extended key) ---');
const attempt5 = decoded.slice(0, 64);
console.log(`Extended key (64 bytes): ${bufferToHex(attempt5)}`);
// For extended keys, the last 32 bytes would be the chain code, first 32 the key
const attempt5_key = decoded.slice(0, 32);
const addr5 = deriveAddress(attempt5_key);
console.log(`Using first 32 as key: ${bufferToHex(attempt5_key)}`);
console.log(`Derived address: ${addr5}`);
console.log(`Match: ${addr5?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'Extended key (first 32)', key: bufferToHex(attempt5_key), address: addr5, match: addr5?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 6. SHA256 of decoded data
console.log('\n--- Attempt 6: SHA256 of decoded buffer ---');
const attempt6 = sha256(decoded);
const addr6 = deriveAddress(attempt6);
console.log(`SHA256 hash: ${bufferToHex(attempt6)}`);
console.log(`Derived address: ${addr6}`);
console.log(`Match: ${addr6?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'SHA256 of decoded', key: bufferToHex(attempt6), address: addr6, match: addr6?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 7. SHA256 of original base64 string
console.log('\n--- Attempt 7: SHA256 of base64 string ---');
const attempt7 = sha256(Buffer.from(BASE64_STRING, 'utf8'));
const addr7 = deriveAddress(attempt7);
console.log(`SHA256 of base64: ${bufferToHex(attempt7)}`);
console.log(`Derived address: ${addr7}`);
console.log(`Match: ${addr7?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'SHA256 of base64 string', key: bufferToHex(attempt7), address: addr7, match: addr7?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 8. Double SHA256
console.log('\n--- Attempt 8: Double SHA256 (hash256) of decoded ---');
const attempt8 = hash256(decoded);
const addr8 = deriveAddress(attempt8);
console.log(`Double SHA256: ${bufferToHex(attempt8)}`);
console.log(`Derived address: ${addr8}`);
console.log(`Match: ${addr8?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
results.push({ desc: 'Double SHA256', key: bufferToHex(attempt8), address: addr8, match: addr8?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });

// 9. Check if it's a BIP-32 extended private key (xprv format but raw bytes)
console.log('\n--- Attempt 9: BIP-32 interpretation (bytes 46-78 private key) ---');
// BIP-32: 4 version + 4 depth + 4 fingerprint + 4 child index + 32 chain code + 33 private key (or 32)
// But Trust Wallet may use different offsets
// Try bytes 44-76 (after version + depth + fingerprint + index + chain code)
const attempt9 = decoded.slice(46, 78);
if (attempt9.length >= 32) {
    const key9 = attempt9.slice(0, 32);
    const addr9 = deriveAddress(key9);
    console.log(`Private key: ${bufferToHex(key9)}`);
    console.log(`Derived address: ${addr9}`);
    console.log(`Match: ${addr9?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() ? 'YES' : 'NO'}`);
    results.push({ desc: 'BIP-32 offset (46-78)', key: bufferToHex(key9), address: addr9, match: addr9?.toLowerCase() === EXPECTED_ADDRESS.toLowerCase() });
}

// 10. Try all 32-byte windows (sliding window)
console.log('\n--- Attempt 10: Sliding window - try EVERY 32-byte offset ---');
for (let i = 0; i <= decoded.length - 32; i++) {
    const slice = decoded.slice(i, i + 32);
    const addr = deriveAddress(slice);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`FOUND MATCH at offset ${i}!`);
        console.log(`Private key: ${bufferToHex(slice)}`);
        console.log(`Derived address: ${addr}`);
        results.push({ desc: `Sliding window offset ${i}`, key: bufferToHex(slice), address: addr, match: true });
    }
}

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
    console.log('\nNone of the standard interpretations produced the expected address.');
    console.log('The format may be:');
    console.log('- Encrypted with a passphrase');
    console.log('- A different key derivation path');
    console.log('- A custom Trust Wallet encoding');
    console.log('\nAll derived addresses:');
    results.forEach(r => {
        console.log(`  ${r.desc}: ${r.address}`);
    });
}