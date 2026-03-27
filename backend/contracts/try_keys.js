const crypto = require('crypto');

// Base64 from Trust Wallet
const base64Key = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';

// Expected address (lowercase for comparison)
const expectedAddr = '0xa4e6226685a6b55d63f6c41d98514adc7cddf1ff';

// Decode Base64 to buffer
const decoded = Buffer.from(base64Key, 'base64');
console.log(`Decoded length: ${decoded.length} bytes`);
console.log(`Full hex: 0x${decoded.toString('hex')}`);

// Try different interpretations
const attempts = [
  { name: 'First 32 bytes', start: 0, end: 32 },
  { name: 'Last 32 bytes', start: 64, end: 96 },
  { name: 'Middle 32 bytes (32-64)', start: 32, end: 64 },
  { name: 'Bytes 0-32 of last 64', start: 32, end: 64 },
  { name: 'Skip first 64, take 32', start: 64, end: 96 },
];

console.log('\n--- Trying different interpretations ---\n');

// Simple ECDSA public key derivation (without external libs)
function privateToAddressHex(privateKey) {
  // This requires ethers or similar - we'll check if it matches
  // For now, just return the hex
  return '0x' + privateKey.toString('hex');
}

for (const attempt of attempts) {
  const keySlice = decoded.slice(attempt.start, attempt.end);
  const hexKey = '0x' + keySlice.toString('hex');
  console.log(`${attempt.name}: ${hexKey}`);
  console.log(`  Length: ${keySlice.length} bytes`);
}

// Try with ethers if available
try {
  const ethers = require('ethers');
  console.log('\n--- Using ethers.js to derive addresses ---\n');
  
  for (const attempt of attempts) {
    const keySlice = decoded.slice(attempt.start, attempt.end);
    const hexKey = '0x' + keySlice.toString('hex');
    
    try {
      const wallet = new ethers.Wallet(hexKey);
      const derivedAddr = wallet.address.toLowerCase();
      const match = derivedAddr === expectedAddr;
      
      console.log(`${attempt.name}:`);
      console.log(`  Private Key: ${hexKey}`);
      console.log(`  Derived Address: ${wallet.address}`);
      console.log(`  MATCH: ${match ? '✅ YES!' : '❌'}`);
      
      if (match) {
        console.log('\n🎉 FOUND IT! Use this private key:');
        console.log(hexKey);
        process.exit(0);
      }
    } catch (e) {
      console.log(`${attempt.name}: Invalid key - ${e.message}`);
    }
  }
  
  // Also try if first 32 bytes is just different portion
  console.log('\n--- Additional checks ---\n');
  
  // Maybe it's not a standard key? Check the structure
  console.log('First 64 bytes hex:', '0x' + decoded.slice(0, 64).toString('hex'));
  console.log('Full decoded hex:', '0x' + decoded.toString('hex'));
  
} catch (e) {
  console.log('ethers not available, please run: npm install ethers');
}
