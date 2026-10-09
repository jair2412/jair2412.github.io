#!/usr/bin/env bash
# armar-sitio.sh
# Construye _site/ con SOLO los archivos públicos del perfil.
# Lo usan el job build (para publicar) y el job test (para probar),
# así probamos exactamente lo mismo que se publica.

set -euo pipefail          # detiene el script ante cualquier error

rm -rf _site               # borra una construcción anterior
mkdir -p _site             # crea la carpeta de salida

# Tu sitio solo tiene estos dos archivos públicos (los estilos van dentro del HTML)
cp index.html _site/
cp libro-de-visitas.js _site/

echo "Sitio armado en _site/:"
ls -R _site                # muestra lo que se va a publicar
