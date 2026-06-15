# 03 — Cloudinary Setup

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What You Will Do
- Create a Cloudinary account
- Get API credentials
- Create upload folders for the platform
- Add credentials to your .env file

---

## What Cloudinary Is Used For in This Platform
| What | Where Used |
|---|---|
| Audio files | Listening module — admin uploads MP3/WAV/M4A question audio |
| Image files | Speaking module — Describe Image question images |

All other modules use no file storage.
Student audio recordings (Speaking module) are processed and discarded — never stored.

---

## Step 1 — Create Cloudinary Account
1. Go to cloudinary.com
2. Click Sign Up For Free
3. Fill in:
   - First name, Last name
   - Email address
   - Password
4. Verify your email
5. You will land on the Cloudinary dashboard

---

## Step 2 — Find Your API Credentials
On the Cloudinary dashboard homepage you will see your account details:

Look for the **API Keys** section or go to:
Settings → API Keys

You need these three values:
- **Cloud Name** — looks like: `dxxxxxxxx`
- **API Key** — looks like: `123456789012345`
- **API Secret** — looks like: `aBcDeFgHiJkLmNoPqRsTuVwXyZ`

Copy all three and save them somewhere safe.

---

## Step 3 — Create Folders for Organisation
This keeps your uploaded files organised in Cloudinary.

1. In the Cloudinary dashboard click **Media Library** in the left sidebar
2. Click **New Folder** button
3. Create these folders one by one:
   - `ptepath/listening/audio`
   - `ptepath/speaking/images`

This gives a clean structure:
```
ptepath/
├── listening/
│   └── audio/       ← all listening audio files go here
└── speaking/
    └── images/      ← all describe-image question images go here
```

---

## Step 4 — Check Free Tier Limits
Cloudinary free tier includes:
- **25 GB** storage
- **25 GB** bandwidth per month
- Enough for hundreds of audio files and images at this platform's scale

No credit card needed for free tier.

---

## Step 5 — Save Credentials to .env File
Open `backend/.env` and add these lines:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
```

Replace the values with your actual credentials from Step 2.

---

## Step 6 — Note Upload Settings
These settings will be used when backend code uploads files.
No action needed now — just be aware of them for when Claude Code builds the upload logic.

| Setting | Value |
|---|---|
| Audio folder path | `ptepath/listening/audio` |
| Image folder path | `ptepath/speaking/images` |
| Max audio file size | 5MB |
| Accepted audio formats | mp3, wav, m4a |
| Accepted image formats | jpg, jpeg, png |
| Resource type for audio | `video` (Cloudinary uses this for audio too) |
| Resource type for images | `image` |

> Note: Cloudinary uses `resource_type: 'video'` for audio files. This is correct — not a mistake.

---

## Step 7 — Verify Credentials
To confirm your credentials are correct:
1. Go to cloudinary.com/console
2. Make sure you can see your Cloud Name, API Key in the dashboard
3. Your API Secret is hidden by default — click the eye icon to reveal and verify

---

## What You Now Have
- Cloudinary account on free tier
- Cloud Name, API Key, API Secret ready
- Upload folders created for audio and images
- All credentials saved in `backend/.env`

---

## Your backend/.env File Should Now Look Like This
```
MONGO_URI=mongodb+srv://ptepath-admin:<password>@ptepath-cluster.xxxxx.mongodb.net/ptepath?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## Done ✓
Cloudinary is ready.

## Next Step
→ Follow `04-groq-setup.md`
