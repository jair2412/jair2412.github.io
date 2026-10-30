# Postgres con el esquema del libro de visitas ya incluido.
#
# La imagen oficial ejecuta, en orden alfabético, todo .sql que encuentre en
# /docker-entrypoint-initdb.d/, pero SOLO si el directorio de datos está vacío,
# es decir, la primera vez que arranca con un volumen nuevo.
FROM postgres:16-alpine

# Trivy CRITICAL,HIGH (B1 del LAB-04):
# - apk upgrade: parches de Alpine que la imagen base todavía no trae.
# - gosu: la imagen oficial lo trae compilado con Go 1.24.6 y arrastra ~26 HIGH de la librería estándar de Go.
#   El entrypoint solo lo usa para pasar de root a "postgres" (exec gosu postgres ...). su-exec es el
#   equivalente en C que trae Alpine, con los mismos argumentos, así que lo reemplazamos en vez de ignorar las CVE.
#   Se borra el gosu de la capa base (Trivy solo deja de verlo si hay un borrado real, no si se sobrescribe)
#   y se pone "gosu" en /usr/local/sbin, que va antes en el PATH, apuntando a su-exec.
RUN apk upgrade --no-cache \
 && apk add --no-cache su-exec=0.3-r0 \
 && rm /usr/local/bin/gosu /usr/local/bin/su-exec \
 && mkdir -p /usr/local/sbin && ln -s /sbin/su-exec /usr/local/sbin/gosu

COPY init/ /docker-entrypoint-initdb.d/
