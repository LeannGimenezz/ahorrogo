# AhorroGO - Modo Demo

## Cambios Realizados

Se ha desactivado la autenticación con Beexo wallet y se ha habilitado el **Modo Demo**:

### Autenticación
- ✅ Login automático con datos mock
- ✅ Usuario demo pre-configurado
- ✅ Sin necesidad de wallet real

### Usuario Demo
```
id: demo-user-1
address: 0xF5fae80a7165E8e998814aBc0F81027A33f94134
alias: demo.ahorrogo
xp: 350
level: 3
streak: 5
```

### Vaults Demo
```
1. MacBook Pro - $750/$2,500 (savings)
2. Vacation Fund - $2,000/$5,000 (savings)
```

---

## Iniciar Aplicación

### Opción 1: Script automático
```powershell
cd C:\Users\leang\Desktop\ahorrogo
.\start-clean.ps1
```

### Opción 2: Manual
```powershell
# Terminal 1: Backend
cd C:\Users\leang\Desktop\ahorrogo\backend
.\venv\Scripts\activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd C:\Users\leang\Desktop\ahorrogo\frontend
npm run dev
```

---

## URLs

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:5173 | Aplicación React |
| Backend | http://localhost:8000 | API FastAPI |
| API Docs | http://localhost:8000/docs | Swagger UI |

---

## Funcionalidades Disponibles

### Sin Backend (Solo Frontend)
- ✅ Ver página de inicio con balance mock
- ✅ Ver lista de vaults
- ✅ Crear vault (sin persistencia)
- ✅ Ver perfil

### Con Backend
- ✅ Crear vaults (persistidos en DB)
- ✅ Depositar/retirar
- ✅ Ver historial de movimientos
- ✅ Sincronizar con blockchain

---

## Próximos Pasos

1. **Integrar Beexo Wallet** (cuando esté disponible):
   - Reactivar `AuthProvider` y `ProtectedRoute`
   - Habilitar LoginPage
   - Conectar firma de wallet

2. **Habilitar Blockchain**:
   - Configurar `x-private-key` header
   - Integrar con contrato desplegado en RSK

3. **Producción**:
   - Configurar variables de entorno
   - Desplegar en servidor

---

## Estructura de Archivos

```
src/
├── App.tsx                # App simplificada (demo mode)
├── hooks/
│   └── useAuth.ts         # Auth con datos mock
├── store/
│   └── useAppStore.ts     # Store con initMockData()
└── pages/
    ├── HomePage.tsx       # Página principal
    ├── VaultsPage.tsx      # Lista de vaults
    ├── CreateVaultPage.tsx # Crear vault
    └── ...
```

---

## Notas

- Los datos NO se guardan en el backend en modo demo
- Los vaults creados se pierden al recargar la página
- Para persistencia real, usar el backend