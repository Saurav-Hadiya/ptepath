# 11 — Writing Backend - DONE

## What This Is
Claude Code instruction file.
Tell Claude Code: "Read instructions/11-writing-backend.md and implement exactly what is described."

---

## What to Build
Complete writing module backend including:
- Question schema and CRUD for admin
- Spell checking utility using nspell
- Word count scoring logic
- Evaluate routes for both question types

---

## Reference Docs
- `docs/md/writing-module.md` — complete scoring logic, flows, DB schema, API routes
- `instructions/06-project-structure.md` — file locations

---

## Prerequisites
- `08-authentication-backend.md` complete
- authenticate and authorize middleware working
- nspell and dictionary-en packages installed

---

## Files to Implement

### 1. `src/models/writing-question.model.ts`

Mongoose schema with these exact fields:

| Field | Type | Details |
|---|---|---|
| type | String | required, enum: ['summarise_written_text', 'write_essay'] |
| content | String | required — passage text (SWT) or essay prompt (WE) |
| timeLimit | Number | required — seconds. SWT default: 600. WE default: 1200. |
| wordMin | Number | required — SWT: 5. WE: 200. |
| wordMax | Number | required — SWT: 75. WE: 300. |
| isActive | Boolean | default: true |
| createdAt | Date | default: Date.now |
| attemptCount | Number | default: 0 |
| avgScore | Number | default: 0 |

Export as `WritingQuestion` model.

---

### 2. `src/scoring/writing.scoring.ts`

This file contains all writing scoring logic.
nspell is initialised ONCE when this module loads — not per request.

---

**nspell Initialisation (module level — runs once at server start)**
````
Import nspell and dictionary-en
Load dictionary aff and dic buffers from dictionary-en
Create spell checker instance
Store as module-level constant: spellChecker
This instance is reused for every request
````

---

**`countWords(text)`**
````
- Trim the text
- Split by one or more whitespace characters (/\s+/)
- Filter out empty strings
- Return array length
- Return 0 if text is empty or only whitespace
````

---

**`checkSpelling(text)`**

This is a shared utility. Used by both question types and by listening module.

````
1. Trim and lowercase the text
2. Remove punctuation from around words:
   replace /[.,!?;:"'()\[\]{}<>]/g with space
3. Split into word array
4. Filter empty strings
5. For each word: call spellChecker.correct(word)
6. Collect misspelled words (where correct() returns false)
7. Filter out:
   - Words that are numbers (e.g. "2024")
   - Words shorter than 2 characters
   - Words that are common abbreviations
8. Return:
   {
     total: number        — total words checked
     correct: number      — correctly spelled words
     incorrect: number    — misspelled words count
     misspelled: string[] — list of misspelled words (max 5 returned)
     score: number        — (correct / total) × 100, rounded to 1 decimal
   }
9. If text is empty → return { total: 0, correct: 0, incorrect: 0, misspelled: [], score: 0 }
````

---

**`calculateWordCountScore(wordCount, type)`**

For Summarise Written Text (type = 'summarise_written_text'):
````
wordCount 0-4   → score 0
wordCount 5-75  → score 100
wordCount 76-90 → score 50
wordCount 91+   → score 0
````

For Write Essay (type = 'write_essay'):
````
wordCount 0-99    → score 0
wordCount 100-149 → score 25
wordCount 150-199 → score 60
wordCount 200-300 → score 100
wordCount 301-320 → score 50
wordCount 321+    → score 0
````

Return number 0-100.

---

**`generateWritingFeedback(wordCountScore, spellingScore, type)`**

Return one feedback string based on scores.
Use feedback messages from `docs/md/writing-module.md`.

Logic:
````
If wordCount score = 0 and wordCount < min → return "too short" message
If wordCount score = 0 and wordCount > max → return "too long" message
If spelling score < 60 → return "many spelling errors" message
If spelling score 60-80 → return "some spelling errors" message
If wordCount good AND spelling > 85 → return "well done" message
If wordCount good AND spelling low → return "good length but spelling" message
````

---

**`scoreWriting(responseText, type)`**

Main scoring function. Called by both evaluate controllers.

````
1. wordCount = countWords(responseText)
2. wordCountScore = calculateWordCountScore(wordCount, type)
3. spellingResult = checkSpelling(responseText)
4. spellingScore = spellingResult.score
5. finalScore = (wordCountScore × 0.50) + (spellingScore × 0.50)
6. displayScore = Math.round(finalScore × 0.90) + ' / 90'
7. feedback = generateWritingFeedback(wordCountScore, spellingScore, type)
8. Return:
   {
     wordCount: number
     wordCountScore: number
     spellingScore: number
     spellingResult: spellingResult object
     finalScore: number
     displayScore: string
     feedback: string
     misspelledWords: string[]  — from spellingResult.misspelled
   }
````

---

### 3. `src/controllers/writing.controller.ts`

---

**Admin Controllers:**

`addQuestion` — POST /api/admin/writing/questions
````
1. Get type + content + timeLimit from req.body
2. Validate:
   - type: required, must be valid enum value
   - content: required, non-empty string
   - timeLimit: optional (use defaults if not provided)
3. Set wordMin and wordMax based on type:
   - summarise_written_text: wordMin=5, wordMax=75, timeLimit default=600
   - write_essay: wordMin=200, wordMax=300, timeLimit default=1200
4. Create and save WritingQuestion document
5. Return 201 { success: true, data: { question } }
````

`getAllQuestions` — GET /api/admin/writing/questions
````
1. Get type from query params (optional filter)
2. Find questions matching filter, sort createdAt desc
3. Return 200 { success: true, data: { questions, total } }
````

`getOneQuestion` — GET /api/admin/writing/questions/:id
````
1. Find question by id
2. If not found → 404
3. Return 200 { success: true, data: { question } }
````

`updateQuestion` — PUT /api/admin/writing/questions/:id
````
1. Find question by id
2. If not found → 404
3. Update only: content, timeLimit
4. Do not allow changing type or wordMin/wordMax
5. Save and return updated question
````

`deleteQuestion` — DELETE /api/admin/writing/questions/:id
````
1. Find question by id
2. If not found → 404
3. Delete document
4. Return 200 { success: true, message: 'Question deleted.' }
````

`toggleStatus` — PATCH /api/admin/writing/questions/:id/status
````
1. Find question by id
2. Set isActive to provided boolean
3. Save and return 200
````

---

**Student Controllers:**

`getQuestion` — GET /api/writing/:type/:id
````
1. Validate type is valid enum
2. Find active question by id and type
3. If not found → 404
4. Return question: { id, type, content, timeLimit, wordMin, wordMax }
````

`Also to getAllQuestions of the specific type`


`getRandomQuestion` — GET /api/writing/:type/random
````
1. Find all active questions of given type
2. Pick one randomly
3. Return same shape as getQuestion
````

`evaluateSummarise` — POST /api/writing/evaluate/summarise
````
1. Get questionId + responseText from req.body
2. Validate:
   - questionId: required
   - responseText: required, must be non-empty string
3. Find question by id and type 'summarise_written_text'
4. If not found → 404
5. Call scoreWriting(responseText, 'summarise_written_text')
6. Update question stats (attemptCount + avgScore rolling average)
7. Update student stats (totalAttempts + lastActiveAt)
8. Return 200 with score result object
9. Do NOT store responseText anywhere
````

`evaluateEssay` — POST /api/writing/evaluate/essay
````
Same flow as evaluateSummarise
Find question by type 'write_essay'
Call scoreWriting(responseText, 'write_essay')
Update stats same way
Return score result
Do NOT store responseText
````

---

**Rolling Average Update — Same as Speaking Module:**
````
question.attemptCount += 1
question.avgScore = ((question.avgScore × (question.attemptCount - 1)) + finalScore) / question.attemptCount
await question.save()
````

**Student Stats Update:**
````
await User.findByIdAndUpdate(req.user.userId, {
  $inc: { totalAttempts: 1 },
  lastActiveAt: new Date()
})
````

---

### 4. `src/routes/writing.routes.ts`

**Admin routes** — require authenticate + authorize('admin'):
````
POST   /api/admin/writing/questions           → addQuestion
GET    /api/admin/writing/questions           → getAllQuestions
GET    /api/admin/writing/questions/:id       → getOneQuestion
PUT    /api/admin/writing/questions/:id       → updateQuestion
DELETE /api/admin/writing/questions/:id       → deleteQuestion
PATCH  /api/admin/writing/questions/:id/status → toggleStatus
````

**Student routes** — require authenticate:
````
GET    /api/writing/:type/:id                 → getQuestion
GET    /api/writing/:type/random              → getRandomQuestion
POST   /api/writing/evaluate/summarise        → evaluateSummarise
POST   /api/writing/evaluate/essay            → evaluateEssay
````

---

## Score Response Format

```json
{
  "success": true,
  "data": {
    "wordCount": 52,
    "wordCountScore": 100,
    "spellingScore": 87.3,
    "finalScore": 93.6,
    "displayScore": "84 / 90",
    "feedback": "Good response length. Some spelling errors detected.",
    "misspelledWords": ["goverment", "enviromental"],
    "breakdown": {
      "wordCount": {
        "score": 100,
        "actual": 52,
        "min": 5,
        "max": 75
      },
      "spelling": {
        "score": 87.3,
        "correct": 47,
        "total": 54
      }
    }
  }
}
```

---

## Important Implementation Notes

### nspell Known Limitation
nspell may flag these as misspelled — filter them out:
- Pure numbers: `2024`, `100`
- Single characters: `a`, `I` (except keep `I`)
- Common proper nouns that appear frequently

### Misspelled Words in Response
- Return maximum 5 misspelled words in response
- If more than 5: return first 5
- Frontend shows: "'word1', 'word2' — check your spelling"

### responseText Never Stored
The student's written response is used only for scoring.
It is never saved to the database.
Only scores and stats are persisted.

---

## Expected Output When Done
- Admin can create/edit/delete/toggle writing questions
- Both question types have correct wordMin, wordMax, timeLimit defaults
- nspell initialised once at server start (not per request)
- checkSpelling() works correctly for both question types
- Evaluate routes return correct score objects
- misspelledWords included in response
- Question stats updated on every submission
- Student stats updated on every submission
- responseText never stored anywhere

---

## Verification Steps
1. POST /api/admin/writing/questions (summarise_written_text) → question created with wordMin=5, wordMax=75
2. POST /api/admin/writing/questions (write_essay) → question created with wordMin=200, wordMax=300
3. POST /api/writing/evaluate/summarise with short response → low wordCountScore
4. POST /api/writing/evaluate/summarise with valid response → wordCountScore=100
5. POST /api/writing/evaluate/essay with misspelled words → misspelledWords in response
6. Check MongoDB → no responseText stored, only scores updated
7. Check MongoDB → question.attemptCount incremented

---

## Notes
- nspell instance created once at module load — reused for all requests
- checkSpelling() is a shared utility — listening module will import it too
- Both question types use identical scoring weights (50/50)
- Only content and timeLimit can be updated — type/wordMin/wordMax are immutable
- No difficulty field anywhere — removed from this platform
- scoreWriting() is the single entry point for all writing scoring

## Next Step
→ Give Claude Code `12-reading-backend.md`
