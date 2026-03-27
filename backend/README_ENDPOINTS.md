# AhorroGO Backend - Endpoints

Inventario funcional de endpoints del backend.

## 1. Base URL

- Prefijo API: `/api/v1`
- Health: `/health`

## 2. Users

### `POST /api/v1/users/verify`

- Verifica firma y crea/retorna usuario.
- Retorna JWT.

### `GET /api/v1/users/me`

- Retorna usuario autenticado.

### `GET /api/v1/users/{address}`

- Busca usuario por address.
- Incluye bandera de garantia activa.

## 3. Vaults

### `GET /api/v1/vaults`

- Lista vaults del usuario.
- Incluye agregados `total_saved` y `total_target`.

### `POST /api/v1/vaults`

- Crea vault nuevo.

### `GET /api/v1/vaults/{vault_id}`

- Detalle de vault + actividades.

### `PUT /api/v1/vaults/{vault_id}`

- Actualiza nombre/icono.

### `DELETE /api/v1/vaults/{vault_id}`

- Elimina vault segun reglas de lock/estado.

### `POST /api/v1/vaults/{vault_id}/deposit`

- Registra deposito.
- Actualiza vault, XP, nivel, streak y mood.

### `GET /api/v1/vaults/{vault_id}/yield`

- Retorna estimacion de yield del vault.

## 4. Penguin

### `GET /api/v1/penguin`

- Estado de gamificacion del usuario.
- Incluye mood, accesorios, objetivos y ahorro total.

## 5. Transfers

### `POST /api/v1/transfers`

- Crea transferencia P2P pendiente.

### `GET /api/v1/transfers/{transfer_id}`

- Estado y detalle de transferencia.

### `POST /api/v1/transfers/{transfer_id}/confirm`

- Confirma transferencia por receptor.

### `POST /api/v1/transfers/{transfer_id}/cancel`

- Cancela transferencia por emisor.

## 6. Webhooks

### `POST /api/v1/webhooks/blockchain`

- Procesa evento blockchain `DepositCompleted`.

## 7. Notifications

### `GET /api/v1/notifications`

- Lista notificaciones.
- Query opcional: `unread_only=true|false`.

### `PUT /api/v1/notifications/{notification_id}/read`

- Marca notificacion como leida.

## 8. Health

### `GET /health`

- Estado de la app.

## 9. Referencias

- `README.md`
- `README_BLOCKCHAIN.md`
- `README_INTEGRACIONES.md`
- `README_REGLAS_NEGOCIO.md`
