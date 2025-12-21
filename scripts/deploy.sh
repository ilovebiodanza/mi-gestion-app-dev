#!/bin/bash

# Detener el script si cualquier comando falla
set -e

echo "🚀 Iniciando despliegue seguro a Producción..."

# 1. Limpieza previa
rm -rf dist

# 2. Construir proyecto (Vite)
echo "📦 Construyendo versión de producción..."
npm run build

# 3. Ofuscar código (Protección)
# Nota: Asegúrate de que este script en package.json apunte a la carpeta /dist
echo "🔒 Aplicando ofuscación de código..."
npm run obfuscate

# 4. Validar existencia de dist
if [ ! -d "dist" ]; then
  echo "❌ Error: La carpeta dist no se generó."
  exit 1
fi

# 5. Desplegar al repositorio de producción
# Usamos el flag -r para especificar el repositorio remoto de destino
echo "☁️  Subiendo a GitHub Pages (mi-gestion/app)..."
# Cambia esto:
# npx gh-pages -d dist -t -f --repo https://github.com/mi-gestion/app.git

# Por esto (URL de SSH):
npx gh-pages -d dist -t -f --repo git@github.com:mi-gestion/app.git

echo "✅ ¡Despliegue completado con éxito!"
echo "🌐 URL: https://mi-gestion.github.io/app/"