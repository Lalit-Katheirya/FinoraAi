# Finora AI — Deployment guide

This monorepo is deployment-ready as:

| Layer | Path | Runtime |
|-------|------|---------|
| Frontend | `apps/frontend` | Static SPA (Nginx) |
| Backend | `apps/backend` | Node 20 Express |
| Shared | `packages/shared`, `packages/ai` | Built into backend image |
| Data | MongoDB | Compose service or Atlas |

```
Browser → Nginx (:80) → /           → Angular SPA
                      → /api/*      → Express API (:4000) → MongoDB
```

Credentials live **only** in environment variables (never in source).

---

## 1. Credential architecture

| Secret | Where it lives | Notes |
|--------|----------------|-------|
| `MONGODB_URI` | Env / secret manager | Atlas recommended in prod |
| `JWT_SECRET` | Env / secret manager | ≥32 chars, unique |
| `JWT_REFRESH_SECRET` | Env / secret manager | Different from access secret |
| `OPENAI_API_KEY` | Env / secret manager | Optional (mock AI if empty) |
| `COOKIE_SECURE` | Env | `true` behind HTTPS |
| `FRONTEND_URL` | Env | CORS allowlist (comma-separated OK) |

Templates:

- Local: [`.env.example`](../.env.example) → copy to `.env`
- Production: [`.env.production.example`](../.env.production.example)

`.env` / `.env.production` are gitignored. Production startup **rejects** placeholder JWT secrets and localhost Mongo URIs.

Generate secrets:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## 2. Local development

```bash
cp .env.example .env
# edit MONGODB_URI / JWT secrets
npm install
npm run build -w @finora/shared && npm run build -w @finora/ai
npm run seed   # optional
npm run dev    # API :4000 + Web :4200 (proxy /api)
```

---

## 3. Docker Compose (full stack)

Prerequisites: Docker Desktop / Engine + Compose.

1. Create `.env` for Compose (strong JWTs required — `NODE_ENV=production`):

```bash
cp .env.docker.example .env
# Or start from .env.production.example and set:
#   MONGODB_URI=mongodb://mongo:27017/finora_ai
#   FRONTEND_URL=http://localhost
#   COOKIE_SECURE=false
```

2. Build & run:

```bash
npm run docker:up
# or: docker compose -f docker/docker-compose.yml up --build -d
```

| Service | URL |
|---------|-----|
| Web + proxied API | http://localhost |
| API direct | http://localhost:4000 |
| Health | http://localhost/api/health or http://localhost:4000/api/health |
| Mongo | localhost:27017 |

Stop:

```bash
npm run docker:down
```

---

## 4. Build artifacts without Docker

```bash
# Backend (shared → ai → backend)
npm run build:backend
cd apps/backend && NODE_ENV=production node dist/server.js

# Frontend
npm run build:frontend
# Serve apps/frontend/dist/frontend/browser behind any static host / nginx
```

Production Angular build replaces `environment.ts` with `environment.prod.ts` (`apiUrl: '/api'` — same-origin via nginx).

---

## 5. Split hosting (optional)

If SPA and API are on different domains:

1. Set frontend `environment.prod.ts` `apiUrl` to full API URL (e.g. `https://api.example.com/api`) and rebuild.
2. Set `FRONTEND_URL=https://app.example.com` on the backend.
3. Set `COOKIE_SECURE=true` and serve both over HTTPS (refresh cookie uses `SameSite=None`).

---

## 6. Checklist before go-live

- [ ] Strong unique `JWT_SECRET` / `JWT_REFRESH_SECRET`
- [ ] Managed `MONGODB_URI` (not localhost)
- [ ] `COOKIE_SECURE=true` + HTTPS
- [ ] `FRONTEND_URL` matches real SPA origin(s)
- [ ] `OPENAI_API_KEY` set if real AI needed
- [ ] Rate limits reviewed
- [ ] `/api/health` monitored
- [ ] `.env` never committed

---

## 7. Layout (deployment-relevant)

```
FinoraAi/
├── apps/backend/                 # Backend
├── apps/frontend/                # Frontend
├── packages/shared|ai/           # Shared libs (baked into backend image)
├── docker/
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── docker-compose.yml
│   └── nginx/default.conf        # SPA + /api reverse proxy
├── .env.example
├── .env.production.example
└── docs/DEPLOYMENT.md            # This file
```
