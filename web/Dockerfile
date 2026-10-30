# web: nginx sirviendo la página y reenviando /api/ al backend.
# Imagen "unprivileged": corre como usuario nginx (uid 101) y escucha en 8080.
FROM nginxinc/nginx-unprivileged:1.29-alpine

# Parches de seguridad de Alpine que la imagen base todavía no trae (Trivy CRITICAL,HIGH, B1 del LAB-04).
# apk necesita root; después se vuelve al usuario nginx (uid 101).
USER root
RUN apk upgrade --no-cache
USER 101

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/

EXPOSE 8080
