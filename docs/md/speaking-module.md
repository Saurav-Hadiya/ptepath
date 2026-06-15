# Speaking Module — Complete Blueprint

## Overview

**Platform:** PTEPath — PTE Exam Practice Platform
**Module:** Speaking
**Question Types:** 5
**Scoring:** Rule-based only. No AI. No paid services.
**STT Tool:** Groq Whisper API (free tier) via isolated swappable adapter.

---

## Tech Stack — Speaking Module

| Concern | Decision | Tool |
|---|---|---|
| Audio recording | Browser-side | MediaRecorder API (all browsers) |
| Speech-to-Text | Server-side via adapter | Groq Whisper API (free tier) |
| Text-to-Speech | Browser-side | Web Speech Synthesis API |
| Image storage | Cloud CDN | Cloudinary |
| Score calculation | Server-side | Node.js custom logic |
| Fuzzy word match | npm library | fastest-levenshtein |
| Audio storage | None | Discarded immediately after scoring |
| Database | MongoDB Atlas | Attempt result records only |

---

## Architecture — Universal Flow (All 5 Question Types)

ADMIN       → Adds question data in Admin Panel

STUDENT     → Sees question, prepares, records audio response

BROWSER     → Captures audio using MediaRecorder API (all browsers)

FRONTEND    → Sends audio file to backend via API call

BACKEND     → Passes audio to STT Adapter → receives transcript

BACKEND     → Runs scoring logic → produces score object

FRONTEND    → Receives score → displays result to student

AUDIO       → Discarded after processing. Nothing stored.

---

## STT Adapter — Swappable Layer

**File:** `stt.adapter.js` (or `stt.adapter.ts`)

This is a single isolated file. All scoring logic calls only this adapter.
If Groq is replaced in future, only this file changes. Nothing else is affected.

**Input:** Audio file path (WebM or MP4)
**Output:** `{ transcript: string, words: [{ word, start, end }] }`

**Current implementation:** Groq Whisper API
- Sign up at groq.com → get free API key
- Store in `.env` as `GROQ_API_KEY`
- Model to use: `whisper-large-v3-turbo`
- Free tier: 7,200 seconds of audio per day
- Speed: 1–3 seconds per clip
- Zero server load — Groq handles processing

**How to swap in future:**
1. Open `stt.adapter.js`
2. Replace internal implementation with new provider
3. Keep input/output contract identical
4. No other files need changing

---

## Audio Recording — Browser Side

Use `MediaRecorder` API. No library needed. Works on all browsers.

- Chrome / Edge / Firefox → records as WebM
- Safari (iOS 14.5+) → records as MP4
- Both formats accepted by Groq Whisper

**Flow:**
1. Request mic permission via `navigator.mediaDevices.getUserMedia`
2. Initialise `MediaRecorder` with audio stream
3. Collect audio chunks in array on `ondataavailable`
4. On stop: assemble chunks into Blob
5. Wrap in `FormData` and POST to backend evaluate endpoint

**Mic denied handling:**
Show message: "Microphone access is required. Please allow microphone access in your browser settings and refresh the page."
Show a visual guide for Chrome, Edge, Safari.

---

## Scoring Framework

### Criteria

| Criterion | What It Measures | Method |
|---|---|---|
| Content Accuracy | Did the student say the right words? | Word-by-word comparison. Fuzzy match with edit distance ≤ 2. |
| Fluency | Natural pace, no long pauses? | WPM from word timestamps. Pause detection (gap > 2s between words). |
| Pronunciation (proxy) | Was speech clear? | Ratio of correctly recognised words vs expected. Unrecognised = unclear. |
| Engagement (open-ended only) | Did student speak throughout? | Total words spoken ÷ expected words for time given × 100. |

### Criteria Weights Per Question Type

| Question Type | Content | Fluency | Pronunciation | Engagement |
|---|---|---|---|---|
| Read Aloud | 40% | 40% | 20% | — |
| Repeat Sentence | 40% | 40% | 20% | — |
| Describe Image | — | 50% | 20% | 30% |
| Respond to Situation | — | 50% | 20% | 30% |
| Answer Short Question | 70% | — | 30% | — |

### Final Score Formula

Final % = (Content × weight) + (Fluency × weight) + (Pronunciation × weight) + (Engagement × weight)

Display Score = Final % × 90   ← scores are out of 90 (real PTE scale)

**Example — Read Aloud:**

Content:      78% × 0.40 = 31.2

Fluency:      85% × 0.40 = 34.0

Pronunciation:72% × 0.20 = 14.4

Total:                    = 79.6% → 72 / 90

### WPM Scoring Scale (Fluency)

| WPM Range | Score |
|---|---|
| Below 60 | 20–40% |
| 60–100 | 40–65% |
| 100–140 | 65–85% |
| 140–180 | 85–100% |
| Above 180 | 60–75% (penalise for rushing) |

### Engagement Scoring (Open-ended types)

Expected words = recording duration in seconds × 2.2
Engagement % = (actual words spoken ÷ expected words) × 100, capped at 100%

---

## Question Type 1 — Read Aloud

### What It Is
Passage of text shown on screen. Student reads it aloud. Scored on content, fluency, pronunciation.

### Admin Setup
- Navigate: Admin Panel → Speaking → Read Aloud → Add Question
- Fields to fill:
  - **Passage text** (plain text, no formatting)
  - **Speaking time** (default: 40 seconds)
  - **Preparation time** (default: 30 seconds)
- No audio upload, no keywords, no model answer needed.

### Student Flow
1. Passage shown on screen
2. Preparation timer counts down (30 seconds)
3. Recording starts automatically
4. Student reads passage aloud
5. Recording stops when timer ends or student clicks Stop
6. "Analysing your response..." shown (2–5 seconds)
7. Score screen shown

### Developer — Frontend
- Fetch question: `GET /api/speaking/question/read-aloud/:id`
- Display passage text
- Preparation countdown using `setInterval`
- After prep: call `getUserMedia` → start `MediaRecorder`
- Speaking countdown visible
- On end: POST audio + questionId to backend
- Show loading → render score

### Developer — Backend
- Route: `POST /api/speaking/evaluate/read-aloud`
- Receive audio via Multer
- Pass to STT Adapter → get transcript + word timestamps
- Fetch passage text from DB using questionId
- Run content scoring: clean both texts → word array comparison → fuzzy match (edit distance ≤ 2) → match %
- Run fluency scoring: WPM from timestamps → pause detection (gap > 2s)
- Run pronunciation scoring: unrecognised words ratio
- Calculate weighted final score
- Generate feedback (see Feedback Messages section)
- Return score JSON. Delete audio temp file.

### Scoring Breakdown

| Criterion | Weight | Measurement |
|---|---|---|
| Content Accuracy | 40% | Word match % vs passage text |
| Fluency (WPM) | 30% | WPM in 100–160 range = full score |
| Fluency (Pauses) | 10% | Deduct per long pause (gap > 2s) |
| Pronunciation | 20% | Recognition quality proxy |

---

## Question Type 2 — Repeat Sentence

### What It Is
A sentence is spoken aloud to the student (via browser TTS). Student repeats it exactly. Tests listening, memory, pronunciation.

### Admin Setup
- Navigate: Admin Panel → Speaking → Repeat Sentence → Add Question
- Fields:
  - **Sentence text** (typed as plain text — browser TTS speaks it)
  - **Speaking time** (default: 15 seconds)
- No audio file upload. Browser TTS handles playback.

### Student Flow
1. Screen shows: "Listen carefully, then repeat the sentence."
2. Sentence spoken aloud by browser TTS (text NOT shown on screen)
3. 1-second pause after TTS finishes
4. Recording starts automatically
5. Student repeats sentence
6. Score shown

### Developer — Frontend
- Fetch question: `GET /api/speaking/question/repeat-sentence/:id`
- Receive sentence text — DO NOT render on screen
- Use `window.speechSynthesis.speak()` with `lang: 'en-US'`, `rate: 0.9`
- Attach `onend` listener → wait 1 second → start `MediaRecorder`
- 15-second speaking countdown
- Send audio to backend
- After score shown: reveal correct sentence text for student review

### Developer — Backend
- Route: `POST /api/speaking/evaluate/repeat-sentence`
- Same flow as Read Aloud
- Compare transcript to original sentence text from DB
- Content scoring: fuzzy word match (edit distance ≤ 1 per word)

### Scoring Breakdown

| Criterion | Weight | Measurement |
|---|---|---|
| Content Accuracy | 40% | Word match vs original sentence |
| Fluency (WPM) | 30% | Natural pace for short sentence |
| Fluency (Pauses) | 10% | Long mid-sentence pauses |
| Pronunciation | 20% | Recognition quality |

---

## Question Type 3 — Describe Image

### What It Is
An image (chart, graph, photo, diagram) is shown. Student describes what they see. Open-ended — no fixed correct answer.

### Admin Setup
- Navigate: Admin Panel → Speaking → Describe Image → Add Question
- Fields:
  - **Image file** (upload JPG/PNG → stored on Cloudinary)
  - **Speaking time** (default: 40 seconds)
  - **Preparation time** (default: 25 seconds)
- No keywords. No model answer. Image only.

### Student Flow
1. Image shown on screen
2. Preparation timer: 25 seconds
3. Recording starts automatically. Image stays visible.
4. Student describes image for up to 40 seconds
5. Score shown (Fluency + Pronunciation + Engagement — no content score)

### Developer — Frontend
- Fetch question: `GET /api/speaking/question/describe-image/:id`
- Receive image URL from Cloudinary
- Display image. Prep countdown. Start recording. Image stays visible during recording.
- Send audio + questionId + actual recording duration to backend

### Developer — Backend
- Route: `POST /api/speaking/evaluate/describe-image`
- Receive audio + duration
- STT Adapter → transcript + timestamps
- Fluency: WPM + pause detection
- Engagement: total words ÷ (duration × 2.2) × 100
- Pronunciation: recognition quality
- No content comparison needed
- Return score + feedback

### Scoring Breakdown

| Criterion | Weight | Measurement |
|---|---|---|
| Fluency (WPM) | 30% | WPM in natural range |
| Fluency (Pauses) | 20% | Pause frequency |
| Pronunciation | 20% | Recognition quality |
| Engagement | 30% | Words spoken vs expected for time |

---

## Question Type 4 — Respond to Situation

### What It Is
A real-life scenario paragraph is shown. Student responds verbally as they would in that situation. Open-ended.

### Admin Setup
- Navigate: Admin Panel → Speaking → Respond to Situation → Add Question
- Fields:
  - **Situation paragraph** (3–5 sentences describing the scenario)
  - **Speaking time** (default: 40 seconds)
  - **Preparation time** (default: 30 seconds)
- No model answer needed.

### Student Flow
1. Situation paragraph shown on screen
2. Preparation: 30 seconds. Student reads and plans.
3. Recording starts. Situation text stays visible during recording.
4. Student responds for up to 40 seconds
5. Score shown

### Developer
- Identical flow to Describe Image on both frontend and backend
- Only difference: question delivers text paragraph instead of image
- Scoring logic: shared function with Describe Image (same criteria, same weights)

### Scoring Breakdown
Identical to Describe Image:
Fluency 50% + Pronunciation 20% + Engagement 30%

---

## Question Type 5 — Answer Short Question

### What It Is
A simple question is asked aloud. Student answers in 1–5 words. Has a specific correct answer.

### Admin Setup
- Navigate: Admin Panel → Speaking → Answer Short Question → Add Question
- Fields:
  - **Question text** (browser TTS speaks it to student)
  - **Accepted answers** (1–3 acceptable answer strings, e.g. "architect", "building designer")
  - **Speaking time** (default: 10 seconds)
- Accepted answers stored on server only — never sent to browser before submission.

### Student Flow
1. Screen shows: "Listen to the question and give a short answer."
2. Question spoken aloud by browser TTS
3. Question text shown on screen after audio plays
4. Recording starts immediately after question ends (1-second gap)
5. Student speaks answer — 10 seconds max
6. Score shown + correct answer revealed

### Developer — Frontend
- Fetch question: `GET /api/speaking/question/answer-short/:id`
- Receive question text only — accepted answers NOT in response
- TTS speaks question → show text → start MediaRecorder
- Send audio + questionId to backend
- Display score + show correct answer from server response

### Developer — Backend
- Route: `POST /api/speaking/evaluate/answer-short`
- Receive audio → STT Adapter → short transcript (1–5 words)
- Fetch accepted answers array from DB
- Clean transcript: lowercase, remove punctuation
- For each accepted answer: calculate Levenshtein distance
- If any accepted answer matches with distance ≤ 2 → content score = 100%
- Pronunciation proxy: overall Whisper recognition quality
- Return score + primary correct answer for display
- Discard audio

### Scoring Breakdown

| Criterion | Weight | Measurement |
|---|---|---|
| Content Accuracy | 70% | Transcript matches any accepted answer (edit distance ≤ 2) |
| Pronunciation | 30% | Recognition quality |
| Fluency | Not scored | Too short for meaningful pace measurement |

---

## Database Schema — Speaking Module

### Speaking Questions Collection (`speaking_questions`)

| Field | Type | Description |
|---|---|---|
| _id | ObjectId | Auto-generated |
| type | String | read_aloud \| repeat_sentence \| describe_image \| respond_situation \| answer_short |
| content | String | Passage, sentence, situation text, or question text |
| imageUrl | String | Cloudinary URL — describe_image only. Null for others. |
| acceptedAnswers | Array | Strings — answer_short only. Null for others. |
| speakingTime | Integer | Seconds. How long student has to respond. |
| preparationTime | Integer | Seconds. Countdown before recording starts. |
| isActive | Boolean | Controls visibility to students |
| createdAt | Timestamp | Auto-set |
| attemptCount | Integer | Incremented per submission |
| avgScore | Float | Rolling average — updated per submission |

### Storage Rule — No Per-Attempt Records

No individual attempt records are stored.
On every submission, update only:
- `attemptCount` → increment by 1
- `avgScore` → rolling average formula: `((currentAvg × currentCount) + newScore) / (currentCount + 1)`

On student document, update:
- `totalAttempts` → increment by 1
- `lastActiveAt` → current timestamp

Student response audio and transcript → discarded immediately after scoring.

---

## API Routes — Speaking Module

### Student Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/speaking/question/:type/:id | Fetch one question by type and ID |
| GET | /api/speaking/question/:type/random | Fetch random question of given type |
| POST | /api/speaking/evaluate/read-aloud | Submit audio for Read Aloud scoring |
| POST | /api/speaking/evaluate/repeat-sentence | Submit audio for Repeat Sentence scoring |
| POST | /api/speaking/evaluate/describe-image | Submit audio for Describe Image scoring |
| POST | /api/speaking/evaluate/respond-situation | Submit audio for Respond to Situation scoring |
| POST | /api/speaking/evaluate/answer-short | Submit audio for Answer Short Question scoring |

### Admin Routes

| Method | Route | Purpose |
|---|---|---|
| GET | /api/admin/speaking/questions | List all questions (filter by type) |
| POST | /api/admin/speaking/questions | Add new question |
| PUT | /api/admin/speaking/questions/:id | Edit question |
| DELETE | /api/admin/speaking/questions/:id | Delete question |
| PATCH | /api/admin/speaking/questions/:id/status | Toggle active/inactive |

---

## Score Response Format (All Types)

```json
{
  "contentScore": 78,
  "fluencyScore": 85,
  "pronunciationScore": 70,
  "engagementScore": null,
  "finalScore": 79.6,
  "displayScore": "72 / 90",
  "wpm": 132,
  "feedback": "Your pronunciation could be clearer. Try to enunciate each word distinctly."
}
```

---

## Feedback Messages

One message shown based on lowest-scoring criterion:

| Criterion | Score Range | Message |
|---|---|---|
| Content | < 50% | Many words were missed. Practise reading the passage clearly before recording begins. |
| Content | 50–70% | Some words were missed or unclear. Try to read every word in the passage. |
| Fluency | < 50% | Your pace was quite slow. Try to speak more continuously without long pauses. |
| Fluency | 50–70% | Your pace could be more natural. Aim for a steady rhythm without stopping. |
| Pronunciation | < 50% | Your speech was difficult to understand. Practise speaking each word clearly. |
| Pronunciation | 50–70% | Your pronunciation could be clearer. Focus on enunciating each word distinctly. |
| Engagement | < 50% | Try to speak throughout the full time given. There is no penalty for attempting. |
| All above 80% | — | Excellent attempt! Keep practising to maintain this level of performance. |

---

## Key Rules — Must Follow While Building

- All scoring runs on the server. Frontend only records, sends, displays.
- Audio is discarded immediately after scoring. Never stored.
- STT Adapter is the only file that knows which STT service is used.
- MediaRecorder handles recording — no library needed.
- TTS for question playback uses browser Web Speech Synthesis API.
- Describe Image and Respond to Situation share one scoring function.
- Read Aloud and Repeat Sentence share one scoring function.
- Answer Short Question uses binary content (correct/wrong), not percentage.
- Fuzzy matching uses edit distance ≤ 2 for content comparison.
- Scores are out of 90 (real PTE scale). `displayScore = finalPercent × 90`.
- No difficulty field anywhere — removed from this platform.
