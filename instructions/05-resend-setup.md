# 05 — Resend Setup

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What Resend Is Used For
Resend sends the password reset email to students.
When a student clicks "Forgot Password" and enters their email,
the platform sends a reset link via Resend.

This is the only email this platform sends.

---

## Free Tier Limits
| Limit | Value |
|---|---|
| Emails per month | 3,000 |
| Emails per day | 100 |
| Cost | Rs. 0 on free tier |

100 emails per day is more than enough for password reset emails at this platform scale.

---

## Important — Two Stages of Setup

| Stage | When | What |
|---|---|---|
| Stage 1 (Now) | Before development | Create account + get API key only |
| Stage 2 (Later) | After domain purchase | Verify domain so emails send to all students |

**Right now you only do Stage 1.**
Stage 2 is covered in `29-email-production-setup.md` after the domain is purchased.

During development and testing, Resend free tier lets you send emails
to your own email address without domain verification.
This is enough to test the password reset flow completely.

---

## Stage 1 — Setup Now

### Step 1 — Create Resend Account
1. Go to resend.com
2. Click Get Started
3. Sign up with email or Google account
4. Verify your email
5. You will land on the Resend dashboard

---

### Step 2 — Create an API Key
1. In the Resend dashboard click **API Keys** in the left sidebar
2. Click **Create API Key**
3. Fill in:
   - Name: `ptepath-development`
   - Permission: **Full access**
4. Click **Add**
5. **Copy the API key immediately** — shown only once
6. Save it somewhere safe

The key looks like:
```
re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Important: If you lose this key you cannot recover it. You must create a new one.

---

### Step 3 — Note the Sending Email for Development
During development (before domain is verified) Resend only allows
sending from their test domain:

```
onboarding@resend.dev
```

This is the "from" email used during development only.
After domain purchase and verification, this changes to something like:
```
noreply@ptepath.com
```

No action needed now — just note this.

---

### Step 4 — Save API Key to .env File
Open `backend/.env` and add:

```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
```

> FRONTEND_URL is used to build the password reset link in the email.
> In production this will change to your actual domain.
> For now localhost:3000 is correct for development.

---

### Step 5 — Verify Account is Working
1. In the Resend dashboard click **Emails** in the left sidebar
2. This is where sent email logs will appear
3. During development any test emails sent will show up here
4. Confirms your account is active

---

## What the Password Reset Email Will Look Like
When a student clicks Forgot Password, they receive:

```
Subject: Reset your PTEPath password

Hello,

You requested a password reset for your PTEPath account.

Click the link below to reset your password.
This link expires in 10 minutes.

[ Reset Password ]
https://yourdomain.com/reset-password?token=xxxxx&id=xxxxx

If you did not request this, ignore this email.
Your password will not change.

PTEPath Team
```

---

## Stage 2 Summary — What Happens After Domain Purchase
(Do not do this now — covered in 29-email-production-setup.md)

1. Purchase domain (e.g. ptepath.com)
2. Go to Resend dashboard → Domains → Add Domain
3. Add DNS records Resend gives you to your domain registrar
4. Wait for verification (usually 15–30 minutes)
5. Update RESEND_FROM_EMAIL in production .env to `noreply@ptepath.com`
6. Password reset emails now send to any student email address

---

## What You Now Have
- Resend account created
- API key generated and saved
- Development sending email noted
- All values added to backend/.env

---

## Your backend/.env File Should Now Look Like This
```
MONGO_URI=mongodb+srv://ptepath-admin:<password>@ptepath-cluster.xxxxx.mongodb.net/ptepath?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=onboarding@resend.dev
FRONTEND_URL=http://localhost:3000
```

---

## Done ✓
Resend is ready for development.
All 5 external services are now set up.

## Next Step
→ Follow `06-project-structure.md`
→ From here onwards all steps are for Claude Code to implement.
