# ---- Build stage: produce a static MkDocs site ----
FROM python:3.12-slim AS build

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN pip install --no-cache-dir \
    mkdocs \
    mkdocs-material \
    pymdown-extensions

WORKDIR /site
COPY mkdocs.yml .
COPY docs ./docs
RUN mkdocs build --strict

# ---- Runtime stage: serve the built site with nginx ----
FROM nginx:alpine AS runtime

# Listen on 8000 instead of nginx's default 80 so docker-compose mapping
# `8001:8000` keeps working unchanged.
RUN sed -i 's/listen\s*80;/listen 8000;/' /etc/nginx/conf.d/default.conf

COPY --from=build /site/site /usr/share/nginx/html

EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8000/ >/dev/null 2>&1 || exit 1
