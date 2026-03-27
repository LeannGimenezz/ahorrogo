const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "RBTC");

  console.log("\nDeploying AhorroGOVault...");
  const Vault = await hre.ethers.getContractFactory("AhorroGOVault");
  
  try {
    const vault = await Vault.deploy();
    await vault.waitForDeployment();
    
    const address = await vault.getAddress();
    console.log("\n✅ AhorroGOVault deployed to:", address);
    console.log("Network: RSK Testnet");
    console.log("Explorer: https://explorer.testnet.rootstock.io/address/" + address);
    
    return address;
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    if (error.message.includes("insufficient funds")) {
      console.log("\nNecesitás más RBTC en tu wallet.");
      console.log("Faucet: https://faucet.rootstock.io");
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
