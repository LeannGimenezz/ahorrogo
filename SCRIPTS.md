# AhorroGO - Scripts de Inicio

## Inicio Rápido

### Windows (PowerShell) - Recomendado
```powershell
# Doble clic en start.ps1 o ejecutar:
.\start.ps1
```

### Windows (Command Prompt)
```cmd
start.bat
```

### Linux/macOS (Bash)
```bash
chmod +x start.sh
./start.sh
```

---

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `start.ps1` | Inicia ambos proyectos (PowerShell) |
| `start.bat` | Inicia ambos proyectos (CMD) |
| `start.sh` | Inicia ambos proyectos (Bash) |
| `stop.ps1` | Detiene todos los servicios (PowerShell) |
| `stop.bat` | Detiene todos los servicios (CMD) |

---

## Lo que hacen los scripts

### 1. Verifican dependencias
- Backend: Python virtual environment + requirements.txt
- Frontend: npm install si falta node_modules

### 2. Inician servicios
- Backend: `uvicorn app.main:app --reload --port 8000`
- Frontend: `npm run dev --port 5173`

### 3. Abren ventanas separadas
- Cada servicio corre en su propia ventana
- Los logs son visibles en tiempo real

---

## URLs

| Servicio | URL |
|----------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:8000 |
| **API Docs** | http://localhost:8000/docs |
| **Health Check** | http://localhost:8000/health |

---

## Troubleshooting

### Puerto en uso
```powershell
# Verificar qué está usando el puerto 8000
netstat -ano | findstr :8000

# Verificar puerto 5173
netstat -ano | findstr :5173
```

### Error de Python
```powershell
# Verificar Python instalado
python --version

# Verificar pip
pip --version
```

### Error de Node/npm
```powershell
# Verificar Node
node --version

# Verificar npm
npm --version
```

### Reiniciar desde cero
```powershell
# Detener servicios
.\stop.ps1

# Limpiar cache
cd frontend
rm -r node_modules
npm install

# Reiniciar
.\start.ps1
```

---

## Demo Mode

Si no tienes Beexo wallet, puedes usar el **Demo Mode**:

1. Ir a http://localhost:5173
2. Clic en "Ingresar dirección manual"
3. Ingresar cualquier dirección (ej: `0x1234`)
4. Clic en "Continuar"

O usar el botón **"Demo sin wallet"** que carga datos mock.

---

## Estructura del Proyecto

```
ahorrogo/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints REST
│   │   ├── services/        # Lógica de negocio
│   │   ├── models/          # Modelos Pydantic
│   │   └── main.py          # Entry point
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Hooks personalizados
│   │   ├── services/        # API client
│   │   ├── store/           # Estado (Zustand)
│   │   └── types/           # TypeScript types
│   ├── package.json
│   └── .env.local
├── start.ps1                # Iniciar (PowerShell)
├── start.bat                # Iniciar (CMD)
├── start.sh                 # Iniciar (Bash)
├── stop.ps1                 # Detener (PowerShell)
└── stop.bat                 # Detener (CMD)
```

---

## Próximos Pasos

1. **Crear usuario de prueba**: Ir a `/login` y usar demo mode
2. **Probar endpoints**: Ir a `/docs` para ver todos los endpoints
3. **Crear vault**: Ir a `/create` y crear un vault de prueba
4. **Ver vaults**: Ir a `/vaults` para ver los vaults creados

---

## Soporte

Si tienes problemas:
1. Verifica que los puertos 8000 y 5173 estén libres
2. Asegúrate de tener Python 3.11+ y Node 18+
3. Intenta reiniciar desde cero (ver troubleshooting arriba)