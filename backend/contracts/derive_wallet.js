const ethers = require('ethers');

// Seed phrase
const mnemonic = 'bonus fade merit maze frown awful gas prize between option base truck';

// Expected address
const expectedAddr = '0xa4e6226685a6b55d63f6c41d98514adc7cddf1ff';

console.log('--- Deriving from Seed Phrase ---\n');

// Create wallet from mnemonic (default path: m/44'\''/60'\''/0'\''/0/0)
const wallet = ethers.Wallet.fromPhrase(mnemonic);

console.log('Derived Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);

const match = wallet.address.toLowerCase() === expectedAddr;
console.log('\nMATCH:', match ? '✅ YES!' : '❌ NO');

if (!match) {
  console.log('\n--- Trying different derivation paths ---\n');
  
  const paths = [
    "m/44'/60'/0'/0/0",     // Ethereum default
    "m/44'/60'/0'/0",       // Some wallets
    "m/44'/60'/0'",         // Ledger
    "m/44'/60'/1'/0/0",     // Alternative
    "m/44'/60'/0'/0/1",     // Second account
    "m/44'/137'/0'/0/0",    // RSK path
  ];
  
  const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic);
  
  for (const path of paths) {
    try {
      const derived = hdNode.derivePath(path);
      const addr = derived.address.toLowerCase();
      console.log('Path: ' + path);
      console.log('  Address: ' + derived.address);
      console.log('  Private Key: ' + derived.privateKey);
      console.log('  Match: ' + (addr === expectedAddr ? '✅ YES!' : ' ❌'));
      console.log('');
    } catch (e) {
      console.log('Path ' + path + ': Error - ' + e.message);
    }
  }
}
