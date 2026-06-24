# 010 — Speaking Backend

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/10-speaking-backend.md and implement exactly what is described."

---

## What to Build
Complete speaking module backend including:
- Question schema and CRUD for admin
- STT adapter (Groq Whisper — isolated swappable layer)
- Scoring logic for all 5 question types
- Evaluate routes for students

---

## Reference Docs
- `docs/md/speaking-module.md` — complete scoring logic, flows, DB schema, API routes
- `instructions/06-project-structure.md` — file locations

---

## Prerequisites
- `08-authentication-backend.md` complete
- authenticate and authorize middleware working
- Cloudinary configured in `src/config/cloudinary.ts`
- Multer upload middleware working in `src/middleware/upload.ts`

---

## Files to Implement

### 1. `src/models/speaking-question.model.ts`

Mongoose schema with these exact fields:

| Field | Type | Details |
|---|---|---|
| type | String | required, enum: ['read_aloud', 'repeat_sentence', 'describe_image', 'respond_situation', 'answer_short'] |
| content | String | required — passage, sentence, situation text, or question text |
| imageUrl | String | default: null — describe_image type only |
| imagePublicId | String | default: null — Cloudinary public ID for deletion |
| acceptedAnswers | [String] | default: [] — answer_short type only |
| speakingTime | Number | required — seconds student has to respond |
| preparationTime | Number | default: 0 — seconds before recording starts |
| isActive | Boolean | default: true |
| createdAt | Date | default: Date.now |
| attemptCount | Number | default: 0 |
| avgScore | Number | default: 0 |

Export as `SpeakingQuestion` model.

---

### 2. `src/services/stt.adapter.ts`

**This is the isolated STT layer. All speaking scoring calls only this file.**
If Groq is replaced in future, only this file changes.

**Input:** audio file path (string)
**Output:** `{ transcript: string, words: Array<{ word: string, start: number, end: number }> }`

Implementation using groq-sdk:
````
1. Read audio file from provided path
2. Create Groq client using GROQ_API_KEY from .env
3. Call Groq transcriptions.create:
   - model: 'whisper-large-v3-turbo'
   - file: audio file stream
   - response_format: 'verbose_json'
   - timestamp_granularities: ['word']
4. Extract transcript and words array from response
5. Return { transcript, words }
6. Delete temp audio file after transcription
7. On any error: delete temp file, throw error
````

Export as default function: `transcribeAudio(filePath: string)`

---

### 3. `src/scoring/speaking.scoring.ts`

Implement all scoring functions.
Read `docs/md/speaking-module.md` for complete scoring logic and weights.

---

**`calculateContentScore(transcript, expectedText)`**
````
- Clean both: lowercase, remove punctuation
- Split into word arrays
- For each word in expected: check if match exists in transcript
  within edit distance ≤ 2 using fastest-levenshtein
- matchCount / expectedWords.length × 100
- Return number 0-100
````

---

**`calculateFluencyScore(words, speakingTime)`**
````
words = array of { word, start, end } from Groq

WPM calculation:
- If words array empty → return 0
- totalDuration = last word end - first word start (in seconds)
- If totalDuration = 0 → use speakingTime
- wpm = (words.length / totalDuration) × 60

WPM scoring:
- Below 60  → score 20-40 (linear in range)
- 60-100    → score 40-65 (linear in range)
- 100-140   → score 65-85 (linear in range)
- 140-180   → score 85-100 (linear in range)
- Above 180 → score 60-75 (linear in range)

Pause detection:
- Iterate consecutive word pairs
- If gap between word[i].end and word[i+1].start > 2 seconds → count as pause
- Deduct 2 points per pause from fluency score
- Minimum fluency score: 0

Return { score: number, wpm: number, pauseCount: number }
````

---

**`calculatePronunciationScore(transcript, expectedText)`**
````
- Clean both texts
- Split into word arrays
- Count words in expected that appear in transcript
  within edit distance ≤ 2
- recognitionRatio = matched / expected.length
- pronunciationScore = recognitionRatio × 100
- Return number 0-100
````

---

**`calculateEngagementScore(transcript, recordingDuration)`**
````
- Count words in transcript
- expectedWords = recordingDuration × 2.2
- score = (actualWords / expectedWords) × 100
- Cap at 100
- Return number 0-100
````

---

**`generateFeedback(scores, questionType)`**
````
Find lowest scoring criterion.
Return one feedback string based on lowest criterion and score range.
Use feedback messages from docs/md/speaking-module.md
````

---

**Scoring functions per question type:**

`scoreReadAloud(transcript, words, passage, speakingTime)`
````
content     = calculateContentScore(transcript, passage) × 0.40
fluencyData = calculateFluencyScore(words, speakingTime)
fluency     = fluencyData.score × 0.40
pronunciation = calculatePronunciationScore(transcript, passage) × 0.20
finalPercent = content + fluency + pronunciation
displayScore = Math.round(finalPercent × 0.90)
Return full score object
````

`scoreRepeatSentence(transcript, words, sentence, speakingTime)`
````
Same as scoreReadAloud
Same weights: content 40%, fluency 40%, pronunciation 20%
````

`scoreDescribeImage(transcript, words, recordingDuration)`
````
fluencyData  = calculateFluencyScore(words, recordingDuration)
fluency      = fluencyData.score × 0.50
pronunciation = calculatePronunciationScore(transcript, transcript) × 0.20
engagement   = calculateEngagementScore(transcript, recordingDuration) × 0.30
finalPercent = fluency + pronunciation + engagement
displayScore = Math.round(finalPercent × 0.90)
Return full score object
````

`scoreRespondSituation(transcript, words, recordingDuration)`
````
Identical to scoreDescribeImage
Same weights: fluency 50%, pronunciation 20%, engagement 30%
````

`scoreAnswerShort(transcript, acceptedAnswers)`
````
Clean transcript: lowercase, remove punctuation, trim
For each accepted answer: clean it, calculate edit distance to transcript
If any accepted answer matches with distance ≤ 2 → contentScore = 100
Else contentScore = 0

pronunciation = calculatePronunciationScore(transcript, transcript)

finalPercent = (contentScore × 0.70) + (pronunciation × 0.30)
displayScore = Math.round(finalPercent × 0.90)
Return score object including isCorrect boolean and primaryCorrectAnswer
````

---

**Standard Score Response Object:**
```typescript
{
  contentScore: number | null
  fluencyScore: number | null
  pronunciationScore: number | null
  engagementScore: number | null
  finalScore: number
  displayScore: string  // e.g. "72 / 90"
  wpm: number | null
  feedback: string
  correctAnswer?: string  // answer_short only
}
```

---

### 4. `src/controllers/speaking.controller.ts`

---

**Admin Controllers:**

`addQuestion` — POST /api/admin/speaking/questions
````
1. Get type + content + speakingTime + preparationTime
   + acceptedAnswers from req.body
2. If type = 'describe_image': handle image upload from req.file
   Upload to Cloudinary folder ptepath/speaking/images
   Save imageUrl + imagePublicId
3. Validate required fields per type:
   - All types: type, speakingTime required
   - read_aloud, repeat_sentence, respond_situation: content required
   - describe_image: imageUrl required (from upload)
   - answer_short: content required, acceptedAnswers min 1 item
4. Create and save SpeakingQuestion document
5. Return 201 { success: true, data: { question } }
````

`getAllQuestions` — GET /api/admin/speaking/questions
````
1. Get type from query params (optional filter)
2. Build filter: { ...(type && { type }) }
3. Find questions matching filter, sort by createdAt desc
4. Return 200 { success: true, data: { questions, total } }
````

`updateQuestion` — PUT /api/admin/speaking/questions/:id
````
1. Find question by id
2. If not found → 404
3. Update only provided fields
4. If type = describe_image and new image uploaded:
   Delete old image from Cloudinary using imagePublicId
   Upload new image, update imageUrl + imagePublicId
5. Save and return updated question
````

`deleteQuestion` — DELETE /api/admin/speaking/questions/:id
````
1. Find question by id
2. If not found → 404
3. If type = describe_image and imagePublicId exists:
   Delete image from Cloudinary
4. Delete question document
5. Return 200 { success: true, message: 'Question deleted.' }
````

`toggleStatus` — PATCH /api/admin/speaking/questions/:id/status
````
1. Find question by id
2. Toggle isActive to provided boolean
3. Save and return 200 with message
````

---

**Student Controllers:**

`getQuestion` — GET /api/speaking/question/:type/:id
````
1. Find active question by id and type
2. If type = 'answer_short':
   Do NOT include acceptedAnswers in response
3. Return question data
````

`getRandomQuestion` — GET /api/speaking/question/:type/random
````
1. Find all active questions of given type
2. Pick one randomly
3. Return same as getQuestion (exclude acceptedAnswers for answer_short)
````

`evaluateReadAloud` — POST /api/speaking/evaluate/read-aloud
````
1. Get audio file from req.file (multer temp upload)
2. Get questionId from req.body
3. Find question by id
4. If not found → 404
5. Call transcribeAudio(req.file.path) → { transcript, words }
6. Call scoreReadAloud(transcript, words, question.content, question.speakingTime)
7. Update question: increment attemptCount, recalculate avgScore
8. Update student: increment totalAttempts, update lastActiveAt
9. Return 200 with score object
10. Audio file deleted inside stt.adapter.ts after transcription
````

`evaluateRepeatSentence` — POST /api/speaking/evaluate/repeat-sentence
````
Same flow as evaluateReadAloud
Call scoreRepeatSentence instead
````

`evaluateDescribeImage` — POST /api/speaking/evaluate/describe-image
````
1. Get audio file + questionId + recordingDuration from req.body
2. Find question by id
3. Call transcribeAudio(req.file.path)
4. Call scoreDescribeImage(transcript, words, recordingDuration)
5. Update question stats + student stats
6. Return score object
````

`evaluateRespondSituation` — POST /api/speaking/evaluate/respond-situation
````
Same flow as evaluateDescribeImage
Call scoreRespondSituation instead
````

`evaluateAnswerShort` — POST /api/speaking/evaluate/answer-short
````
1. Get audio file + questionId from req.body
2. Find question by id — include acceptedAnswers
3. Call transcribeAudio(req.file.path)
4. Call scoreAnswerShort(transcript, question.acceptedAnswers)
5. Update question stats + student stats
6. Return score object including correctAnswer
````

---

**Rolling Average Update — Shared Logic**
Use this for every evaluate controller:
````
question.attemptCount += 1
question.avgScore = ((question.avgScore × (question.attemptCount - 1)) + finalScore) / question.attemptCount
await question.save()
````

**Student Stats Update — Shared Logic:**
````
await User.findByIdAndUpdate(req.user.userId, {
  $inc: { totalAttempts: 1 },
  lastActiveAt: new Date()
})
````

---

### 5. `src/routes/speaking.routes.ts`

**Admin routes** — require authenticate + authorize('admin'):
````
POST   /api/admin/speaking/questions              → uploadImage, addQuestion
GET    /api/admin/speaking/questions              → getAllQuestions
PUT    /api/admin/speaking/questions/:id          → uploadImage, updateQuestion
DELETE /api/admin/speaking/questions/:id          → deleteQuestion
PATCH  /api/admin/speaking/questions/:id/status   → toggleStatus
````

**Student routes** — require authenticate:
````
GET    /api/speaking/question/:type/:id           → getQuestion
GET    /api/speaking/question/:type/random        → getRandomQuestion
POST   /api/speaking/evaluate/read-aloud          → uploadAudio (multer temp), evaluateReadAloud
POST   /api/speaking/evaluate/repeat-sentence     → uploadAudio (multer temp), evaluateRepeatSentence
POST   /api/speaking/evaluate/describe-image      → uploadAudio (multer temp), evaluateDescribeImage
POST   /api/speaking/evaluate/respond-situation   → uploadAudio (multer temp), evaluateRespondSituation
POST   /api/speaking/evaluate/answer-short        → uploadAudio (multer temp), evaluateAnswerShort
````

For student evaluate routes use multer with temp disk storage (not Cloudinary).
Audio file is used for transcription then deleted — never stored permanently.

---

## Multer Config for Audio Evaluate Routes

Use `multer({ dest: 'tmp/' })` for temporary audio storage.
Audio deleted inside stt.adapter.ts after transcription.
Create `tmp/` folder in backend root.
Add `tmp/` to `.gitignore`.

---

## Expected Output When Done
- Admin can add/edit/delete/toggle speaking questions
- Image upload works for Describe Image questions
- Students can fetch questions by type and id
- All 5 evaluate routes return correct score objects
- Audio files are never stored permanently
- Question stats updated on every submission
- Student stats updated on every submission

---

## Verification Steps
1. POST /api/admin/speaking/questions (read_aloud) → question created
2. GET /api/speaking/question/read-aloud/random → returns active question
3. POST /api/speaking/evaluate/read-aloud (with audio) → returns score object
4. Check MongoDB → question.attemptCount incremented, avgScore updated
5. Check MongoDB → student.totalAttempts incremented, lastActiveAt updated
6. DELETE /api/admin/speaking/questions/:id (describe_image) → image deleted from Cloudinary

---

## Notes
- stt.adapter.ts is the ONLY file that imports groq-sdk
- All 5 evaluate routes delete audio after scoring — never store student audio
- acceptedAnswers never sent to frontend before submission
- imagePublicId stored for Cloudinary deletion — not exposed in API responses
- Describe Image and Respond to Situation share same scoring function weights
- Read Aloud and Repeat Sentence share same scoring function weights
- No difficulty field anywhere — removed from this platform

## Next Step
→ Give Claude Code `11-writing-backend.md`
