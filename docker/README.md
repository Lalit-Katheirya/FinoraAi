# Docker notes for Finora AI
#
# Layout:
#   docker/Dockerfile.backend      → Node API image
#   docker/Dockerfile.frontend     → Nginx + Angular SPA
#   docker/docker-compose.yml      → mongo + backend + frontend
#   docker/nginx/default.conf      → SPA + /api reverse proxy
#
# Build context is always the monorepo ROOT (one level up), so Dockerfiles
# can COPY apps/, packages/, package.json, etc.
#
# Start (from repo root):
#   cp .env.docker.example .env
#   npm run docker:up
#
# Stop:
#   npm run docker:down
