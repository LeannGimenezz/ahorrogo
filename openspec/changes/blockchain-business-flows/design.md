# Design: Blockchain Business Flows API

## Technical Approach
Crear capa `business` separada de `vaults`/`blockchain` para modelar comportamiento de negocio. Reutilizar contrato Rootstock cuando exista `x-private-key` y fallback a intención persistida si no.

## Architecture Decisions
- Router dedicado `business.py` para evitar contaminación de módulos existentes.
- Servicio `business_contract_service.py` para lógica reusable y quotes.
- Persistencia explícita en tablas nuevas (`receive_profiles`, `swap_transactions`, `business_contracts`, `release_rules`).

## File Changes
- `backend/app/api/v1/business.py` — create
- `backend/app/services/business_contract_service.py` — create
- `backend/app/models/schemas.py` — modify
- `backend/app/api/v1/router.py` — modify
- `backend/migrations/002_business_transactions_contracts.sql` — create

## Testing Strategy
- Compilación de sintaxis Python en archivos modificados.
- Pruebas manuales de endpoints vía docs/HTTP client.

## Migration / Rollout
Aplicar migración SQL `002` antes de desplegar endpoints en entorno real.
