# Imagen base oficial de Node, versión "slim": mucho más liviana que la
# imagen completa, y con tag fijo (22) en vez de "latest" o "lts" para que
# el build sea siempre reproducible.
FROM node:22-slim

# Carpeta de trabajo dentro de la imagen; Docker la crea si no existe.
WORKDIR /app

# 1) Copiamos SOLO el package.json primero e instalamos dependencias.
#    Esta capa cambia poco, así que casi siempre sale de la caché de Docker.
COPY package.json ./
RUN npm install --omit=dev

# 2) Recién ahora copiamos el resto del código (app.js, etc.).
#    Esto va al final porque es lo que más cambia mientras programas:
#    si un cambio de una línea en app.js no debe forzar un npm install de nuevo.
COPY . .

# La imagen oficial de node ya trae un usuario sin privilegios llamado "node".
# Lo usamos para no correr el proceso como root dentro del contenedor.
USER node

# Documenta el puerto en el que escucha la app (no lo publica, eso lo hace
# el "-p" o el "ports:" de compose).
EXPOSE 3000

# Comando que arranca el contenedor: un solo proceso, la API de Node.
CMD ["node", "app.js"]
