# Abu Voicebot

A voice-enabled interview and profile assistant for visitors who want to learn about Basith AbuSyed’s verified experience, projects, and goals. It answers in Abu’s first-person interview voice, offers suggested questions, and lets visitors type or use voice input.

**Live demo:** [abuvoicebot.vercel.app](https://abuvoicebot.vercel.app)  
**Source:** [github.com/abustark/abu_voicebot](https://github.com/abustark/abu_voicebot)  
**Portfolio:** [abufolio.vercel.app](https://abufolio.vercel.app)

## What it does

- Starts with categorized suggested questions and offers topic-related follow-ups.
- Uses local, deterministic answers for supported profile questions, with a Groq-powered fallback for other in-scope questions.
- Accepts typed questions and, when available, browser speech recognition. A MediaRecorder/transcription fallback is provided on supported browsers.
- Reads responses aloud through the browser’s speech synthesis when enabled; users can stop playback or replay a response.
- Offers light/dark themes and a new-chat action. Theme preference is stored locally.
- Keeps profile answers grounded: when information is missing, the assistant should say so rather than invent details.

## Technology

- React 19 and Vite
- Astryx design system and locally bundled Figtree variable font
- Vanilla JavaScript for the conversation, local answer matching, voice interactions, and DOM-based chat UI
- Vercel serverless functions for chat and audio transcription
- Groq chat completion model `openai/gpt-oss-120b` and transcription model `whisper-large-v3-turbo`

## Run locally

Requirements: Node.js 20.19+ or 22.12+ (Vite 8 requirement) and npm.

```bash
npm install
npm test
npm run build
npm run dev
```

The Vite server runs the frontend. The `/api/chat` and `/api/transcribe` serverless endpoints require a Vercel Functions runtime and the server-side `GROQ_API_KEY` environment variable; plain `npm run dev` does not provide those functions. For an end-to-end local run, use the Vercel CLI (`vercel dev`) with the project’s environment configured through Vercel. Keep provider credentials server-side—never place them in frontend code or commit them to the repository.

## How the project is structured

```text
.
├── api/
│   ├── chat.js             # Profile-grounded Groq chat endpoint
│   └── transcribe.js       # Audio upload and Groq transcription endpoint
├── src/
│   ├── main.jsx            # React root, Astryx controls, theme state
│   ├── legacy.html         # Chat interface markup
│   ├── legacy.js           # Answer matching, chat flow, voice and speech controls
│   └── legacy.css          # Responsive interface and themes
├── tests/
│   └── reliability.test.js # Node test-runner checks for matcher and API behavior
├── index.html
└── vite.config.mjs
```

More detail: [Architecture](docs/ARCHITECTURE.md) · [Privacy](docs/PRIVACY.md)

## Quality checks

```bash
npm test       # Node built-in test runner
npm run build  # production frontend bundle
```

The tests cover supported intent matching, profile-grounding instructions, chat request validation and selected upstream failures, and transcription validation/success. The production build may report warnings from the current Astryx/Vite dependency bundle; these are not test failures.

## Privacy notes

The app does not save chat history on its own. Questions that require a generated response are sent to the serverless chat endpoint and then to Groq. Audio handling depends on the selected browser voice path; see the [privacy notes](docs/PRIVACY.md) before using voice input.

## Scope and accuracy

This is a focused personal interview/profile assistant, not a general-purpose chatbot. Its answer policy is limited to Abu’s profile and verified project facts. It must not claim that Abu has built, worked on, or tinkered with AI agents or prompts. See the system instructions in `api/chat.js` and the deterministic answers in `src/legacy.js` when reviewing profile claims.
