# Pet Access V2

Smart pet healthcare prototype with a production-ready Node API and PostgreSQL database.

## What's in this repo

| Path | Description |
|------|-------------|
| `index-v2.html` | Main product UI (owner portal, marketing, API wiring) |
| `backend/` | Express + Prisma + JWT API |
| `docs/PET_ACCESS_V2_STRATEGY.md` | Product strategy |
| `docs/DEPLOY_RAILWAY.md` | **Deploy to Railway + GitHub** |
| `docs/BACKEND_SETUP.md` | Local backend setup |

## Quick start (local)

```powershell
cd backend
Copy-Item .env.example .env   # edit DATABASE_URL if needed
npm install
npm run prisma:migrate -- --name init
npm run dev
```

Open `index-v2.html` in the browser (Live Server or similar).

## Go live on Railway

See **[docs/DEPLOY_RAILWAY.md](docs/DEPLOY_RAILWAY.md)** for GitHub + Railway + PostgreSQL setup.
