const ethers = require('ethers');

async function main() {
  const provider = new ethers.JsonRpcProvider('https://public-node.testnet.rsk.co');
  const address = '0xa4E6226685A6B55d63f6C41d98514ADC7CdDF1ff';
  
  const balance = await provider.getBalance(address);
  const balanceInRBTC = ethers.formatEther(balance);
  
  console.log('Balance:', balanceInRBTC, 'RBTC');
  console.log('Balance wei:', balance.toString());
}

main().catch(console.error);
