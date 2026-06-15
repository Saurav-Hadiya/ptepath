# 04 — Groq Setup

## What This Is
Manual setup step. Follow it yourself.
No Claude Code needed for this step.

---

## What Groq Is Used For
Groq hosts the Whisper speech-to-text model.
Used exclusively in the Speaking module to convert student audio recordings into text.
The text is then used for scoring (content, fluency, pronunciation).

This is the STT (Speech-to-Text) Adapter in the platform.
If Groq is ever replaced in future, only the adapter file changes — nothing else.

---

## Free Tier Limits
| Limit | Value |
|---|---|
| Audio per day | 7,200 seconds (2 hours) |
| Requests per minute | 20 |
| Cost | Rs. 0 forever on free tier |

7,200 seconds per day = enough for approximately 180 speaking attempts at 40 seconds each.
More than sufficient for this platform at MVP stage.

---

## Step 1 — Create Groq Account
1. Go to console.groq.com
2. Click Sign Up
3. Sign up with email or Google account
4. Verify your email
5. You will land on the Groq console dashboard

---

## Step 2 — Create an API Key
1. In the Groq console click **API Keys** in the left sidebar
2. Click **Create API Key**
3. Give it a name: `ptepath-production`
4. Click **Submit**
5. **Copy the API key immediately** — it is only shown once
6. Save it somewhere safe

The key looks like:
```
gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> Important: If you lose this key you cannot recover it. You must create a new one.

---

## Step 3 — Note the Model to Use
When the backend calls Groq for transcription, it uses this model:

```
whisper-large-v3-turbo
```

This is the fastest and most cost-effective Whisper model on Groq.
Accurate enough for speaking practice scoring.
No action needed now — just note this for when Claude Code builds the STT adapter.

---

## Step 4 — Save API Key to .env File
Open `backend/.env` and add:

```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Replace with your actual API key from Step 2.

---

## Step 5 — Verify Account is Working
1. In the Groq console go to **Playground**
2. You will see a chat interface
3. This confirms your account is active and working
4. API access is immediately available after creating the key

---

## What the STT Adapter Will Do (For Your Reference)
When the backend receives a student audio file:
```
Receive audio file (WebM or MP4 from browser)
        ↓
Pass to stt.adapter.ts
        ↓
stt.adapter.ts sends file to Groq API
using groq-sdk npm package
        ↓
Groq returns:
  - transcript (full text string)
  - word-level timestamps (start + end time per word)
        ↓
Return { transcript, words } to scoring function
        ↓
Audio file deleted from server
```

---

## What You Now Have
- Groq account created
- API key generated and saved
- Model name noted: whisper-large-v3-turbo
- GROQ_API_KEY added to backend/.env

---

## Your backend/.env File Should Now Look Like This
```
MONGO_URI=mongodb+srv://ptepath-admin:<password>@ptepath-cluster.xxxxx.mongodb.net/ptepath?retryWrites=true&w=majority
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## Done ✓
Groq is ready.

## Next Step
→ Follow `05-resend-setup.md`
