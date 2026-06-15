# 29 — Email Production Setup

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What You Will Do
- Verify your domain in Resend
- Add DNS records for email sending
- Update sending email from test address to your domain email
- Update environment variables on Render
- Test password reset email on live platform

---

## Prerequisites
- Domain purchased and connected (28-domain-setup.md complete)
- Domain working on Vercel (https://ptepath.com loads)
- Resend account created with API key (05-resend-setup.md complete)
- Backend live on Render

---

## Why This Step Is Needed

During development you used:
````
RESEND_FROM_EMAIL = onboarding@resend.dev
````

This only sends to your own email address.
It cannot send to student email addresses.

After this step you will use:
````
RESEND_FROM_EMAIL = noreply@ptepath.com
````

This can send password reset emails to any student.

---

## Step 1 — Add Domain to Resend

1. Go to resend.com and log in
2. Click **Domains** in left sidebar
3. Click **Add Domain**
4. Enter your domain: `ptepath.com`
5. Click **Add**

Resend will show you DNS records to add.
They look something like this:

````
Type:  TXT
Name:  resend._domainkey
Value: p=MIGfMA0GCSq...

Type:  TXT
Name:  @  (or ptepath.com)
Value: v=spf1 include:amazonses.com ~all

Type:  MX
Name:  @
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
````

Copy all of these — you need to add them to Namecheap.

---

## Step 2 — Add DNS Records on Namecheap

1. Log in to namecheap.com
2. Domain List → Manage → Advanced DNS
3. Add each record Resend showed you:

**TXT record for DKIM:**
````
Type:  TXT Record
Host:  resend._domainkey
Value: p=MIGfMA0GCSq... (paste full value from Resend)
TTL:   Automatic
````

**TXT record for SPF:**
````
Type:  TXT Record
Host:  @
Value: v=spf1 include:amazonses.com ~all
TTL:   Automatic
````

**MX record:**
````
Type:     MX Record
Host:     @
Value:    feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL:      Automatic
````

Click save/checkmark after each record.

Note: exact record values come from Resend dashboard.
Use the values Resend shows you — they may differ slightly.

---

## Step 3 — Wait for DNS Propagation

DNS records need time to spread:
````
Usually: 5–30 minutes
Maximum: 48 hours
Typical: within 1 hour
````

How to check progress:
1. Go back to Resend → Domains
2. Your domain shows "Pending" initially
3. Refresh periodically
4. Wait for "Verified" status with green checkmark

---

## Step 4 — Verify Domain in Resend

Once DNS records propagate:
1. Resend → Domains → your domain
2. Status changes to **Verified** ✓
3. You can now send from any address at your domain:
   - noreply@ptepath.com
   - support@ptepath.com
   - admin@ptepath.com
   - any@ptepath.com

---

## Step 5 — Update Environment Variable on Render

Now update the backend environment:

1. Go to render.com → your backend service
2. Click **Environment** tab
3. Update this variable:

| Key | Old Value | New Value |
|---|---|---|
| RESEND_FROM_EMAIL | onboarding@resend.dev | noreply@ptepath.com |

4. Click **Save Changes**
5. Render redeploys automatically
6. Wait for redeploy to complete (2–3 minutes)

---

## Step 6 — Test Password Reset Email

Test the complete forgot password flow on live platform:

````
1. Visit https://ptepath.com/forgot-password
2. Enter a real student email address
   (create a test student with your own email first)
3. Click Send Reset Link
4. Check your email inbox

Expected:
  Email arrives from noreply@ptepath.com
  Subject: "Reset your PTEPath password"
  Reset link in email
  Link format: https://ptepath.com/reset-password?token=xxx&id=xxx
````

If email arrives: setup complete ✓

---

## Step 7 — Test Reset Link Works

````
1. Click the reset link in the email
2. Page opens at https://ptepath.com/reset-password
3. Enter new password
4. Submit

Expected:
  Password reset successful
  Can login with new password
  Old password no longer works
````

---

## Troubleshooting Email Issues

### Email not arriving

````
Check 1: Resend domain status
  Resend → Domains → is status "Verified"?
  If still "Pending": DNS not propagated yet, wait longer

Check 2: DNS records correct
  Go to mxtoolbox.com → check your domain TXT records
  Should see SPF and DKIM records

Check 3: Render environment variable
  RESEND_FROM_EMAIL updated to noreply@ptepath.com?
  Render redeployed after update?

Check 4: Resend email logs
  Resend dashboard → Emails
  Can you see the attempt to send?
  Any error shown?
````

### Email arrives but in spam folder

````
This happens when:
  Domain reputation is new (just purchased)
  SPF or DKIM not set up correctly

Fix:
  Check all 3 DNS records added correctly
  Wait a few days — new domain reputation improves with time
  Tell students to check spam folder initially
  Mark as "Not Spam" to train email client
````

### Reset link goes to wrong URL

````
Check FRONTEND_URL on Render:
  Should be: https://ptepath.com
  Not: http://ptepath.com (missing s)
  Not: https://ptepath.vercel.app (old URL)

Update if needed → Render redeploys
````

---

## Step 8 — Update Email Template (Optional)

The default email template from `07-backend-foundation.md`
(actually implemented in `08-authentication-backend.md`)
can be improved for production.

Tell Claude Code:
"Update the password reset email in src/services/email.service.ts
to use a nicer HTML template with:
- PTEPath branding
- Clear reset button
- Professional styling
- From name: PTEPath (not just the email address)"

Example from name display:
```typescript
from: 'PTEPath <noreply@ptepath.com>'
```

This shows "PTEPath" as sender name in email client
instead of just "noreply@ptepath.com".

---

## Step 9 — Inform Students About Email

Before students start using the platform:
Tell them:
````
1. Password reset emails come from noreply@ptepath.com
2. If not in inbox, check spam/junk folder
3. Reset links expire in 10 minutes
4. If link expired, request a new one
````

---

## Resend Free Tier Limits Reminder

````
Free tier:
  3,000 emails per month
  100 emails per day

For password reset only:
  100 emails/day = more than enough
  Even if 100 students all reset same day: exactly at limit
  Very unlikely scenario for a practice platform

If you exceed limits:
  Resend paid tier starts at $20/month for 50,000 emails
  Not needed for MVP
````

---

## Complete DNS Records Summary

All DNS records across all services in one place:

````
For Vercel (frontend hosting):
  A       @       76.76.21.21            (main domain)
  CNAME   www     cns.vercel-dns.com     (www redirect)

For Render (optional API subdomain):
  CNAME   api     ptepath-backend.onrender.com

For Resend (email sending):
  TXT     resend._domainkey   p=MIGfMA0GCSq...  (DKIM)
  TXT     @                   v=spf1 include:... (SPF)
  MX      @                   feedback-smtp...   (bounce handling)
````

Note: exact Vercel IP and Resend values come from
their respective dashboards — use those exact values.

---

## Final Environment Variables Check

Verify these are all set correctly on Render:

````
NODE_ENV              = production
PORT                  = 10000
MONGO_URI             = mongodb+srv://...
ACCESS_TOKEN_SECRET   = <32+ char secret>
REFRESH_TOKEN_SECRET  = <different 32+ char secret>
CLOUDINARY_CLOUD_NAME = your cloud name
CLOUDINARY_API_KEY    = your api key
CLOUDINARY_API_SECRET = your api secret
GROQ_API_KEY          = gsk_...
RESEND_API_KEY        = re_...
RESEND_FROM_EMAIL     = noreply@ptepath.com   ← updated in this step
FRONTEND_URL          = https://ptepath.com   ← updated in step 28
ADMIN_EMAIL           = your admin email
ADMIN_PASSWORD        = your strong password
ADMIN_NAME            = Admin
````

And on Vercel:
````
NEXT_PUBLIC_API_URL = https://ptepath-backend.onrender.com/api
                      OR https://api.ptepath.com/api
````

---

## Production Launch Checklist

Now that all 29 steps are complete, verify everything:

````
Infrastructure:
  □ GitHub repo with all code
  □ MongoDB Atlas cluster running
  □ Cloudinary account with folders created
  □ Groq API key active
  □ Resend domain verified
  □ Render backend live and healthy
  □ Vercel frontend live
  □ Custom domain connected
  □ HTTPS working on all URLs

Platform:
  □ Admin account created (seed script run)
  □ Admin can login at https://ptepath.com/login
  □ Admin can create student accounts
  □ Admin can add questions to all 4 modules
  □ Admin can create mock test templates
  □ Student can login and change password on first login
  □ Student can attempt questions in all 4 modules
  □ Student can take mock tests
  □ Password reset email arrives correctly
  □ Speaking module works on mobile (mic + HTTPS)

Performance:
  □ Landing page loads in < 3 seconds
  □ Login works correctly
  □ Scoring returns results within 6 seconds (speaking)
  □ No console errors on any page
````

---

## Platform Is Now Live ✓

````
Frontend:  https://ptepath.com
Backend:   https://ptepath-backend.onrender.com
Admin:     https://ptepath.com/login (admin credentials)
````

Steps to hand over to client:
1. Share ptepath.com URL
2. Share admin login credentials
3. Show admin how to:
   - Create student accounts
   - Add questions
   - Create mock tests
4. Share Namecheap login (for domain renewal)
5. Remind about annual domain renewal

---

## Done ✓
All 29 steps complete.
PTEPath platform is fully live and production ready.
