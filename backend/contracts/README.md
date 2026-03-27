# AhorroGOVault — Smart Contract en RSK

## Descripción

Smart Contract de bóveda de ahorro desplegado en RSK (Rootstock).

### Características

- ✅ Depósitos en RBTC con time-lock opcional
- ✅ Metas de ahorro configurables
- ✅ Múltiples tipos de vault (Savings, Rental, P2P)
- ✅ Beneficiarios para vaults de alquiler
- ✅ Eventos on-chain para integración backend
- ✅ Cálculo de yield estimado
- ✅ Control de acceso por owner

## Redes Soportadas

| Red | Chain ID | Status |
|-----|----------|--------|
| RSK Mainnet | 30 | Desplegado |
| RSK Testnet | 31 | Desplegado |

## Contratos Hermanos

Para yield real, el vault puede integrarse con:
- **Tropykus Protocol**: Protocolo de lending sobre RSK
- **Money on Chain (DOC)**: Stablecoin en RSK

## Setup

```bash
cd contracts

# Instalar dependencias
npm install

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tu PRIVATE_KEY y RPC URLs
```

## Comandos

```bash
# Compilar contratos
npm run compile

# Ejecutar tests
npm run test

# Desplegar en testnet
npm run deploy:testnet

# Desplegar en mainnet
npm run deploy:mainnet

# Verificar en Blockscout
npx hardhat verify --network rsktestnet <CONTRACT_ADDRESS>

# Iniciar nodo local (para desarrollo)
npm run node
```

## Deployment

### RSK Testnet

1. Obtener RBTC de testnet faucet: https://faucet.rootstock.io
2. Configurar `PRIVATE_KEY` en `.env`
3. Ejecutar:
```bash
npx hardhat run scripts/deploy.js --network rsktestnet
```

### RSK Mainnet

1. Asegurarse de tener RBTC en la wallet
2. Configurar `PRIVATE_KEY` para mainnet
3. Ejecutar:
```bash
npx hardhat run scripts/deploy.js --network rskmainnet
```

## Uso del Contrato

### Funciones Principales

```solidity
// Crear vault
uint256 vaultId = vault.createVault(
    "Casa en Mendoza",  // name
    "🏠",              // icon
    10 ether,          // target (10 RBTC)
    0,                 // vaultType (Savings)
    address(0),       // beneficiary
    true,              // locked
    unlockTimestamp    // unlock date
);

// Depositar (enviar RBTC con la llamada)
vault.deposit{value: 1 ether}(vaultId);

// Retirar
vault.withdraw(vaultId, 0.5 ether);

// Consultar progreso
uint256 progress = vault.getProgress(vaultId); // 5000 = 50%
```

### Eventos

```solidity
event VaultCreated(uint256 indexed vaultId, address indexed owner, string name, uint256 target, VaultType vaultType);
event DepositMade(uint256 indexed vaultId, address indexed depositor, uint256 amount, uint256 newBalance, uint256 timestamp);
event WithdrawalMade(uint256 indexed vaultId, address indexed withdrawer, uint256 amount, uint256 timestamp);
event VaultCompleted(uint256 indexed vaultId, address indexed owner, uint256 finalBalance, uint256 timestamp);
```

## Integración Backend

### Python (FastAPI)

```python
from app.services.vault_contract_service import VaultContractService

# Configurar
service = VaultContractService(
    contract_address="0x...",  # Del deployment
    private_key="0x..."         # Solo para transacciones
)

# Crear vault
result = await service.create_vault(
    name="Casa",
    icon="🏠",
    target=10.0,
    vault_type=VaultType.SAVINGS
)

# Depositar
result = await service.deposit(vault_id=0, amount=1.0)

# Consultar
vault = await service.get_vault(0)
print(f"Progreso: {vault.progress_percent}%")
```

## Gas Estimation

| Función | Gas Estimado |
|---------|--------------|
| createVault | ~150,000 |
| deposit | ~100,000 |
| withdraw | ~80,000 |
| cancelVault | ~50,000 |

## Seguridad

- Solo el owner del vault puede depositar/retirar
- Los vaults con time-lock no permiten retiros hasta la fecha configurada
- No hay función de pause/pause en esta versión MVP

## Licencia

MIT
