#!/bin/bash

echo "================================================"
echo "  AhorroGO - Iniciar Proyectos"
echo "================================================"
echo

# Colores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar directorio
if [ ! -d "backend/app" ] || [ ! -d "frontend/src" ]; then
    echo -e "${RED}[ERROR]${NC} Ejecuta este script desde la raiz del proyecto"
    exit 1
fi

# Backend
echo -e "${BLUE}[1/4]${NC} Verificando dependencias del backend..."
cd backend

if [ ! -d "venv" ]; then
    echo -e "${BLUE}[INFO]${NC} Creando entorno virtual..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -r requirements.txt > /dev/null 2>&1

echo -e "${GREEN}[OK]${NC} Dependencias del backend instaladas"

# Frontend
echo
echo -e "${BLUE}[2/4]${NC} Verificando dependencias del frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[INFO]${NC} Instalando dependencias de npm..."
    npm install
fi

echo -e "${GREEN}[OK]${NC} Dependencias del frontend instaladas"

# Iniciar Backend
echo
echo -e "${BLUE}[3/4]${NC} Iniciando Backend (puerto 8000)..."
cd ../backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}[OK]${NC} Backend iniciado (PID: $BACKEND_PID)"

# Iniciar Frontend
echo
echo -e "${BLUE}[4/4]${NC} Iniciando Frontend (puerto 5173)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}[OK]${NC} Frontend iniciado (PID: $FRONTEND_PID)"

echo
echo "================================================"
echo -e "${GREEN}  Servicios Iniciados!${NC}"
echo "================================================"
echo
echo "   Backend:  http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Frontend: http://localhost:5173"
echo
echo "   Presiona Ctrl+C para detener ambos servicios"
echo "================================================"

# Función para limpiar al salir
cleanup() {
    echo
    echo -e "${BLUE}[INFO]${NC} Deteniendo servicios..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}[OK]${NC} Servicios detenidos"
    exit 0
}

trap cleanup INT TERM

# Esperar
wait