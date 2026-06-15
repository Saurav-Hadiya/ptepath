# 27 — Frontend Deploy to Vercel

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What You Will Do
- Prepare frontend for production
- Deploy to Vercel
- Set environment variables on Vercel
- Connect to live backend on Render
- Verify everything works on live URL

---

## Prerequisites
- All frontend files complete (15 through 24)
- Integration testing complete (25)
- Backend live on Render with URL noted
- Vercel account created at vercel.com
- GitHub repository up to date

---

## Step 1 — Prepare Frontend for Production

### Tell Claude Code to do this:
"Read instructions/26-frontend-deploy-vercel.md Step 1
and make required production changes to frontend."

### What Claude Code must do:

**Update `frontend/next.config.ts`:**
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
```

This allows Next.js Image component to load images from Cloudinary.

---

**Verify `frontend/.env.local` is in `.gitignore`:**
````
.env.local must NOT be committed to GitHub.
Vercel gets env variables from its own dashboard — not from the file.
````

---

**Check all API calls use environment variable:**
Every API call must use:
```typescript
process.env.NEXT_PUBLIC_API_URL
```
Not hardcoded backend URL anywhere.

---

**Create `frontend/public/robots.txt`:**
````
User-agent: *
Disallow: /admin
Disallow: /dashboard
Disallow: /speaking
Disallow: /writing
Disallow: /reading
Disallow: /listening
Disallow: /mock-tests

Allow: /
Allow: /login
````

Prevents search engines from indexing private pages.

---

**Verify no console.log statements in production code:**
Remove or wrap all console.log in:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log(...)
}
```

---

## Step 2 — Final Local Test Before Deploy

Run production build locally first:
```bash
cd frontend
npm run build
npm run start
```

Visit localhost:3000 — if it works: ready to deploy.
If build errors: fix them before proceeding.

Common build errors:
````
TypeScript error:     Fix the type error shown
Missing import:       Add the import
Image domain error:   next.config.ts not set up (Step 1)
Environment var:      Using server-only var on client component
````

---

## Step 3 — Push All Changes to GitHub

```bash
cd frontend
git add .
git commit -m "prepare frontend for production deployment"
git push origin main
```

---

## Step 4 — Create Project on Vercel

1. Go to vercel.com and log in
2. Click **Add New** → **Project**
3. Click **Import Git Repository**
4. Select your `ptepath` GitHub repository
5. Configure project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `frontend`
     Click **Edit** next to root directory and type `frontend`
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)
6. Do NOT click Deploy yet — set environment variables first

---

## Step 5 — Set Environment Variables on Vercel

Still on the same configuration screen:

1. Scroll down to **Environment Variables** section
2. Add this variable:

| Name | Value |
|---|---|
| NEXT_PUBLIC_API_URL | https://your-render-backend-url.onrender.com/api |

Replace `your-render-backend-url` with your actual Render URL from step 14.

Example:
````
NEXT_PUBLIC_API_URL = https://ptepath-backend.onrender.com/api
````

3. Make sure to select all three environments:
   - Production ✓
   - Preview ✓
   - Development ✓

---

## Step 6 — Deploy

1. Click **Deploy**
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Run `npm run build`
   - Deploy to CDN
3. Watch the build logs for errors
4. Build takes approximately 2–4 minutes

---

## Step 7 — Get Your Vercel URL

Once deployed:
1. Vercel shows your live URL:
````
   https://ptepath.vercel.app
````
   (or similar — based on project name)
2. Copy this URL

---

## Step 8 — Update Backend CORS on Render

Now that frontend is live, update CORS on backend:

1. Go to Render dashboard
2. Your backend service → Environment tab
3. Update:
````
   FRONTEND_URL = https://ptepath.vercel.app
````
   (replace with your actual Vercel URL)
4. Save → Render redeploys automatically

---

## Step 9 — Verify Live Platform

Test on the live Vercel URL:

````
1. Visit https://ptepath.vercel.app
   Expected: landing page loads correctly

2. Visit https://ptepath.vercel.app/login
   Expected: login page loads

3. Login as admin
   Expected: redirected to /admin/dashboard
   Expected: dashboard data loads from Render backend

4. Login as student
   Expected: redirected to /dashboard
   Expected: module cards show question counts

5. Attempt one question (any module)
   Expected: question loads, answer submits, score shown

6. Test Speaking on mobile
   Visit on phone browser
   Expected: mic permission prompt, recording works
````

---

## Step 10 — Configure Custom Domain (Prepare)

You do not have a domain yet.
Once purchased (Step 27), this is how to connect:

1. Vercel dashboard → your project → Settings → Domains
2. Click **Add Domain**
3. Enter your domain: `ptepath.com`
4. Vercel shows DNS records to add
5. Add those records in your domain registrar

Keep this in mind for Step 27.

---

## Step 11 — Enable Automatic Deployments

Vercel auto-deploys on every GitHub push by default.

This means:
````
You push to GitHub main branch
        ↓
Vercel automatically rebuilds and redeploys
        ↓
Live site updated within 2–3 minutes
````

No manual deploy needed after initial setup.

---

## Common Errors and Fixes

| Error | Fix |
|---|---|
| Build failed: TypeScript errors | Fix TS errors locally first, push again |
| CORS error in browser console | FRONTEND_URL not updated on Render |
| API calls return 404 | NEXT_PUBLIC_API_URL missing /api at end |
| Images not loading | next.config.ts remotePatterns not set |
| Login works but dashboard empty | Check network tab — API returning data? |
| Environment variable undefined | Re-check Vercel env vars, redeploy |
| `NEXT_PUBLIC_` prefix missing | Client-side vars MUST have this prefix |

---

## Important — Environment Variable Naming

Next.js rules for environment variables:
````
Variables starting with NEXT_PUBLIC_:
  Available in browser (client-side)
  Use for: API URL, public keys

Variables WITHOUT NEXT_PUBLIC_:
  Only available server-side
  Never sent to browser
  Use for: secret keys (but we have none in frontend)
````

`NEXT_PUBLIC_API_URL` is correct — it needs to be
available in the browser to make API calls.

---

## What You Now Have

````
Backend:  Live at https://ptepath-backend.onrender.com
Frontend: Live at https://ptepath.vercel.app
````

Full platform accessible from anywhere.
Admin can manage content.
Students can practice.

---

## Performance Notes

Vercel free tier:
  Global CDN — fast worldwide
  Automatic HTTPS — secure
  100GB bandwidth/month — more than enough for MVP
  No cold starts — always fast (unlike Render free tier)

Render free tier:
  Cold starts after 15 min idle — backend may be slow on first request
  Frontend stays fast always (Vercel)
  Students may notice 30-60 sec delay if backend was idle

---

## Deployment Checklist

````
□ next.config.ts updated with Cloudinary domain
□ .env.local is in .gitignore (not committed)
□ npm run build runs successfully locally
□ All changes pushed to GitHub
□ Vercel project created with frontend root directory
□ NEXT_PUBLIC_API_URL set in Vercel environment variables
□ Deploy successful — no build errors
□ Landing page loads on Vercel URL
□ Login works on live URL
□ Backend FRONTEND_URL updated on Render
□ Admin dashboard data loads
□ Student module data loads
□ Auto-deploy verified (push to GitHub → Vercel rebuilds)
````

---

## Write Your URLs Here

````
Backend URL:  https://_________________________.onrender.com

Frontend URL: https://_________________________.vercel.app
````

Keep these for the next steps.

---

## Done ✓
Frontend is live on Vercel.
Platform is fully accessible.

## Next Step
→ Follow `28-domain-setup.md`
