# Architecture

## Request and response flow

1. `src/main.jsx` renders the app shell and mounts Astryx-powered speaker, new-chat, and theme controls.
2. `src/legacy.html` supplies the chat markup. `src/legacy.js` initializes the conversation, matches common profile questions locally, and sends unmatched questions to `/api/chat`.
3. `api/chat.js` validates the request, combines the question with a profile-grounding system prompt, and calls Groq’s chat-completions API using the server-side `GROQ_API_KEY`.
4. Voice input uses browser `SpeechRecognition` where supported. When that path is unavailable or fails in specific ways, the app can record audio with `MediaRecorder` and submit it to `/api/transcribe`.
5. `api/transcribe.js` accepts supported audio content up to 4 MiB, forwards it to Groq’s transcription endpoint, and returns a transcript. The transcript is placed in the composer for review and is not sent as a question until the visitor submits it.
6. Spoken playback uses the browser’s `SpeechSynthesis` API. It is independent of the server-side transcription request.

## Data and state

- Profile answers, question matching rules, conversation messages, transcripts, and follow-up prompts are held in page memory.
- The selected theme is saved as `abu-theme` in browser `localStorage`.
- The app does not implement chat accounts, a chat database, or server-side conversation history.
- Provider credentials are read by serverless functions from `GROQ_API_KEY`; no provider key is included in frontend requests.

## Runtime

The repository builds a static Vite frontend and exposes the `api/` handlers as Vercel serverless functions on deployment. `npm run dev` starts Vite only; it does not itself run those function handlers. Use a Vercel Functions-compatible local runtime for end-to-end local API testing.

## Key files

- `src/main.jsx` — React/Astryx app entry, theme persistence and top-bar controls.
- `src/legacy.html` — accessible chat, message log, suggestion region, and composer markup.
- `src/legacy.js` — deterministic intent matching, conversation UI, voice input/transcription flow, and browser speech.
- `api/chat.js` — input limits, grounded profile prompt, Groq completion call, and provider error mapping.
- `api/transcribe.js` — audio-size/type validation, Groq transcription call, and error mapping.
- `tests/reliability.test.js` — unit/smoke tests for matcher rules and API contracts.
