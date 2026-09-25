# Imagen oficial de nginx, tag fijo, variante liviana.
FROM nginx:1.27-alpine

# Reemplaza la config por defecto de nginx con la nuestra.
COPY web/nginx.conf /etc/nginx/conf.d/default.conf

# Copia los archivos estáticos del perfil. Como el contexto de build es la
# raíz del repo (definido en compose.yaml), estas rutas parten de ahí.
COPY index.html /usr/share/nginx/html/
COPY libro-de-visitas.js /usr/share/nginx/html/

EXPOSE 80
