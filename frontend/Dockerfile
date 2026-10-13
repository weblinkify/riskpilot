# syntax=docker/dockerfile:1.7
# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
# env.js is regenerated at container start, so one image serves both API modes.
RUN npx ng build --configuration production

# ---- runtime ----
FROM nginx:1.27-alpine
COPY docker/nginx.conf.template /etc/nginx/riskpilot/nginx.conf.template
COPY docker/40-riskpilot-config.sh /docker-entrypoint.d/40-riskpilot-config.sh
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html
RUN chmod +x /docker-entrypoint.d/40-riskpilot-config.sh
ENV API_MODE=mock \
    BACKEND_URL=http://backend:8080
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
