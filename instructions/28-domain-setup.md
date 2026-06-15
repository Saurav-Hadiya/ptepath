# 28 — Domain Purchase & Setup

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What You Will Do
- Choose and purchase a domain name
- Connect domain to Vercel (frontend)
- Set up subdomain for backend (optional but professional)
- Verify everything works on custom domain

---

## Prerequisites
- Frontend deployed on Vercel (26-frontend-deploy-vercel.md)
- Backend deployed on Render (14-backend-deploy-render.md)
- Your Vercel URL and Render URL noted

---

## Step 1 — Choose a Domain Name

### Recommended Names (check availability)
```
ptepath.com         ← Best choice — clean, professional
ptepath.in          ← India TLD — cheaper (~Rs. 500/year)
ptepath.co          ← Modern alternative
practisepte.com     ← Descriptive
myptepath.com       ← If ptepath.com taken
```

### Check Availability
1. Go to namecheap.com or godaddy.com
2. Search your preferred name
3. Check .com first — most professional

### Recommended Registrar
**Namecheap** — reasons:
  - Cheaper than GoDaddy
  - Free WhoisGuard (privacy protection)
  - Clean interface
  - Easy DNS management
  - .com typically Rs. 900–1200/year

---

## Step 2 — Purchase Domain on Namecheap

1. Go to namecheap.com
2. Search your domain name
3. Add to cart
4. At checkout:
   - WhoisGuard: Enable (free — protects your personal info)
   - Auto-renew: Enable (prevents accidental expiry)
   - Web hosting: Skip (you have Vercel)
   - Email hosting: Skip (Resend handles email)
5. Create account + pay
6. Domain active within minutes

---

## Step 3 — Plan Your DNS Setup

You need two things connected to your domain:

| What | Where | DNS Record |
|---|---|---|
| Main site (ptepath.com) | Vercel | CNAME or A record |
| www redirect (www.ptepath.com) | Vercel | CNAME record |
| API subdomain (api.ptepath.com) | Render | CNAME record (optional) |

The API subdomain is optional for MVP.
You can keep using the Render URL for API calls.
Add it later when you want a cleaner professional setup.

---

## Step 4 — Connect Domain to Vercel

### On Vercel:
1. Go to vercel.com → your project (ptepath)
2. Click **Settings** tab
3. Click **Domains** in left menu
4. Click **Add Domain**
5. Type your domain: `ptepath.com`
6. Click **Add**
7. Vercel shows you DNS records to add

Vercel will show something like:
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cns.vercel-dns.com
```

Copy these values — you need them in Namecheap.

---

### On Namecheap:
1. Log in to namecheap.com
2. Click **Domain List** in left sidebar
3. Click **Manage** next to your domain
4. Click **Advanced DNS** tab
5. Delete any existing A records (the default ones)
6. Add the records Vercel showed you:

**Add A record:**
```
Type:  A Record
Host:  @
Value: 76.76.21.21
TTL:   Automatic
```

**Add CNAME record for www:**
```
Type:  CNAME Record
Host:  www
Value: cns.vercel-dns.com
TTL:   Automatic
```

7. Click the checkmark to save each record

---

## Step 5 — Wait for DNS Propagation

DNS changes take time to spread worldwide.
```
Typical times:
  Namecheap to Vercel: 5–30 minutes
  Full global propagation: up to 48 hours
  Usually works within 30 minutes
```

How to check:
1. Go back to Vercel → Settings → Domains
2. Wait for the green checkmark next to your domain
3. Or visit: whatsmydns.net → enter your domain → check propagation

---

## Step 6 — Verify Domain Working on Vercel

Once Vercel shows green checkmark:
1. Visit https://ptepath.com
   Expected: landing page loads
2. Visit https://www.ptepath.com
   Expected: redirects to ptepath.com (non-www)
3. Check HTTPS: padlock icon in browser address bar
   Expected: secure certificate — Vercel provides this automatically
4. Login: https://ptepath.com/login
   Expected: login page loads

---

## Step 7 — Update Frontend Environment Variable

Now that you have a custom domain, update Vercel:

1. Vercel → project → Settings → Environment Variables
2. Update (or keep as is if still using Render URL):
```
   NEXT_PUBLIC_API_URL = https://ptepath-backend.onrender.com/api
```
   This stays as Render URL for now.
   (Optional: set up api.ptepath.com in Step 8)
3. Redeploy if you made changes:
   Vercel → Deployments → click latest → Redeploy

---

## Step 8 — Optional: Connect API Subdomain to Render

This makes your API URL `https://api.ptepath.com` instead of the Render URL.
More professional but not required for MVP.

### On Namecheap — Add CNAME:
```
Type:  CNAME Record
Host:  api
Value: ptepath-backend.onrender.com
TTL:   Automatic
```

### On Render:
1. Render dashboard → your backend service
2. Settings → Custom Domains
3. Click **Add Custom Domain**
4. Enter: `api.ptepath.com`
5. Render shows a CNAME record to verify:
   Add that to Namecheap too
6. Wait for verification (5–30 minutes)

### Update Environment Variables:
Once api.ptepath.com is verified:

On Vercel:
```
NEXT_PUBLIC_API_URL = https://api.ptepath.com/api
```

On Render:
```
FRONTEND_URL = https://ptepath.com
```

Redeploy both.

---

## Step 9 — Update Backend CORS

After domain is connected, update Render environment:

1. Render dashboard → backend service → Environment
2. Update:
```
   FRONTEND_URL = https://ptepath.com
```
3. Save → Render redeploys

---

## Step 10 — Test Complete Platform on Custom Domain

Full test on your real domain:
```
1. https://ptepath.com
   Expected: landing page loads, fonts load, images load

2. https://ptepath.com/login
   Expected: login form works

3. Login as admin
   Expected: admin dashboard loads

4. Login as student
   Expected: student dashboard loads

5. Attempt a speaking question
   Expected: mic works on https (required for microphone)
   Note: microphone only works on HTTPS — custom domain is HTTPS by default

6. Check mobile
   Visit ptepath.com on phone
   Expected: responsive layout, speaking works
```

---

## Important — HTTPS Required for Microphone

The Speaking module uses microphone.
Browsers only allow microphone access on HTTPS (not HTTP).

Vercel provides HTTPS automatically for all domains.
So custom domain will have HTTPS.
Microphone will work.

If you test on HTTP (localhost is exception): works
If you test on HTTP custom domain: will NOT work (but Vercel is always HTTPS)

---

## Common Errors and Fixes

| Error | Fix |
|---|---|
| Domain shows "Invalid Configuration" on Vercel | DNS records not added correctly — check Namecheap |
| www not redirecting | CNAME for www not added or wrong value |
| Site shows Vercel's default page | DNS propagation still in progress — wait 30 min |
| HTTPS not working | Wait — Vercel provisions certificate automatically (up to 10 min) |
| API calls failing after domain change | FRONTEND_URL not updated on Render |
| Microphone not working on custom domain | Verify HTTPS is active (check padlock) |

---

## DNS Record Summary

All records to add on Namecheap:

```
Type    Host    Value                           Purpose
────────────────────────────────────────────────────────
A       @       76.76.21.21                     Main domain → Vercel
CNAME   www     cns.vercel-dns.com              www → Vercel
CNAME   api     ptepath-backend.onrender.com    API subdomain (optional)
```

Note: Vercel A record IP may differ — use the IP Vercel shows you.

---

## After This Step — Your Platform URLs

```
Main site:  https://ptepath.com
Login:      https://ptepath.com/login
API:        https://ptepath-backend.onrender.com/api
            OR https://api.ptepath.com/api (if Step 8 done)
```

---

## Domain Checklist

```
□ Domain purchased on Namecheap
□ A record added for @ pointing to Vercel IP
□ CNAME added for www
□ Vercel shows green checkmark for domain
□ https://ptepath.com loads landing page
□ https://www.ptepath.com redirects to non-www
□ HTTPS padlock visible in browser
□ Login works on custom domain
□ Admin dashboard loads
□ Speaking module microphone works on custom domain
□ FRONTEND_URL updated on Render
□ Optional: api.ptepath.com connected to Render
```

---

## Done ✓
Custom domain connected.
Platform live on professional URL.

## Next Step
→ Follow `29-email-production-setup.md`
