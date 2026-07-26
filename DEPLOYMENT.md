# Deployment

Three pieces, three places:

| Piece | Where | Why |
|---|---|---|
| Postgres | Supabase (already set up in dev) | Free tier, no server to manage, reuse the same instance in prod |
| API (`/`) | Render | Free web service tier, deploys straight from a GitHub repo |
| Client (`client/`) | Vercel | Best-in-class static/SPA hosting, free, git-integrated |

This assumes the repo is pushed to GitHub — both Render and Vercel deploy by connecting to a GitHub repo, not by manual upload.

## 1. Database

Nothing to do — the Supabase project used in development can be used as-is. If you'd rather keep dev and prod data separate, create a second Supabase project and repeat the setup steps from the README (`db:push`, apply the SQL constraint, seed) against its connection string instead.

## 2. Backend on Render

1. [render.com](https://render.com) → New → Web Service → connect the GitHub repo.
2. Root directory: leave as the repo root (not `client/`).
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Environment variables:
   - `DATABASE_URL` — the Supabase connection string
   - `JWT_SECRET` — a long random string (don't reuse the dev one)
   - `CLIENT_ORIGIN` — the Vercel URL from step 3 below (you'll circle back to set this after Vercel gives you a URL)
   - `PORT` — Render sets this automatically; the app already reads `process.env.PORT`
6. Deploy. Note the resulting URL (e.g. `https://booking-system-api.onrender.com`).

Render's free tier spins the service down after inactivity — the first request after a while will be slow (cold start). Fine for a portfolio demo; worth mentioning if someone's timing it.

## 3. Frontend on Vercel

1. [vercel.com](https://vercel.com) → New Project → import the same GitHub repo.
2. Root directory: `client` (Vercel supports picking a subdirectory of a monorepo-ish repo).
3. Framework preset: Vite (auto-detected).
4. Environment variable: `VITE_API_URL` = `https://<your-render-url>/api`
5. Deploy. Note the resulting URL (e.g. `https://booking-system.vercel.app`).

## 4. Close the loop

Go back to Render and set `CLIENT_ORIGIN` to the Vercel URL from step 3, then redeploy the backend — otherwise the CORS check in `src/app.ts` will reject requests from the deployed frontend.

## 5. Promote a real admin

Same as local dev: register normally through the deployed app, then run the `UPDATE users SET role = 'ADMIN' ...` SQL against the Supabase project (via its SQL editor) for whichever account should have admin access.
