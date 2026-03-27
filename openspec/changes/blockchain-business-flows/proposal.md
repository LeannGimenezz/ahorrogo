# Proposal: Blockchain Business Flows API (SDD)

## Intent
Implementar endpoints de negocio que traduzcan los casos de uso de AhorroGO a flujos transaccionales sobre Rootstock y modelo de contratos.

## Scope

### In Scope
- Endpoints para deposit, receive, swap, send.
- Endpoints para contratos: P2P protegido, garantía alquiler, meta con candado, aprobación/liberación.
- Endpoint de motivación financiera para vaults.
- Migraciones para persistencia de perfiles de recepción, swaps y contratos de negocio.

### Out of Scope
- Frontend completo de todas las pantallas faltantes.
- Integración DEX real para swap (cotización mock inicial).

## Approach
Crear módulo `business` y servicio `business_contract_service` para orquestar persistencia + llamadas on-chain opcionales con `x-private-key`.

## Risks
- Entornos sin migraciones aplicadas fallarán en tablas nuevas.
- Operaciones swap/release aún pueden ser pseudo-transacciones hasta integrar protocolo final.

## Rollback Plan
Revertir `router.py`, `business.py`, `business_contract_service.py`, migración `002` y schemas nuevos.

## Success Criteria
- [ ] Endpoints responden con contratos de datos claros.
- [ ] Flujo de contratos permite crear/aprobar/liberar.
- [ ] Build/lint básico backend sin errores de sintaxis.
