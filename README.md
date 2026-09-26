# Perfil: Jair Alegria Medina

Sitio personal publicado en https://jair2412.github.io

## Cómo se publica
Cada push a `main` despliega automáticamente con GitHub Pages.

## Flujo de trabajo
- `main` protegida; todo cambio entra por pull request
- Una rama por cambio: `feature/*`, `fix/*`
- Mensajes de commit en imperativo, ≤ 50 caracteres

## Historial del curso
- **S02**: Sitio inicial, ramas y pull requests
- **S03**: LAB-02, contenedorización con Docker (api + db + web), Codespaces y GHCR
## LAB-02: Contenedores

Arquitectura de tres servicios (`api` en Node.js/Express, `db` en PostgreSQL,
`web` con nginx) orquestados con `compose.yaml`. Solo `web` publica un
puerto al host; `api` y `db` únicamente se alcanzan por la red interna
de Docker. Persistencia de `db` verificada con volumen (sobrevive a
`docker compose down`, se pierde con `docker compose down -v`).

Imágenes públicas en GHCR:
- `ghcr.io/jair2412/lab02-web:1.0`
- `ghcr.io/jair2412/lab02-api:1.0`

### Bitácora: qué no funcionó (y por qué)

**1. `docker-in-docker` fallaba al crear el Codespace.**
La feature usa por defecto la opción `moby`, que no está disponible en la
imagen base `mcr.microsoft.com/devcontainers/base:ubuntu` (paquete
`moby-cli` ausente en esa distribución). Solución: `"moby": false` en las
opciones de la feature dentro de `devcontainer.json`.

**2. Timeouts de red intermitentes entre contenedores.**
En más de una ocasión, `api` no lograba conectar con `db` (o `web` con
`api`) aunque el DNS interno sí resolvía el nombre del servicio
(`getent hosts` funcionaba, pero la conexión TCP se quedaba esperando
sin responder). Pasó tanto en un Codespace ya usado como en uno recién
creado, así que no es un problema de "algo que rompí", sino del propio
entorno de Docker-in-Docker de Codespaces.

Causa raíz encontrada: el sistema corre en paralelo dos conjuntos de
reglas de firewall, `nftables` y `iptables-legacy`. Docker gestiona bien
el primero (política `FORWARD ACCEPT`), pero el segundo queda con
política `FORWARD DROP` y Docker no lo actualiza, así que el kernel
bloquea el tráfico entre contenedores aunque el conjunto moderno lo
permita.

Diagnóstico paso a paso:

docker compose exec api getent hosts db # resuelve bien
docker compose exec api timeout 5 node -e "..." # cuelga: código 124
sudo iptables-legacy -L FORWARD -n # policy DROP
sudo iptables-legacy -L DOCKER-ISOLATION-STAGE-2 -n # solo DROP, sin ACCEPT


Solución aplicada y automatizada en `postStartCommand` de
`devcontainer.json`, para que no dependa de que alguien la corra a mano
en cada Codespace nuevo:

sudo iptables-legacy -P FORWARD ACCEPT || true; docker compose up -d

Verificado en un Codespace creado desde cero: `curl /api/health` respondió
`200 OK` sin ninguna intervención manual.

**3. Imágenes corruptas tras varios reinicios forzados del demonio Docker.**
Después de forzar (`sudo pkill dockerd`) el reinicio del demonio varias
veces seguidas para depurar el punto anterior, un `docker compose build`
posterior generó imágenes con tamaño anómalo (KB en vez de MB) y un error
de `failed to extract layer ... content digest ... not found`. La caché
de build de `buildx` había quedado corrupta. Solución:
`docker builder prune -af` seguido de `docker compose build --no-cache`.

### Reto 1: Imagen mínima

- **Decisión:** Dockerfile de `api` en dos etapas: `node:22-alpine` para
  instalar dependencias, e imagen final `gcr.io/distroless/nodejs22-debian12:nonroot`
  para ejecutar (sin shell, sin gestor de paquetes, usuario no root por defecto).
- **Alternativas que evalué:**
  - Multi-stage con Alpine en ambas etapas: pasó de 348MB a 244MB (74% de la
    original) — mejora, pero no suficiente.
  - La misma versión Alpine, borrando `npm`/`npx`/`corepack` de la imagen
    final: no cambió el tamaño en absoluto (244MB), porque esos binarios
    son livianos frente al resto del sistema Alpine.
  - Distroless `nonroot`: 211MB / 53.4MB de contenido, el mejor resultado
    (64% de la original).
- **Por qué elegí esta:** de las tres, es la que menos peso agrega y de
  paso resuelve otra regla (usuario no root) sin configuración extra.
- **Fuentes consultadas:**
  - https://github.com/GoogleContainerTools/distroless
  - https://docs.docker.com/build/building/multi-stage/
- **Cómo lo verifiqué:**

docker images jair2412githubio-api # antes: 348MB / 83.3MB
# después: 211MB / 53.4MB
docker history jair2412githubio-api:latest --no-trunc
curl http://localhost:8080/api/health # {"status":"ok"}, la app sigue funcionando

- **Qué no me funcionó:** el criterio pide menos de la mitad del tamaño
  original, y no lo logré (llegué a 64%, no a <50%). Con `docker history`
  confirmé que el motivo es que ~124MB de la imagen distroless corresponden
  al runtime de Node.js en sí (con soporte completo de internacionalización,
  ICU), no a mi código ni a mis dependencias (`node_modules` pesa apenas
  5.63MB). No encontré una variante oficial de esa imagen distroless con
  ICU reducido para aligerar más sin recompilar Node desde cero, algo que
  quedó fuera del alcance razonable de tiempo para este reto.

### Reto 2: Arranque ordenado

- **Decisión:** healthchecks a nivel de `compose.yaml` para los tres
  servicios, con `depends_on` usando `condition: service_healthy` (en vez
  de la forma corta de `depends_on`, que solo ordena el arranque sin
  esperar a que el servicio esté realmente listo).
- **Alternativas que evalué:**
  - `HEALTHCHECK` dentro de cada Dockerfile vs `healthcheck:` en Compose:
    elegí Compose porque mantiene la lógica de orquestación en un solo
    archivo, y porque necesito variables de entorno (`${DB_USER}`,
    `${DB_NAME}`) que son más naturales de interpolar ahí.
  - Para `api` (imagen distroless, sin shell ni curl): la única opción
    viable es ejecutar Node directamente en forma `CMD` (sin `CMD-SHELL`,
    que sí necesita shell), con un script de una línea que llama a
    `/api/health` con el módulo `http` nativo.
- **Por qué elegí esta:** es la combinación que de verdad exige la
  imagen mínima del Reto 1 — una vez que `api` no tiene shell, el
  healthcheck tiene que adaptarse a esa restricción, no al revés.
- **Fuentes consultadas:**
  - https://docs.docker.com/reference/dockerfile/#healthcheck
  - https://docs.docker.com/compose/how-tos/startup-order/
- **Cómo lo verifiqué:**

docker compose down
docker compose up -d --wait # termina solo cuando los 3 están healthy
docker compose ps # los 3 en (healthy)

- **Qué no me funcionó:** el healthcheck de `web` fallaba con
  "Connection refused" usando `http://localhost:8080/`, aunque nginx
  funcionaba perfecto para tráfico real (confirmado en `docker compose
  logs web`). La causa: `localhost` resuelve primero a `::1` (IPv6), y mi
  `nginx.conf` solo escucha en IPv4 (`listen 8080;`, sin variante IPv6).
  Cambié la URL del healthcheck a `http://127.0.0.1:8080/` explícito, en
  vez de agregar soporte IPv6 a nginx (que hubiera sido innecesario, ya
  que nada en la arquitectura del lab necesita IPv6).
