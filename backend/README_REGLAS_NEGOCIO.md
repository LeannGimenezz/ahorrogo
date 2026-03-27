# AhorroGO Backend - Reglas de Negocio

Resumen funcional de reglas de dominio implementadas y esperadas.

## 1. Vaults

- Tipos de vault: `savings`, `rental`, `p2p`.
- Estado de vault: `active`, `completed`, `cancelled`.
- No se puede eliminar un vault bloqueado si no esta completado.
- `progress` se calcula como `current / target` con tope en 1.0.

## 2. Depositos

- Solo sobre vault activo y del usuario autenticado.
- `amount` debe ser mayor a 0.
- `tx_hash` no debe repetirse.
- Si el deposito alcanza el target, el vault pasa a `completed`.

## 3. XP y Niveles

Regla base:

- `1 XP` cada `10` unidades depositadas.
- Bonus por meta completada: `100 XP`.

Niveles:

- Level 1: 0-99 XP
- Level 2: 100-299 XP
- Level 3: 300-599 XP
- Level 4: 600-999 XP
- Level 5: 1000+ XP

## 4. Streak

- Mide constancia de depositos por mes.
- Incrementa al depositar en un mes diferente.
- Se resetea tras inactividad prolongada (regla de 60 dias).

## 5. Mood del Penguin

Estados posibles:

- `idle`
- `happy`
- `celebrating`
- `waiting`

Determinacion general:

- Streak alto favorece `happy`.
- Inactividad prolongada favorece `waiting`.
- Sin actividad reciente suele caer en `idle`.

## 6. Transfers P2P

- Transferencia inicia en `pending`.
- Solo receptor puede confirmar.
- Solo emisor puede cancelar.
- Expira por tiempo si no se confirma.

Estados:

- `pending`
- `confirmed`
- `cancelled`
- `expired`

## 7. Notificaciones

- Se generan por eventos clave (ejemplo: meta completada).
- Pueden filtrarse por no leidas.
- Pueden marcarse individualmente como leidas.

## 8. Seguridad Funcional

- Endpoints de negocio usan JWT para identificar usuario.
- Validaciones de ownership aplican en vaults, transfers y notifications.

## 9. Referencias

- `README.md`
- `README_ENDPOINTS.md`
- `README_BLOCKCHAIN.md`
- `README_INTEGRACIONES.md`
