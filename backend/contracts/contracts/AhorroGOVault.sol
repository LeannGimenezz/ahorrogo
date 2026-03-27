// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title AhorroGOVault
 * @dev Smart Contract de Vault de Ahorro para RSK
 * 
 * Características:
 * - Depósitos en RBTC
 * - Time-lock opcional (hasta fecha objetivo)
 * - Meta de ahorro (target)
 * - Tracking de yield generado
 * - Eventos para integración backend
 * - Integración con Tropykus para yield real
 * 
 * @author AhorroGO Team
 * @notice Para uso en hackathon Rootstock + Beexo Connect
 */
contract AhorroGOVault {
    
    // ============================================================================
    // ENUMS Y ESTRUCTURAS
    // ============================================================================
    
    enum VaultStatus { Active, Completed, Cancelled }
    enum VaultType { Savings, Rental, P2P }
    
    struct Vault {
        address owner;
        string name;
        string icon;           // Emoji
        uint256 target;        // Meta en wei (18 decimales)
        uint256 current;       // Balance actual en wei
        VaultType vaultType;
        address beneficiary;    // Para rental: dirección del propietario
        bool locked;           // Si tiene time-lock activo
        uint256 unlockDate;    // Timestamp de desbloqueo
        VaultStatus status;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    // ============================================================================
    // ESTADO DEL CONTRATO
    // ============================================================================
    
    // Mapping de vaults: vaultId => Vault
    mapping(uint256 => Vault) public vaults;
    
    // Mapping de dueño: address => array de vaultIds
    mapping(address => uint256[]) public ownerVaults;
    
    // Contadores
    uint256 public vaultCounter;
    
    // Dirección del contrato de Tropykus (para consulta de yield)
    address public tropykusAddress;
    
    // Dirección del owner del contrato (admin)
    address public owner;
    
    // ============================================================================
    // EVENTOS
    // ============================================================================
    
    event VaultCreated(
        uint256 indexed vaultId,
        address indexed owner,
        string name,
        uint256 target,
        VaultType vaultType
    );
    
    event DepositMade(
        uint256 indexed vaultId,
        address indexed depositor,
        uint256 amount,
        uint256 newBalance,
        uint256 timestamp
    );
    
    event WithdrawalMade(
        uint256 indexed vaultId,
        address indexed withdrawer,
        uint256 amount,
        uint256 timestamp
    );
    
    event VaultCompleted(
        uint256 indexed vaultId,
        address indexed owner,
        uint256 finalBalance,
        uint256 timestamp
    );
    
    event VaultCancelled(
        uint256 indexed vaultId,
        address indexed owner,
        uint256 timestamp
    );
    
    event VaultUnlocked(
        uint256 indexed vaultId,
        uint256 timestamp
    );
    
    event YieldClaimed(
        uint256 indexed vaultId,
        address indexed claimer,
        uint256 yieldAmount,
        uint256 timestamp
    );
    
    event TropykusUpdated(
        address indexed oldAddress,
        address indexed newAddress
    );
    
    // ============================================================================
    // MODIFICADORES
    // ============================================================================
    
    modifier onlyVaultOwner(uint256 vaultId) {
        require(vaults[vaultId].owner == msg.sender, "Caller is not vault owner");
        _;
    }
    
    modifier onlyActiveVault(uint256 vaultId) {
        require(vaults[vaultId].status == VaultStatus.Active, "Vault is not active");
        _;
    }
    
    modifier notLocked(uint256 vaultId) {
        Vault storage vault = vaults[vaultId];
        if (vault.locked) {
            require(
                block.timestamp >= vault.unlockDate,
                "Vault is locked until unlock date"
            );
        }
        _;
    }
    
    modifier onlyUnlocked(uint256 vaultId) {
        Vault storage vault = vaults[vaultId];
        if (vault.locked) {
            require(
                block.timestamp >= vault.unlockDate,
                "Vault time-lock not expired"
            );
        }
        _;
    }
    
    // ============================================================================
    // CONSTRUCTOR
    // ============================================================================
    
    constructor() {
        owner = msg.sender;
        vaultCounter = 0;
    }
    
    // ============================================================================
    // FUNCIONES PRINCIPALES DE VAULT
    // ============================================================================
    
    /**
     * @dev Crea un nuevo vault de ahorro
     * @param name Nombre del vault (ej: "Casa en Mendoza")
     * @param icon Emoji para el vault (ej: "🏠")
     * @param target Meta de ahorro en wei
     * @param vaultType Tipo de vault (0=Savings, 1=Rental, 2=P2P)
     * @param beneficiary Para rental: dirección del beneficiario
     * @param locked Si el vault tiene time-lock
     * @param unlockDate Timestamp de desbloqueo (si locked=true)
     * @return vaultId ID del vault creado
     */
    function createVault(
        string memory name,
        string memory icon,
        uint256 target,
        VaultType vaultType,
        address beneficiary,
        bool locked,
        uint256 unlockDate
    ) external returns (uint256 vaultId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(target > 0, "Target must be greater than 0");
        require(target <= 1e30, "Target too large"); // Max 1 billion RBTC
        
        if (locked) {
            require(unlockDate > block.timestamp, "Unlock date must be in the future");
        }
        
        vaultId = vaultCounter++;
        
        Vault storage newVault = vaults[vaultId];
        newVault.owner = msg.sender;
        newVault.name = name;
        newVault.icon = icon;
        newVault.target = target;
        newVault.current = 0;
        newVault.vaultType = vaultType;
        newVault.beneficiary = beneficiary;
        newVault.locked = locked;
        newVault.unlockDate = locked ? unlockDate : 0;
        newVault.status = VaultStatus.Active;
        newVault.createdAt = block.timestamp;
        newVault.updatedAt = block.timestamp;
        
        ownerVaults[msg.sender].push(vaultId);
        
        emit VaultCreated(vaultId, msg.sender, name, target, vaultType);
    }
    
    /**
     * @dev Deposita fondos en un vault
     * @param vaultId ID del vault
     * @return newBalance Nuevo balance del vault
     */
    function deposit(uint256 vaultId) 
        external 
        payable 
        onlyVaultOwner(vaultId) 
        onlyActiveVault(vaultId)
        notLocked(vaultId)
        returns (uint256 newBalance) 
    {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        
        Vault storage vault = vaults[vaultId];
        vault.current += msg.value;
        vault.updatedAt = block.timestamp;
        
        newBalance = vault.current;
        
        // Verificar si se alcanzó la meta
        if (vault.current >= vault.target) {
            vault.status = VaultStatus.Completed;
            emit VaultCompleted(vaultId, vault.owner, vault.current, block.timestamp);
        }
        
        emit DepositMade(vaultId, msg.sender, msg.value, vault.current, block.timestamp);
    }
    
    /**
     * @dev Retira fondos del vault (parcial o total)
     * @param vaultId ID del vault
     * @param amount Cantidad a retirar en wei
     * @return success Si la operación fue exitosa
     */
    function withdraw(uint256 vaultId, uint256 amount) 
        external 
        onlyVaultOwner(vaultId) 
        onlyActiveVault(vaultId)
        onlyUnlocked(vaultId)
        returns (bool success) 
    {
        require(amount > 0, "Withdrawal amount must be greater than 0");
        
        Vault storage vault = vaults[vaultId];
        require(vault.current >= amount, "Insufficient balance");
        
        vault.current -= amount;
        vault.updatedAt = block.timestamp;
        
        // Transferir fondos al owner
        (success, ) = payable(vault.owner).call{value: amount}("");
        require(success, "Transfer failed");
        
        emit WithdrawalMade(vaultId, msg.sender, amount, block.timestamp);
    }
    
    /**
     * @dev Cancela un vault (solo si está vacío o el owner lo decide)
     * @param vaultId ID del vault
     */
    function cancelVault(uint256 vaultId) 
        external 
        onlyVaultOwner(vaultId) 
        onlyActiveVault(vaultId)
    {
        Vault storage vault = vaults[vaultId];
        
        // Solo puede cancelar si está vacío o no tiene lock activo
        require(vault.current == 0 || !vault.locked, "Cannot cancel locked vault with funds");
        
        vault.status = VaultStatus.Cancelled;
        vault.updatedAt = block.timestamp;
        
        emit VaultCancelled(vaultId, msg.sender, block.timestamp);
    }
    
    // ============================================================================
    // FUNCIONES DE CONSULTA
    // ============================================================================
    
    /**
     * @dev Obtiene información completa de un vault
     * @param vaultId ID del vault
     * @return Vault struct completo
     */
    function getVault(uint256 vaultId) external view returns (Vault memory) {
        return vaults[vaultId];
    }
    
    /**
     * @dev Obtiene los vault IDs de un usuario
     * @param user Dirección del usuario
     * @return Array de vault IDs
     */
    function getUserVaults(address user) external view returns (uint256[] memory) {
        return ownerVaults[user];
    }
    
    /**
     * @dev Obtiene el progreso del vault (0-10000 = 0-100%)
     * @param vaultId ID del vault
     * @return progress Progreso en basis points (ej: 4200 = 42%)
     */
    function getProgress(uint256 vaultId) external view returns (uint256 progress) {
        Vault storage vault = vaults[vaultId];
        if (vault.target == 0) return 0;
        return (vault.current * 10000) / vault.target;
    }
    
    /**
     * @dev Verifica si un vault está desbloqueado
     * @param vaultId ID del vault
     * @return unlocked true si está desbloqueado
     */
    function isUnlocked(uint256 vaultId) external view returns (bool unlocked) {
        Vault storage vault = vaults[vaultId];
        if (!vault.locked) return true;
        return block.timestamp >= vault.unlockDate;
    }
    
    /**
     * @dev Obtiene el tiempo restante hasta desbloqueo
     * @param vaultId ID del vault
     * @return secondsRemaining Segundos restantes (0 si no hay lock)
     */
    function getTimeRemaining(uint256 vaultId) external view returns (uint256 secondsRemaining) {
        Vault storage vault = vaults[vaultId];
        if (!vault.locked) return 0;
        if (block.timestamp >= vault.unlockDate) return 0;
        return vault.unlockDate - block.timestamp;
    }
    
    // ============================================================================
    // FUNCIONES DE YIELD (Tropykus Integration)
    // ============================================================================
    
    /**
     * @dev Establece la dirección del contrato de Tropykus
     * @param _tropykusAddress Nueva dirección
     */
    function setTropykusAddress(address _tropykusAddress) external {
        require(msg.sender == owner, "Only owner can set Tropykus address");
        emit TropykusUpdated(tropykusAddress, _tropykusAddress);
        tropykusAddress = _tropykusAddress;
    }
    
    /**
     * @dev Calcula yield estimado basado en balance y tiempo
     * @param vaultId ID del vault
     * @param apy APY como porcentaje (ej: 500 = 5%)
     * @return yieldAmount Yield estimado en wei
     * 
     * Nota: En producción, esto debería consultar Tropykus directamente
     * para obtener el yield real generado.
     */
    function calculateEstimatedYield(
        uint256 vaultId, 
        uint256 apy
    ) external view returns (uint256 yieldAmount) {
        Vault storage vault = vaults[vaultId];
        if (vault.current == 0) return 0;
        
        uint256 daysElapsed = (block.timestamp - vault.updatedAt) / 1 days;
        if (daysElapsed == 0) return 0;
        
        // Cálculo: principal * (apy/100/365) * days
        yieldAmount = (vault.current * apy * daysElapsed) / (100 * 365);
    }
    
    // ============================================================================
    // FUNCIONES DE ADMIN
    // ============================================================================
    
    /**
     * @dev Transfiere ownership del contrato
     * @param newOwner Nueva dirección de owner
     */
    function transferOwnership(address newOwner) external {
        require(msg.sender == owner, "Only owner can transfer ownership");
        owner = newOwner;
    }
    
    /**
     * @dev Permite recibir ETH
     */
    receive() external payable {}
    
    /**
     * @dev Función fallback
     */
    fallback() external payable {}
}
