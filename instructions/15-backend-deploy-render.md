# 15 — Backend Deploy to Render

## What This Is
Mix of manual steps and Claude Code assistance.
Follow the manual steps yourself.
Claude Code helps with any config file changes needed.

---

## What You Will Do
- Prepare backend for production deployment
- Deploy to Render free tier
- Set all environment variables on Render
- Verify backend is live and working

---

## Reference Docs
- `instructions/06-project-structure.md` — project structure
- `instructions/08-authentication-backend.md` — environment variables list

---

## Prerequisites
- All backend files complete (07 through 14)
- All backend routes tested locally and working
- GitHub repository up to date with latest commits
- Render account created at render.com

---

## Step 1 — Prepare Backend for Production

### Tell Claude Code to do this:
"Read instructions/15-backend-deploy-render.md Step 1 and make the required production changes to the backend."

### What Claude Code must do:

**Update `backend/src/app.ts`:**

CORS configuration for production:
````
origins allowed:
  - process.env.FRONTEND_URL (from .env)
  - http://localhost:3000 (for development)
credentials: true
methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
allowedHeaders: Content-Type, Authorization
````

Add health check route:
````
GET /api/health
Returns: { status: 'ok', timestamp: new Date().toISOString() }
No authentication required
````

---

**Update `backend/package.json` build script:**

Ensure these scripts exist:
```json
{
  "scripts": {
    "dev": "nodemon",
    "build": "tsc",
    "start": "node dist/app.js",
    "seed": "ts-node scripts/seed-admin.ts"
  }
}
```

---

**Create `backend/render.yaml`** (optional but helpful):
```yaml
services:
  - type: web
    name: ptepath-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

---

**Verify `backend/tsconfig.json` has correct outDir:**
```json
{
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

---

**Add `tmp/` to `backend/.gitignore`:**
````
tmp/
dist/
node_modules/
.env
````

---

**Create `backend/tmp/.gitkeep`:**
Empty file to ensure tmp folder exists in repo.
Audio files uploaded here temporarily during Speaking evaluate. - (*But now in this modified they audio will never store it will directly passed on so performance increased.)

---

## Step 2 — Push All Changes to GitHub

```bash
cd backend
git add .
git commit -m "prepare backend for production deployment"
git push origin main
```

---

## Step 3 — Create Web Service on Render

### Do this yourself on render.com:

1. Go to render.com and log in
2. Click **New +** → **Web Service**
3. Connect GitHub:
   - Click **Connect GitHub**
   - Authorize Render to access your GitHub account
   - Select your `ptepath` repository
4. Configure the service:
   - **Name:** `ptepath-backend`
   - **Region:** Singapore (closest to India)
   - **Branch:** `main`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
5. Click **Create Web Service**

Render will attempt to deploy. It may fail at first because
environment variables are not set yet. That is expected.

---

## Step 4 — Set Environment Variables on Render

In your Render service dashboard:
1. Click **Environment** tab in left sidebar
2. Click **Add Environment Variable** for each one:

Add ALL of these:

| Key | Value |
|---|---|
| NODE_ENV | production |
| PORT | 10000 |
| MONGO_URI | your MongoDB Atlas connection string |
| ACCESS_TOKEN_SECRET | your 32+ character secret |
| REFRESH_TOKEN_SECRET | your different 32+ character secret |
| CLOUDINARY_CLOUD_NAME | your Cloudinary cloud name |
| CLOUDINARY_API_KEY | your Cloudinary API key |
| CLOUDINARY_API_SECRET | your Cloudinary API secret |
| GROQ_API_KEY | your Groq API key |
| RESEND_API_KEY | your Resend API key |
| RESEND_FROM_EMAIL | onboarding@resend.dev |
| FRONTEND_URL | http://localhost:3000 (update after frontend deploys) |
| ADMIN_EMAIL | your admin email |
| ADMIN_PASSWORD | your strong admin password |
| ADMIN_NAME | Admin |

> Note: PORT must be 10000 on Render free tier.
> Render assigns this port. Your app.ts should use process.env.PORT.

3. Click **Save Changes**
4. Render will automatically redeploy with the new variables

---

## Step 5 — Wait for Deployment

1. Go to **Logs** tab in Render dashboard
2. Watch the build and deploy logs
3. Look for these success messages:
   - `Build successful`
   - `MongoDB connected` (from your db.ts connection log)
   - `Server running on port 10000`
4. If errors appear — read them carefully and fix

---

## Step 6 — Get Your Backend URL

Once deployed successfully:
1. At the top of your Render service page you will see the URL:
````
   https://ptepath-backend.onrender.com
````
   (The exact name depends on what you named the service)
2. Copy this URL — you will need it for frontend setup

---

## Step 7 — Test the Live Backend

Open browser or use Postman:

````
GET https://ptepath-backend.onrender.com/api/health
````

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

Then test login:
````
POST https://ptepath-backend.onrender.com/api/auth/login
Body: { "email": "your-admin-email", "password": "your-admin-password" }
````

This will fail with 401 because admin is not created yet.
Admin seed script runs in Step 8.

---

## Step 8 — Run Admin Seed Script

The seed script must run once on the live server to create the admin account.

### Option A — Using Render Shell (Easiest)
1. In Render dashboard click **Shell** tab
2. Run:
```bash
npm run seed
```
3. You should see: `Admin account created successfully.`

### Option B — Using Render One-off Job
1. In Render dashboard click **Jobs** tab
2. Click **Create Job**
3. Command: `npm run seed`
4. Click **Run**

---

## Step 9 — Verify Admin Login on Live Server

````
POST https://ptepath-backend.onrender.com/api/auth/login
Body: {
  "email": "admin@yourdomain.com",
  "password": "your-admin-password"
}
````

Expected response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": {
      "id": "...",
      "name": "Admin",
      "email": "admin@yourdomain.com",
      "role": "admin"
    }
  }
}
```

---

## Step 10 — Note Important Render Free Tier Behaviour

**Render free tier spins down after 15 minutes of inactivity.**

This means:
- First request after idle period takes 30–60 seconds (cold start)
- Subsequent requests are fast
- This is expected and acceptable for MVP stage

When you deploy frontend and start using the platform:
- The backend will warm up after first request
- Students may see slight delay on first load after inactivity

This is fine for MVP. When platform grows, upgrade to paid tier.

---

## Step 11 — Update CORS After Frontend Deploys

After frontend is deployed to Vercel (done in step 27):
1. Go to Render dashboard → Environment tab
2. Update FRONTEND_URL to your actual Vercel URL:
````
   FRONTEND_URL=https://ptepath.vercel.app
````
   (or your custom domain when purchased)
3. Save → Render redeploys automatically

---

## Common Errors and Fixes

| Error | Fix |
|---|---|
| `Cannot find module` | Run `npm run build` locally first to catch TypeScript errors |
| `MongoServerError: bad auth` | Check MONGO_URI — password might have special characters, URL-encode them |
| `CORS error` | FRONTEND_URL environment variable not set correctly |
| `Port already in use` | PORT must be 10000 on Render — check environment variable |
| Build fails with TS errors | Fix TypeScript errors locally first, then push |
| `Module not found: nspell` | Check package.json — nspell must be in dependencies not devDependencies |

---

## Expected Output When Done
- Backend live at `https://ptepath-backend.onrender.com`
- Health check endpoint returns ok
- Admin login works
- All API routes accessible
- MongoDB connected
- Cloudinary configured
- No errors in Render logs

---

## Your Backend URL
Write your backend URL here once deployed:
````
Backend URL: https://_______________________.onrender.com
````
Keep this — needed for frontend .env.local file.

---

## Done ✓
Backend is live on Render.

## Next Step
→ Give Claude Code `16-frontend-foundation.md`
