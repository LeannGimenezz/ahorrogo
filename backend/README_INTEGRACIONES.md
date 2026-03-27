# AhorroGO Backend - Integraciones

Este documento resume como integrar el backend con frontend, infraestructura local y servicios externos.

## 1. Integraciones Activas

- Frontend Web (consume API REST en `/api/v1`)
- Supabase (PostgreSQL)
- RSK RPC (consultas blockchain)
- Webhooks blockchain (entrada de eventos)

## 2. Variables de Entorno

Variables requeridas para levantar e integrar correctamente:

```bash
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET_KEY=
JWT_ALGORITHM=HS256
JWT_EXPIRATION_DAYS=7
RSK_RPC_URL=https://public-node.rsk.co
RSK_CHAIN_ID=30
TROPYKUS_CONTRACT_ADDRESS=
VAULT_CONTRACT_ADDRESS=
APP_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173,https://ahorrogo.app
```

## 3. Integracion con Frontend

### 3.1 URL base

- Base API: `http://localhost:8000`
- Prefijo versionado: `/api/v1`
- Swagger: `/docs`
- Redoc: `/redoc`
- Healthcheck: `/health`

### 3.2 Flujo de autenticacion

1. Frontend solicita firma al usuario.
2. Frontend envia `address`, `signature`, `message` a `POST /api/v1/users/verify`.
3. Backend valida firma y retorna token JWT.
4. Frontend incluye `Authorization: Bearer <token>` en requests autenticados.

### 3.3 Convenciones recomendadas de cliente

- Reintento para errores transitorios `5xx`.
- Manejo explicito de `401`, `403`, `404`, `400`.
- Timeouts de red configurables.
- Registro de `tx_hash` para trazabilidad de depositos.

## 4. Integracion Local (Desarrollo)

### 4.1 Ejecucion con Python

```bash
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4.2 Ejecucion con Docker

```bash
docker-compose up --build
```

## 5. Integracion de QA

Checklist minimo para validar integracion:

- `GET /health` responde `200`.
- `POST /api/v1/users/verify` retorna JWT valido.
- `GET /api/v1/users/me` funciona con token.
- Flujo completo de vault: crear -> depositar -> consultar estado.
- Flujo P2P: crear transfer -> confirmar/cancelar.
- Webhook blockchain procesa `DepositCompleted`.

## 6. Riesgos de Integracion a Revisar

- Validacion de seguridad en webhooks antes de produccion.
- Operaciones de deposito no atomicas (consistencia de datos).
- Cobertura de tests incompleta para algunos flujos E2E.

## 7. Documentos Relacionados

- `README.md`
- `README_ENDPOINTS.md`
- `README_BLOCKCHAIN.md`
- `README_REGLAS_NEGOCIO.md`
