# ---- Etapa 1: dependencias ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# ---- Etapa 2: imagen final, distroless ----
FROM gcr.io/distroless/nodejs22-debian12:nonroot
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json app.js ./

EXPOSE 3000
CMD ["app.js"]
