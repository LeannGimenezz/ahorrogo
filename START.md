# AhorroGO

> Gamified Savings on Bitcoin (RSK)

## Inicio Rápido

### Opción 1: Scripts automatizados (Recomendado)

**Windows PowerShell:**
```powershell
.\start.ps1
```

**Windows CMD:**
```cmd
start.bat
```

**Linux/macOS:**
```bash
chmod +x start.sh && ./start.sh
```

### Opción 2: Manual

**Terminal 1 - Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## URLs

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Health | http://localhost:8000/health |

## Stack Tecnológico

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** Supabase (PostgreSQL)
- **Blockchain:** RSK Testnet + Web3.py
- **DeFi:** Topykus Protocol

### Frontend
- **Framework:** React 19 + TypeScript
- **Build:** Vite
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Animations:** Framer Motion
- **Routing:** React Router 7

## Estructura

```
ahorrogo/
├── backend/                 # FastAPI API
│   ├── app/
│   │   ├── api/v1/         # REST endpoints
│   │   ├── services/      # Business logic
│   │   ├── models/         # Pydantic schemas
│   │   └── main.py
│   └── requirements.txt
├── frontend/               # React App
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API clients
│   │   ├── store/          # Zustand store
│   │   └── types/          # TypeScript types
│   └── package.json
├── contracts/              # Smart contracts
│   └── AhorroGOVault.sol
├── start.ps1               # Start script (PowerShell)
├── start.sh                # Start script (Bash)
└── README.md
```

## Endpoints Principales

### Autenticación
- `POST /users/verify` - Login con Beexo wallet

### Usuarios
- `GET /users/me` - Info del usuario actual
- `GET /users/me/balance` - Balance total

### Vaults
- `GET /vaults` - Lista de vaults
- `POST /vaults` - Crear vault
- `GET /vaults/{id}` - Detalle de vault
- `POST /vaults/{id}/deposit` - Depositar
- `POST /vaults/{id}/withdraw` - Retirar
- `GET /vaults/{id}/yield` - Yield generado

### Blockchain
- `GET /blockchain/network` - Info de red RSK
- `GET /blockchain/markets` - Mercados Topykus
- `POST /blockchain/vault/create` - Crear vault on-chain
- `POST /blockchain/vault/deposit` - Depositar on-chain

## Demo Mode

Si no tienes Beexo wallet:
1. Ir a http://localhost:5173
2. Clic en "Demo sin wallet"
3. Usar datos mock para probar

## Desarrollo

### Configurar entorno

**Backend:**
```bash
cd backend
cp .env.example .env
# Editar .envcon tus credenciales
```

**Frontend:**
```bash
cd frontend
cp .env.example .env.local
# Editar .env.local con tu API URL
```

### Variables de entorno

**Backend (.env):**
```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET_KEY=your-secret
RSK_RPC_URL=https://public-node.testnet.rsk.co
VAULT_CONTRACT_ADDRESS=0x...
```

**Frontend (.env.local):**
```
VITE_API_URL=http://localhost:8000/api/v1
VITE_RSK_CHAIN_ID=31
VITE_MOCK_DATA=false
```

## Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## Deploy

Ver documentación separada en `docs/` para deploy en producción.

## Licencia

MIT

---

## Scripts de Inicio

Ver `SCRIPTS.md` para documentación detallada de los scripts de inicio.

| Script | Uso |
|--------|-----|
| `start.ps1` | Windows PowerShell |
| `start.bat` | Windows CMD |
| `start.sh` | Linux/macOS |
| `stop.ps1` | Detener servicios |
| `stop.bat` | Detener servicios |