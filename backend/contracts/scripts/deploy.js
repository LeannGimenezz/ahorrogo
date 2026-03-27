/**
 * Script de Deployment para AhorroGOVault en RSK
 * 
 * Uso:
 *   npx hardhat run scripts/deploy.js --network rsktestnet
 *   npx hardhat run scripts/deploy.js --network rskmainnet
 */

const hre = require("hardhat");

// Direcciones deTropykus en RSK (para referencia)
const TROPYKUS_ADDRESSES = {
  testnet: {
    comptroller: "0x7de1ade0c4482ceab96faff408cc9dcc9015b448",
    krbtc: "0x636b2c156d09cee9516f9afec7a4605e1f43dec1",
    kdoc: "0xe7b4770af8152fc1a0e13d08e70a8c9a70f4d9d9"
  },
  mainnet: {
    comptroller: "0x962308Fef8EdfAdD705384840e7701f8F39ed0c0",
    krbtc: "0x0aeadb9d4c6a80462a47e87e76e487fa8b9a37d7",
    kdoc: "0x544eb90e766b405134b3b3f62b6b4c23fcd5fda2"
  }
};

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("===========================================");
  console.log("  AhorroGO Vault - Deployment Script");
  console.log("===========================================");
  console.log("");
  console.log("Network:", hre.network.name);
  console.log("Chain ID:", hre.network.chainId);
  console.log("Deployer:", deployer.address);
  console.log("Balance:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "RBTC");
  console.log("");
  
  // Verificar que tenemos fondos
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  const minBalance = hre.ethers.parseEther("0.01"); // Mínimo 0.01 RBTC para gas
  if (balance < minBalance) {
    console.error("ERROR: Fondos insuficientes para deployment");
    console.error("Necesitás al menos 0.01 RBTC en la wallet");
    console.error("Faucet: https://faucet.rootstock.io");
    process.exit(1);
  }
  
  console.log("1. Compilando contratos...");
  await hre.run("compile");
  console.log("   ✓ Contratos compilados");
  console.log("");
  
  console.log("2. Desplegando AhorroGOVault...");
  
  const AhorroGOVault = await hre.ethers.getContractFactory("AhorroGOVault");
  
  const vault = await AhorroGOVault.deploy({
    gasLimit: 5000000,
    gasPrice: hre.ethers.parseUnits("60", "gwei")
  });
  
  await vault.waitForDeployment();
  
  const vaultAddress = await vault.getAddress();
  
  console.log("   ✓ AhorroGOVault desplegado en:", vaultAddress);
  console.log("");
  
  // Configurar Tropykus address (opcional, se puede hacer después)
  const tropykusAddr = hre.network.name === "rskmainnet" 
    ? TROPYKUS_ADDRESSES.mainnet.comptroller 
    : TROPYKUS_ADDRESSES.testnet.comptroller;
  
  console.log("3. Configurando Tropykus...");
  try {
    const tx = await vault.setTropykusAddress(tropykusAddr);
    await tx.wait();
    console.log("   ✓ Tropykus address configurada:", tropykusAddr);
  } catch (e) {
    console.log("   ⚠ No se pudo configurar Tropykus:", e.message);
  }
  console.log("");
  
  // Mostrar información de verificación
  const network = hre.network.name === "rskmainnet" ? "mainnet" : "testnet";
  const explorer = network === "mainnet" 
    ? "https://rootstock.blockscout.com" 
    : "https://rootstock-testnet.blockscout.com";
  
  console.log("===========================================");
  console.log("  Deployment Exitoso!");
  console.log("===========================================");
  console.log("");
  console.log("Contrato: AhorroGOVault");
  console.log("Dirección:", vaultAddress);
  console.log("Red:", network);
  console.log("Explorador:", explorer);
  console.log("");
  console.log("Links útiles:");
  console.log(`  - TX: ${explorer}/tx/${vault.deploymentTransaction().hash}`);
  console.log(`  - Contrato: ${explorer}/address/${vaultAddress}`);
  console.log("");
  console.log("Para verificar en Blockscout:");
  console.log(`  npx hardhat verify --network ${network} ${vaultAddress}`);
  console.log("");
  
  // Guardar direcciones en artifact
  const deploymentInfo = {
    network: hre.network.name,
    chainId: hre.network.chainId,
    contract: "AhorroGOVault",
    address: vaultAddress,
    deployer: deployer.address,
    deploymentTx: vault.deploymentTransaction().hash,
    timestamp: new Date().toISOString(),
    tropykusAddress: tropykusAddr,
    explorer: explorer
  };
  
  // Guardar en artifacts
  const fs = require("fs");
  const path = require("path");
  const artifactsDir = path.join(__dirname, "..", "artifacts");
  
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(artifactsDir, `deployment-${network}.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Info de deployment guardada en artifacts/");
  console.log("");
  
  return deploymentInfo;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en deployment:", error);
    process.exit(1);
  });
