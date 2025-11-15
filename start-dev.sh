#!/bin/bash

# Script de inicio rápido para ChatFlow Pro - Bot IA
# Este script inicia backend y frontend automáticamente

echo "🚀 Iniciando ChatFlow Pro - Bot IA"
echo "===================================="
echo ""

# Verificar si existe node_modules en backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias del backend..."
    cd backend && npm install && cd ..
    echo "✅ Backend dependencies installed"
    echo ""
fi

# Verificar si existe node_modules en frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias del frontend..."
    npm install
    echo "✅ Frontend dependencies installed"
    echo ""
fi

# Verificar si existe .env en backend
if [ ! -f "backend/.env" ]; then
    echo "⚠️  ADVERTENCIA: No se encontró backend/.env"
    echo "   Copiando .env.example a .env..."
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo "   ✅ Archivo .env creado"
        echo "   ⚠️  IMPORTANTE: Edita backend/.env con tus credenciales"
        echo ""
    else
        echo "   ❌ No se encontró .env.example"
        echo "   Debes crear backend/.env manualmente"
        echo ""
    fi
fi

echo "🔧 Iniciando servicios..."
echo ""

# Función para manejar la señal de terminación
cleanup() {
    echo ""
    echo "🛑 Deteniendo servicios..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Iniciar backend en background
echo "🖥️  Iniciando Backend (puerto 3000)..."
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo "   Backend PID: $BACKEND_PID"
echo "   Logs: tail -f backend.log"
echo ""

# Esperar 5 segundos para que el backend inicie
sleep 5

# Iniciar frontend en background
echo "🎨 Iniciando Frontend (puerto 5173)..."
npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
echo "   Logs: tail -f frontend.log"
echo ""

# Esperar 3 segundos
sleep 3

echo "✅ Servicios iniciados!"
echo ""
echo "📍 URLs:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   Health:   http://localhost:3000/health"
echo ""
echo "📊 Ver logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Para detener: Presiona Ctrl+C"
echo ""

# Mantener el script corriendo
wait
