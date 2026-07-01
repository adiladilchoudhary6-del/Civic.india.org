# 📱 Installing CivicConnect on Your Phone

CivicConnect is a **web app**, not something distributed through the Play Store or
App Store. But it's built as a **PWA (Progressive Web App)** — that means once it's
hosted online, you can "install" it from your phone's browser and it will behave just
like a native app: it gets an icon on your home screen, opens full-screen (no browser
address bar), and can be launched offline for cached parts of the UI.

There are two steps:
1. **Deploy the app to a public URL** (your phone can't reach `localhost` on this
   sandbox — it needs a real internet address).
2. **Install it from your phone's browser** using "Add to Home Screen".

---

## Step 1: Deploy to Render (free)

This project already includes a `render.yaml` blueprint that deploys both the
backend API and the frontend together.

1. **Create a free Render account:** https://render.com (sign up with GitHub is easiest)
2. **Push this project to a GitHub repository:**
   ```bash
   cd civic-app
   git init
   git add .
   git commit -m "CivicConnect initial commit"
   # create a new repo on github.com, then:
   git remote add origin https://github.com/<your-username>/civicconnect.git
   git branch -M main
   git push -u origin main
   ```
3. **In the Render dashboard:** click **New +** → **Blueprint**, then select your
   GitHub repo. Render will detect `render.yaml` and propose creating two services:
   - `civicconnect-api` (backend)
   - `civicconnect-app` (frontend, static site)
4. Click **Apply**. Render will build and deploy both. This takes a few minutes.
5. Once deployed, Render gives you URLs like:
   - Backend: `https://civicconnect-api.onrender.com`
   - Frontend: `https://civicconnect-app.onrender.com`
6. **Important:** open the `civicconnect-app` service settings on Render and confirm
   the environment variable `VITE_API_URL` is set to your actual backend URL
   (`render.yaml` already sets this, but double-check it matches exactly).
   Do the same for `ALLOWED_ORIGINS` on the backend service — it should equal your
   frontend's URL.
7. Visit your frontend URL in a browser to confirm the app loads and you can log in
   with the demo accounts (see main `README.md`).

> Free Render web services "spin down" after 15 minutes of inactivity and take ~30-60
> seconds to wake up on the next request — this is normal on the free tier.

### Alternative: Railway
If you prefer Railway instead of Render, the same two pieces (Node backend + static
frontend) apply — create two services pointing at the `server/` and `client/`
folders respectively, set the same environment variables (`JWT_SECRET`,
`ALLOWED_ORIGINS`, `VITE_API_URL`), and use `npm run build` + serve the `dist` folder
for the frontend (Railway has a static-site template, or you can serve `dist` via a
tiny Express/`serve` process).

---

## Step 2: Install the app on your phone

Once you have your live URL (e.g. `https://civicconnect-app.onrender.com`), open it
in your phone's browser and follow the steps for your device:

### 📱 Android (Chrome)
1. Open the site link in **Chrome**.
2. Tap the **⋮ (three-dot) menu** in the top right.
3. Tap **"Add to Home screen"** (or you may see a banner "Install app" at the
   bottom — tap **Install**).
4. Confirm the name (defaults to "CivicConnect") and tap **Add**.
5. The CivicConnect icon now appears on your home screen — tap it to launch the app
   full-screen, just like any other installed app.

### 🍏 iPhone / iPad (Safari)
> Note: iOS requires Safari specifically for this — it won't show the option in
> Chrome on iPhone.
1. Open the site link in **Safari**.
2. Tap the **Share icon** (square with an arrow pointing up) in the toolbar.
3. Scroll down and tap **"Add to Home Screen"**.
4. Confirm the name and tap **Add** (top right).
5. The CivicConnect icon appears on your home screen.

### 💻 Desktop (Chrome/Edge, optional)
1. Open the site.
2. Look for an **install icon (⊕ or a monitor-with-arrow icon)** in the address bar.
3. Click it and confirm **Install**.

---

## Notes & Troubleshooting
- If "Add to Home Screen" only adds a plain bookmark (no standalone app icon/behavior)
  on Android, make sure you're using **Chrome** and that the site was served over
  **HTTPS** — Render provides HTTPS automatically, so this should just work.
- If photos you upload don't show up after deployment, double check `VITE_API_URL`
  is set correctly on the frontend build — this tells the app where to fetch
  `/uploads/...` images from.
- Free-tier SQLite storage on Render can reset on redeploys unless you've attached a
  persistent disk (the included `render.yaml` already configures one for the
  database folder). For a long-term production deployment for your town, consider
  upgrading to a managed PostgreSQL database (see "Upgrading the database" in the
  main `README.md`).
- You (and citizens in your town) can share the same install link — everyone
  installs it the same way, no app store review or download needed.
