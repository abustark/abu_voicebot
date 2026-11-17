# Privacy and data handling

This page documents what this repository’s code does. It is not a statement about the independent retention policies of browsers, hosting providers, or Groq; review those providers’ current policies separately.

## Chat questions

- Questions matched by `src/legacy.js` use a local, prewritten profile answer.
- Unmatched questions are sent to the app’s `/api/chat` serverless endpoint. That endpoint sends the question and the profile-grounding instructions to Groq for a generated response.
- The app does not write chat messages to a database or save conversation history across page loads. Messages are kept in the current page session.
- The browser stores the selected theme (`abu-theme`) in `localStorage`.

## Voice input

The browser may use its `SpeechRecognition` implementation when available. Audio processing for this path is provided by the browser and its speech service, rather than by this app’s `/api/transcribe` endpoint; the exact handling depends on the browser/provider.

When the app uses its MediaRecorder fallback, it records microphone audio and sends the clip to `/api/transcribe`, which forwards it to Groq for transcription. The endpoint accepts audio up to 4 MiB. The returned transcript is shown in the editable message field so the visitor can review it before sending. This code does not store recordings or transcripts in a database.

Microphone access requires browser support, permission, and a secure context. Visitors can decline microphone permission and type instead.

## Read-aloud

Speech output uses the browser’s `SpeechSynthesis` API. The app does not upload response text to its transcription endpoint for read-aloud.

## Credentials and transport

`GROQ_API_KEY` is read only by the serverless functions. Do not put the key in frontend code, commit it, or ask visitors to enter it. Configure it as a server-side deployment environment variable. Requests to the hosted app and its API should use HTTPS.

## Limitations

- The repository does not implement analytics, user accounts, persistent chat storage, or a delete-history workflow because it does not store chat history.
- Requests processed by Groq or browser speech services are subject to those services’ own policies and operational logging. This app cannot promise their retention or processing details.
- For a privacy question, consult the policies of the currently deployed hosting, model, and browser speech providers.
