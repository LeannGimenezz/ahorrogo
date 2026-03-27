## Exploration: Blockchain Business Flows + Contracts + Rootstock Transactions

### Current State
- El backend ya tiene endpoints de vaults, transferencias y utilidades blockchain.
- Existen servicios para contrato `AhorroGOVault` y lectura de RSK.
- Faltaba una capa explícita de casos de negocio (P2P protegido, garantía activa, metas con candado, swap/receive/send unificados).

### Affected Areas
- `backend/app/models/schemas.py`
- `backend/app/api/v1/router.py`
- `backend/app/api/v1/business.py` (nuevo)
- `backend/app/services/business_contract_service.py` (nuevo)
- `backend/migrations/002_business_transactions_contracts.sql` (nuevo)

### Approaches
1. Integrar todo en endpoints existentes (`vaults`, `blockchain`, `transfers`) — rápido pero acopla demasiado.
2. Crear módulo `business` dedicado y reutilizar servicios actuales — más limpio y escalable.

### Recommendation
Enfoque 2: módulo `business` para orquestar lógica de negocio y usar servicios blockchain/vault como piezas de infraestructura.

### Risks
- Dependencia de migraciones nuevas en Supabase para tablas `business_contracts`, `swap_transactions`, etc.
- Algunas operaciones on-chain quedan como intención/transacción simulada si no hay private key o contrato conectado.

### Ready for Proposal
Yes.
