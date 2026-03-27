/**
 * Configuración de Hardhat para RSK Network
 */

require("dotenv").config();
require("@nomicfoundation/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  
  networks: {
    hardhat: {
      chainId: 31337
    },
    
    rsktestnet: {
      url: "https://public-node.testnet.rsk.co",
      chainId: 31,
      accounts: [process.env.PRIVATE_KEY],
      gas: 6800000,
      gasPrice: 60000000,
      timeout: 120000
    },
    
    rskmainnet: {
      url: "https://public-node.rsk.co",
      chainId: 30,
      accounts: [process.env.PRIVATE_KEY],
      gas: 6800000,
      gasPrice: 65000000,
      timeout: 120000
    }
  },
  
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
  
  mocha: {
    timeout: 120000
  }
};
