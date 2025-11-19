#!/bin/bash

echo "🔍 Verificando configuración de ChatFlow Pro..."
echo ""

# 1. Verificar .env.local
echo "1️⃣ Verificando archivo .env.local..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local existe"

    if grep -q "VITE_SUPABASE_URL" .env.local; then
        echo "   ✅ VITE_SUPABASE_URL encontrado"
    else
        echo "   ❌ VITE_SUPABASE_URL NO encontrado"
    fi

    if grep -q "VITE_SUPABASE_ANON_KEY" .env.local; then
        echo "   ✅ VITE_SUPABASE_ANON_KEY encontrado"
    else
        echo "   ❌ VITE_SUPABASE_ANON_KEY NO encontrado"
    fi
else
    echo "   ❌ .env.local NO existe"
fi

echo ""

# 2. Verificar node_modules
echo "2️⃣ Verificando dependencias..."
if [ -d "node_modules/@supabase" ]; then
    echo "   ✅ @supabase/supabase-js instalado"
else
    echo "   ❌ @supabase/supabase-js NO instalado"
    echo "      Ejecutar: npm install"
fi

echo ""

# 3. Instrucciones
echo "🚀 Pasos para ejecutar:"
echo ""
echo "   1. Si hay un servidor corriendo, detenerlo (Ctrl+C)"
echo "   2. Ejecutar: npm run dev"
echo "   3. Abrir: http://localhost:3000"
echo "   4. Si la página está en blanco:"
echo "      - Abrir DevTools (F12)"
echo "      - Ver la pestaña Console"
echo "      - Buscar errores en rojo"
echo ""
echo "📧 Credenciales de prueba:"
echo "   Email: demo@chatflow.pro"
echo "   Password: (la que configuraste en Supabase Dashboard)"
echo ""
