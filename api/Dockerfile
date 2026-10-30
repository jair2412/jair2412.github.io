# api: Node.js con Express. Sigue las seis reglas del LAB-02:
# tag fijo, dependencias antes que código, sin root, sin secretos, imagen chica, un proceso.
FROM node:25-alpine

ENV NODE_ENV=production
WORKDIR /app

# Parches de seguridad de Alpine que la imagen base todavía no trae (Trivy CRITICAL,HIGH, B1 del LAB-04)
RUN apk upgrade --no-cache

COPY package*.json ./
# Después de instalar, se borran npm, npx, corepack y yarn: la API solo necesita "node" para correr,
# y el npm que trae la imagen base arrastra HIGH en sus propias dependencias (brace-expansion, pacote, sigstore...).
# Lo que no está en la imagen no se puede explotar.
RUN npm ci --omit=dev \
 && npm cache clean --force \
 && rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack /opt/yarn-v* \
           /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /usr/local/bin/yarn /usr/local/bin/yarnpkg

COPY app.js server.js ./

# node es el uid 1000 en la imagen oficial. Numérico para que Kubernetes pueda verificar runAsNonRoot.
USER 1000
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["wget", "-qO-", "http://127.0.0.1:3000/api/health"]

CMD ["node", "server.js"]
