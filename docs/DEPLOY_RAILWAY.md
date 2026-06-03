# Deploy Pet Access to Railway + GitHub

One Railway service runs the **API** and **website** (`index-v2.html`) on the same URL.

---

## Step 1 — Push code to GitHub

### 1a) Create a new repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name it e.g. `pet-access`
3. **Do not** add README, .gitignore, or license (this project already has them)
4. Click **Create repository**

### 1b) Push from your PC

In PowerShell (replace `YOUR_GITHUB_USERNAME` and repo name):

```powershell
cd "c:\Users\ethan\OneDrive\Documents\america - ep - visa\New folder\New folder\New folder"

git init
git add .
git commit -m "Pet Access V2: backend, frontend, Railway deploy config"

git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/pet-access.git
git push -u origin main
```

Sign in with GitHub when prompted (browser or token).

---

## Step 2 — Create Railway project from GitHub

1. Open [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo**
3. Authorize Railway → select your `pet-access` repo
4. When the service is created, open **Settings**:
   - **Root Directory**: `backend`
   - **Watch Paths** (optional): `backend/**`, `index-v2.html`

Railway reads `backend/railway.toml` for build/start commands.

---

## Step 3 — Add PostgreSQL

1. In the same Railway project → **+ New** → **Database** → **PostgreSQL**
2. Open your **web service** → **Variables** → **Add Reference**
3. Link `DATABASE_URL` from the Postgres service

---

## Step 4 — Set environment variables

On the **web service** (not the database), add:

| Variable | Value |
|----------|--------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | Long random string (32+ chars). Generate: `[Convert]::ToBase64String((1..32|ForEach-Object{Get-Random -Max 256}))` |
| `FRONTEND_ORIGIN` | Leave empty at first; after deploy set to `https://YOUR-RAILWAY-DOMAIN.up.railway.app` |

`PORT` and `RAILWAY_PUBLIC_DOMAIN` are set by Railway automatically.

`DATABASE_URL` comes from the Postgres reference in Step 3.

---

## Step 5 — Deploy & get your live URL

1. **Deployments** → wait for build (install → copy frontend → TypeScript build → migrate on start)
2. **Settings** → **Networking** → **Generate Domain**
3. Open `https://your-app.up.railway.app` — you should see the Pet Access site
4. API health: `https://your-app.up.railway.app/api/health`

Update `FRONTEND_ORIGIN` to that HTTPS URL if you host the HTML elsewhere later.

---

## Step 6 — Smoke test (live)

1. Sign up on the live site
2. Add a pet
3. Book an appointment

Data is stored in Railway PostgreSQL.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on `index-v2.html` | Ensure repo root contains `index-v2.html` (not only inside `backend/`) |
| `P1001` / database errors | Confirm Postgres is linked and `DATABASE_URL` is referenced on the web service |
| `Invalid environment variables` | `JWT_SECRET` must be at least 16 characters |
| Blank page | Check deploy logs; confirm `NODE_ENV=production` |
| CORS errors | Set `FRONTEND_ORIGIN` to your exact Railway HTTPS URL |

---

## Optional: custom domain

Railway → **Settings** → **Networking** → **Custom Domain** → follow DNS instructions.

---

## Local dev (unchanged)

```powershell
cd backend
npm run dev
```

Open `index-v2.html` via Live Server or file — API calls go to `http://localhost:4000/api`.
