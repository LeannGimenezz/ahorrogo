/**
 * Tests para AhorroGOVault
 * 
 * Ejecutar con: npx hardhat test
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AhorroGOVault", function () {
  let vault;
  let owner;
  let user1;
  let user2;
  let initialBalance;
  
  // Constantes
  const VAULT_NAME = "Casa en Mendoza";
  const VAULT_ICON = "🏠";
  const VAULT_TARGET = ethers.parseEther("10"); // 10 RBTC
  const ONE_DAY = 86400;
  const ONE_YEAR = 365 * ONE_DAY;
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy contract
    const AhorroGOVault = await ethers.getContractFactory("AhorroGOVault");
    vault = await AhorroGOVault.deploy();
    await vault.waitForDeployment();
    
    // Guardar balance inicial
    initialBalance = await ethers.provider.getBalance(owner.address);
  });
  
  describe("Deployment", function () {
    it("Should set the owner correctly", async function () {
      expect(await vault.owner()).to.equal(owner.address);
    });
    
    it("Should start with vaultCounter at 0", async function () {
      expect(await vault.vaultCounter()).to.equal(0);
    });
  });
  
  describe("createVault", function () {
    it("Should create a new vault successfully", async function () {
      const tx = await vault.connect(user1).createVault(
        VAULT_NAME,
        VAULT_ICON,
        VAULT_TARGET,
        0, // Savings
        ethers.ZeroAddress,
        false,
        0
      );
      
      const receipt = await tx.wait();
      
      // Verificar evento
      expect(receipt.logs[0].fragment.name).to.equal("VaultCreated");
      
      // Verificar estado
      expect(await vault.vaultCounter()).to.equal(1);
      
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.owner).to.equal(user1.address);
      expect(vaultInfo.name).to.equal(VAULT_NAME);
      expect(vaultInfo.icon).to.equal(VAULT_ICON);
      expect(vaultInfo.target).to.equal(VAULT_TARGET);
      expect(vaultInfo.current).to.equal(0);
      expect(vaultInfo.status).to.equal(0); // Active
    });
    
    it("Should create vault with lock", async function () {
      const unlockDate = (await time.latest()) + ONE_DAY * 30; // 30 días
      
      await vault.connect(user1).createVault(
        "Vacaciones",
        "✈️",
        ethers.parseEther("5"),
        0,
        ethers.ZeroAddress,
        true,
        unlockDate
      );
      
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.locked).to.equal(true);
      expect(vaultInfo.unlockDate).to.equal(unlockDate);
    });
    
    it("Should reject empty name", async function () {
      await expect(
        vault.connect(user1).createVault(
          "",
          VAULT_ICON,
          VAULT_TARGET,
          0,
          ethers.ZeroAddress,
          false,
          0
        )
      ).to.be.revertedWith("Name cannot be empty");
    });
    
    it("Should reject zero target", async function () {
      await expect(
        vault.connect(user1).createVault(
          VAULT_NAME,
          VAULT_ICON,
          0,
          0,
          ethers.ZeroAddress,
          false,
          0
        )
      ).to.be.revertedWith("Target must be greater than 0");
    });
  });
  
  describe("deposit", function () {
    beforeEach(async function () {
      // Crear vault
      await vault.connect(user1).createVault(
        VAULT_NAME,
        VAULT_ICON,
        VAULT_TARGET,
        0,
        ethers.ZeroAddress,
        false,
        0
      );
    });
    
    it("Should accept deposit", async function () {
      const depositAmount = ethers.parseEther("1");
      
      const tx = await vault.connect(user1).deposit(0, { value: depositAmount });
      const receipt = await tx.wait();
      
      // Verificar evento
      expect(receipt.logs[0].fragment.name).to.equal("DepositMade");
      
      // Verificar balance
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.current).to.equal(depositAmount);
    });
    
    it("Should track multiple deposits", async function () {
      await vault.connect(user1).deposit(0, { value: ethers.parseEther("1") });
      await vault.connect(user1).deposit(0, { value: ethers.parseEther("2") });
      
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.current).to.equal(ethers.parseEther("3"));
    });
    
    it("Should mark vault as completed when target reached", async function () {
      // Depositar exactamente el target
      await vault.connect(user1).deposit(0, { value: VAULT_TARGET });
      
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.status).to.equal(1); // Completed
    });
    
    it("Should reject zero deposit", async function () {
      await expect(
        vault.connect(user1).deposit(0, { value: 0 })
      ).to.be.revertedWith("Deposit amount must be greater than 0");
    });
    
    it("Should reject deposit to non-existent vault", async function () {
      await expect(
        vault.connect(user1).deposit(99, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Caller is not vault owner");
    });
  });
  
  describe("withdraw", function () {
    beforeEach(async function () {
      await vault.connect(user1).createVault(
        VAULT_NAME,
        VAULT_ICON,
        VAULT_TARGET,
        0,
        ethers.ZeroAddress,
        false,
        0
      );
      // Depositar fondos
      await vault.connect(user1).deposit(0, { value: ethers.parseEther("5") });
    });
    
    it("Should allow withdrawal", async function () {
      const withdrawAmount = ethers.parseEther("2");
      const initialUserBalance = await ethers.provider.getBalance(user1.address);
      
      const tx = await vault.connect(user1).withdraw(0, withdrawAmount);
      const receipt = await tx.wait();
      
      // Verificar evento
      expect(receipt.logs[0].fragment.name).to.equal("WithdrawalMade");
      
      // Verificar balance del vault
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.current).to.equal(ethers.parseEther("3")); // 5 - 2
    });
    
    it("Should reject withdrawal exceeding balance", async function () {
      await expect(
        vault.connect(user1).withdraw(0, ethers.parseEther("100"))
      ).to.be.revertedWith("Insufficient balance");
    });
    
    it("Should reject withdrawal from locked vault", async function () {
      // Crear vault con lock
      await vault.connect(user2).createVault(
        "Auto",
        "🚗",
        ethers.parseEther("20"),
        0,
        ethers.ZeroAddress,
        true,
        (await time.latest()) + ONE_DAY * 30
      );
      await vault.connect(user2).deposit(1, { value: ethers.parseEther("5") });
      
      // Intentar retirar antes del unlock
      await expect(
        vault.connect(user2).withdraw(1, ethers.parseEther("1"))
      ).to.be.revertedWith("Vault is locked until unlock date");
    });
  });
  
  describe("locked vault", function () {
    it("Should unlock after time passes", async function () {
      const unlockDate = (await time.latest()) + ONE_DAY; // 1 día
      
      await vault.connect(user1).createVault(
        "Cumpleaños",
        "🎂",
        ethers.parseEther("1"),
        0,
        ethers.ZeroAddress,
        true,
        unlockDate
      );
      
      // Verificar que está bloqueado
      expect(await vault.isUnlocked(0)).to.equal(false);
      
      // Avanza el tiempo
      await time.increaseTo(unlockDate);
      
      // Verificar que está desbloqueado
      expect(await vault.isUnlocked(0)).to.equal(true);
    });
  });
  
  describe("cancelVault", function () {
    beforeEach(async function () {
      await vault.connect(user1).createVault(
        VAULT_NAME,
        VAULT_ICON,
        VAULT_TARGET,
        0,
        ethers.ZeroAddress,
        false,
        0
      );
    });
    
    it("Should cancel empty vault", async function () {
      await vault.connect(user1).cancelVault(0);
      
      const vaultInfo = await vault.getVault(0);
      expect(vaultInfo.status).to.equal(2); // Cancelled
    });
    
    it("Should not cancel vault with funds if locked", async function () {
      // Crear vault con lock y depositar
      await vault.connect(user1).createVault(
        "Viaje",
        "🧳",
        ethers.parseEther("10"),
        0,
        ethers.ZeroAddress,
        true,
        (await time.latest()) + ONE_YEAR
      );
      await vault.connect(user1).deposit(1, { value: ethers.parseEther("1") });
      
      await expect(
        vault.connect(user1).cancelVault(1)
      ).to.be.revertedWith("Cannot cancel locked vault with funds");
    });
  });
  
  describe("getProgress", function () {
    beforeEach(async function () {
      await vault.connect(user1).createVault(
        VAULT_NAME,
        VAULT_ICON,
        VAULT_TARGET, // 10 RBTC target
        0,
        ethers.ZeroAddress,
        false,
        0
      );
    });
    
    it("Should return 0 for empty vault", async function () {
      expect(await vault.getProgress(0)).to.equal(0);
    });
    
    it("Should return correct progress", async function () {
      await vault.connect(user1).deposit(0, { value: ethers.parseEther("5") });
      // 5 / 10 = 50% = 5000 basis points
      expect(await vault.getProgress(0)).to.equal(5000);
    });
    
    it("Should cap at 10000 (100%)", async function () {
      await vault.connect(user1).deposit(0, { value: ethers.parseEther("20") }); // 20 RBTC
      expect(await vault.getProgress(0)).to.equal(10000); // Capped at 100%
    });
  });
  
  describe("calculateEstimatedYield", function () {
    beforeEach(async function () {
      await vault.connect(user1).createVault(
        VAULT_NAME,
        VAULT_ICON,
        VAULT_TARGET,
        0,
        ethers.ZeroAddress,
        false,
        0
      );
      await vault.connect(user1).deposit(0, { value: ethers.parseEther("10") });
    });
    
    it("Should calculate yield correctly", async function () {
      // 10 RBTC at 5% APY for 365 days = 0.5 RBTC
      const yieldAmount = await vault.calculateEstimatedYield(0, 500); // 500 = 5%
      
      // Aproximado (puede variar por segundos)
      const expectedYield = ethers.parseEther("0.5");
      const tolerance = ethers.parseEther("0.01"); // 0.01 RBTC tolerance
      
      expect(yieldAmount).to.be.closeTo(expectedYield, tolerance);
    });
  });
  
  describe("getUserVaults", function () {
    it("Should return all vaults for a user", async function () {
      // Crear múltiples vaults
      await vault.connect(user1).createVault("Vault1", "1️⃣", 1, 0, ethers.ZeroAddress, false, 0);
      await vault.connect(user1).createVault("Vault2", "2️⃣", 2, 0, ethers.ZeroAddress, false, 0);
      await vault.connect(user1).createVault("Vault3", "3️⃣", 3, 0, ethers.ZeroAddress, false, 0);
      
      const userVaults = await vault.getUserVaults(user1.address);
      
      expect(userVaults.length).to.equal(3);
      expect(userVaults[0]).to.equal(0);
      expect(userVaults[1]).to.equal(1);
      expect(userVaults[2]).to.equal(2);
    });
  });
  
  describe("receive and fallback", function () {
    it("Should accept direct ETH transfers", async function () {
      const [sender] = await ethers.getSigners();
      
      const tx = await sender.sendTransaction({
        to: vault.getAddress(),
        value: ethers.parseEther("1")
      });
      await tx.wait();
      
      // Verificar balance del contrato
      expect(await ethers.provider.getBalance(vault.getAddress())).to.equal(
        ethers.parseEther("1")
      );
    });
  });
});
