const ethereumjs = require('ethereumjs-util');

const base64Key = 'sNWW155aD68vQdyonWh3tsbfUigib3fCd08pSdLGqGt9hKGOMyj97fHtJX95DYUGrUqaMIO59ghxZo/tJflmSZHH8qtgqkLotmr7e70V/YFVre6A+WPAXMTB17YH7wgW';
const expectedAddress = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';

console.log('🔐 Trust Wallet Base64 -> Hex Conversion & Verification\n');

const decoded = Buffer.from(base64Key, 'base64');
console.log('Decoded buffer length:', decoded.length, 'bytes');

const privateKeyBuffer = decoded.slice(0, 32);
const privateKeyHex = '0x' + privateKeyBuffer.toString('hex');

console.log('\n📋 RESULTS:\n');
console.log('Hex Private Key:', privateKeyHex);
console.log('Hex length:', privateKeyHex.length, 'chars (should be 66 for 32 bytes)');

try {
  const pubKey = ethereumjs.privateToPublic(privateKeyBuffer);
  const derivedAddress = '0x' + ethereumjs.pubToAddress(pubKey).toString('hex');

  console.log('\nDerived Address:', derivedAddress);
  console.log('Expected Address:', expectedAddress.toLowerCase());

  const match = derivedAddress.toLowerCase() === expectedAddress.toLowerCase();
  console.log('\n' + (match ? '✅ ADDRESS MATCHES!' : '❌ ADDRESS MISMATCH!'));
} catch (e) {
  console.log('\n❌ Error deriving address:', e.message);
}
