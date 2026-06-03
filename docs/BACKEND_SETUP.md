# Pet Access Backend Setup

This is the first production backend scaffold for Pet Access V2.

## What is included

- Express API (`/api/*`)
- PostgreSQL ORM via Prisma
- JWT auth (register/login)
- Protected owner endpoints:
  - `GET/POST /api/pets`
  - `GET/POST /api/appointments`
- Health endpoint: `GET /api/health`

## 1) Local setup

From `backend/`:

1. Copy env file
   - `Copy-Item .env.example .env`
2. Install dependencies
   - `npm install`
3. Generate Prisma client
   - `npm run prisma:generate`
4. Create your database and update `DATABASE_URL` in `.env`
5. Run migrations
   - `npm run prisma:migrate -- --name init`
6. Start dev server
   - `npm run dev`

## 2) API quick test

- Health:
  - `GET http://localhost:4000/api/health`
- Register:
  - `POST http://localhost:4000/api/auth/register`
- Login:
  - `POST http://localhost:4000/api/auth/login`

Use returned token as:

`Authorization: Bearer <token>`

## 3) Deploy backend (Railway / Render / Fly)

Minimum environment variables:

- `NODE_ENV=production`
- `PORT=4000` (or platform port)
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=<long-random-secret>`
- `FRONTEND_ORIGIN=https://your-frontend-domain`

Build command:

- `npm install && npm run prisma:generate && npm run build`

Start command:

- `npm run prisma:deploy && npm start`

## 4) Frontend integration next

Current `index-v2.html` is still static. Next implementation step:

1. Add `app.js` API client for auth/pets/appointments
2. Replace modal `alert(...)` interactions with API calls
3. Persist session token in secure storage
4. Render pets, timeline, appointments from backend responses

## 5) Recommended immediate backlog

- Add medical records/timeline endpoints
- Add prescriptions + emergency card endpoints
- Add clinic directory + rating models
- Add role-based vet/admin route guards
- Add refresh tokens + password reset
- Add request logging and centralized error middleware
