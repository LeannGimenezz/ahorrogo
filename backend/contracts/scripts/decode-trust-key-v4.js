const { Buffer } = require('buffer');
const crypto = require('crypto');
const { HDNodeWallet } = require('ethers');
const { privateToAddress } = require('ethereumjs-util');

const BASE64_STRING = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';
const EXPECTED_ADDRESS = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';

function bufferToHex(buf) {
    return '0x' + buf.toString('hex');
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
console.log('Trust Wallet Private Key Decoder v4 - Extended Analysis');
console.log('='.repeat(80));
console.log(`\nDecoded: ${decoded.length} bytes`);
console.log(`Hex: ${bufferToHex(decoded)}`);
console.log(`Expected: ${EXPECTED_ADDRESS}`);

const matches = [];

console.log('\n' + '='.repeat(80));
console.log('ANALYSIS: Byte patterns');
console.log('='.repeat(80));

// Check for patterns
console.log(`\nFirst 4 bytes (version?): ${bufferToHex(decoded.slice(0, 4))}`);
console.log(`Bytes 0-32: ${bufferToHex(decoded.slice(0, 32))}`);
console.log(`Bytes 32-64: ${bufferToHex(decoded.slice(32, 64))}`);
console.log(`Bytes 64-96: ${bufferToHex(decoded.slice(64, 96))}`);

// Check for null bytes or patterns
const nullCount = decoded.filter(b => b === 0).length;
console.log(`\nNull bytes: ${nullCount}`);

console.log('\n' + '='.repeat(80));
console.log('ATTEMPTS');
console.log('='.repeat(80));

// 1. Try XOR with common keys
console.log('\n--- XOR with 0xFF ---');
const xorFF = decoded.map(b => b ^ 0xFF);
for (let i = 0; i <= xorFF.length - 32; i++) {
    const slice = Buffer.from(xorFF.slice(i, i + 32));
    const addr = deriveAddress(slice);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ FOUND XOR-FF at offset ${i}!`);
        console.log(`Private Key: ${bufferToHex(slice)}`);
        matches.push({ desc: `XOR-FF offset ${i}`, key: bufferToHex(slice), address: addr });
    }
}

// 2. Try SHA256 variations
console.log('\n--- SHA256 variations ---');
const hashes = [
    { name: 'SHA256(full)', hash: sha256(decoded) },
    { name: 'SHA256(first32)', hash: sha256(decoded.slice(0, 32)) },
    { name: 'SHA256(last32)', hash: sha256(decoded.slice(-32)) },
    { name: 'Double SHA256', hash: sha256(sha256(decoded)) },
    { name: 'SHA256(base64)', hash: sha256(Buffer.from(BASE64_STRING)) },
];

for (const { name, hash } of hashes) {
    const addr = deriveAddress(hash);
    console.log(`${name}: ${addr}`);
    if (addr && addr.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ FOUND!`);
        matches.push({ desc: name, key: bufferToHex(hash), address: addr });
    }
}

// 3. Try RIPEMD160 (for Bitcoin-style)
console.log('\n--- RIPEMD160 ---');
const ripemd = ripemd160(decoded);
console.log(`RIPEMD160: ${bufferToHex(ripemd)}`);

// 4. Try interpreting as compressed public key (33 bytes)
console.log('\n--- Compressed public key attempt ---');
// First 33 bytes might be a compressed public key
const compressedPub = decoded.slice(0, 33);
console.log(`First 33 bytes: ${bufferToHex(compressedPub)}`);
// Compressed pubkey starts with 02 or 03
if (compressedPub[0] === 0x02 || compressedPub[0] === 0x03) {
    console.log('Looks like compressed public key format!');
}

// 5. Try as uncompressed public key (65 bytes)
console.log('\n--- Uncompressed public key attempt ---');
const uncompressedPub = decoded.slice(0, 65);
console.log(`First 65 bytes: ${bufferToHex(uncompressedPub)}`);
if (uncompressedPub[0] === 0x04) {
    console.log('Looks like uncompressed public key format!');
}

// 6. Check if it's a BIP-32 extended key format
console.log('\n--- BIP-32 extended key format check ---');
// xprv: 4 + 1 +4 + 4 + 32 + 33 = 78 bytes-  we have 96
// yprv/zprv: same structure but different version
const possibleVersions = {
    'xprv': '0488ade4',
    'yprv': '049d7878',
    'zprv': '0488ade4',
};

// 7. Try creating xprv from first32 bytes (key) + next32 bytes (chain code)
console.log('\n--- Building xprv from components ---');
const key = decoded.slice(0, 32);
const chainCode = decoded.slice(32, 64);
console.log(`Key (32B): ${bufferToHex(key)}`);
console.log(`Chain code (32B): ${bufferToHex(chainCode)}`);

// Build extended key
// Version(4) + depth(1) + fingerprint(4) + child_num(4) + chain_code(32) + key(33 with 0x00 prefix)
const xprvVersion = Buffer.from('0488ade4', 'hex');
const depth = Buffer.from('00', 'hex');
const fingerprint = Buffer.from('00000000', 'hex');
const childNum = Buffer.from('00000000', 'hex');
const keyPrefix = Buffer.from('00', 'hex');

const xprvBytes = Buffer.concat([xprvVersion, depth, fingerprint, childNum, chainCode, keyPrefix, key]);
console.log(`xprv bytes (${xprvBytes.length}): ${bufferToHex(xprvBytes)}`);

// Base58 encode
const bs58 = require('bs58');
const xprvEncoded = bs58.encode(xprvBytes);
console.log(`xprv (78 bytes): ${xprvEncoded.slice(0, 20)}...`);

// Derive from this xprv
try {
    const { HDNodeWallet } = require('ethers');
    const hdwallet = HDNodeWallet.fromExtendedKey(xprvEncoded);
    console.log(`\nFrom xprv:`);
    console.log(`  Address: ${hdwallet.address}`);
    console.log(`  Private: ${hdwallet.privateKey}`);
    
    if (hdwallet.address.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
        console.log(`✓✓✓ MATCH!`);
        matches.push({ desc: 'xprv root', key: hdwallet.privateKey, address: hdwallet.address });
    }
    
    // Derive child keys
    const paths = ["m/44'/60'/0'/0/0", "m/0", "m/0/0", "m/44'/60'/0'"];
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

// 8. Try the remaining 32 bytes (after 64 bytes of potential extended key)
console.log('\n--- Last 32 bytes separately ---');
const last32 = decoded.slice(64, 96);
const addrLast32 = deriveAddress(last32);
console.log(`Last 32 bytes as key: ${addrLast32}`);
if (addrLast32 && addrLast32.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
    matches.push({ desc: 'Last 32 bytes', key: bufferToHex(last32), address: addrLast32 });
}

// 9. Try combinations
console.log('\n--- XOR first 32 with last 32 ---');
const xorResult = Buffer.alloc(32);
for (let i = 0; i < 32; i++) {
    xorResult[i] = decoded[i] ^ decoded[64 + i];
}
const addrXor = deriveAddress(xorResult);
console.log(`XOR result: ${addrXor}`);
if (addrXor && addrXor.toLowerCase() === EXPECTED_ADDRESS.toLowerCase()) {
    matches.push({ desc: 'XOR first+last', key: bufferToHex(xorResult), address: addrXor });
}

// SUMMARY
console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));

if (matches.length > 0) {
    console.log('\n✓ FOUND MATCHES:');
    matches.forEach((m, i) => {
        console.log(`\n${i + 1}. ${m.desc}`);
        console.log(`   Private Key: ${m.key}`);
        console.log(`   Address: ${m.address}`);
    });
} else {
    console.log('\n✗ NO MATCHES FOUND');
    console.log('\nThe 96-byte data does not appear to be:');
    console.log('- A direct private key (any 32-byte slice)');
    console.log('- A BIP-39 seed');
    console.log('- A standard xprv');
    console.log('- A hash of the data');
    console.log('\nMost likely explanation:');
    console.log('>>> ENCRYPTED DATA <<<');
    console.log('The 96 bytes may be an encrypted private key that requires a password.');
    console.log('\nTrust Wallet encryption formats:');
    console.log('- AES-256-CBC with password');
    console.log('- May include IV, salt, and authentication data');
}