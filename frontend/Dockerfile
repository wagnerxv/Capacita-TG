# Frontend Dockerfile (Nginx)
FROM nginx:1.27-alpine

# Copy custom nginx config
COPY frontend/default.conf /etc/nginx/conf.d/default.conf

# Copy static site
# We copy specific items from the repo root into the nginx html root
COPY index.html /usr/share/nginx/html/
COPY empreend.html /usr/share/nginx/html/
COPY entrar.html /usr/share/nginx/html/
COPY financ.html /usr/share/nginx/html/
COPY habitos.html /usr/share/nginx/html/
COPY novoemp.html /usr/share/nginx/html/
COPY parceiros.html /usr/share/nginx/html/
COPY primeiroemprego.html /usr/share/nginx/html/
COPY sitemap.xml /usr/share/nginx/html/

COPY admin/ /usr/share/nginx/html/admin/
COPY dashboard/ /usr/share/nginx/html/dashboard/
COPY src/ /usr/share/nginx/html/src/

EXPOSE 80
