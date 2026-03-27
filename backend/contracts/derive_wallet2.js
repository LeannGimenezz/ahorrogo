const ethers = require('ethers');

// New seed phrase
const mnemonic = 'finish come breeze skill deputy endless bubble document battle coral dish destroy';

console.log('--- Deriving from NEW Seed Phrase ---\n');

// Create wallet from mnemonic
const wallet = ethers.Wallet.fromPhrase(mnemonic);

console.log('Derived Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);

// Check balance
const provider =new ethers.JsonRpcProvider('https://public-node.testnet.rsk.co');
provider.getBalance(wallet.address).then(balance => {
  console.log('Balance:', ethers.formatEther(balance), 'RBTC');
});
