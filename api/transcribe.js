export const config = { api: { bodyParser: false } };

const MAX_AUDIO_BYTES = 4 * 1024 * 1024;
const TRANSCRIPTION_MODEL = "whisper-large-v3-turbo";

function fail(res, status, code, error) {
  return res.status(status).json({ code, error });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return fail(res, 405, "METHOD_NOT_ALLOWED", "Use POST to send an audio clip.");
  }
  if (!process.env.GROQ_API_KEY) {
    return fail(res, 503, "CONFIG_MISSING", "Voice transcription isn’t configured on the server yet.");
  }

  const mimeType = String(req.headers["content-type"] || "").split(";")[0].toLowerCase();
  if (!mimeType.startsWith("audio/")) {
    return fail(res, 415, "AUDIO_TYPE_UNSUPPORTED", "I couldn’t read that recording format. Try another browser or type your question.");
  }

  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > MAX_AUDIO_BYTES) {
        return fail(res, 413, "AUDIO_TOO_LARGE", "That recording is too long. Please record a shorter question.");
      }
      chunks.push(chunk);
    }
    if (!size) {
      return fail(res, 400, "AUDIO_EMPTY", "I didn’t receive any audio. Please try recording again.");
    }

    const extension = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : mimeType.includes("mp4") ? "mp4" : mimeType.includes("wav") ? "wav" : "audio";
    const form = new FormData();
    form.append("file", new Blob(chunks, { type: mimeType }), `question.${extension}`);
    form.append("model", TRANSCRIPTION_MODEL);
    form.append("language", "en");
    form.append("response_format", "json");

    const upstream = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: form,
      signal: AbortSignal.timeout(25000),
    });

    if (!upstream.ok) {
      if (upstream.status === 429) return fail(res, 429, "GROQ_RATE_LIMITED", "I’ve reached my voice transcription limit. Please wait and try again, or type your question.");
      if (upstream.status === 401 || upstream.status === 403) return fail(res, 502, "GROQ_AUTH_FAILED", "I can’t access voice transcription right now. Please check the server key in Vercel.");
      if (upstream.status === 400 || upstream.status === 413 || upstream.status === 415) return fail(res, 502, `GROQ_AUDIO_REJECTED_${upstream.status}`, "Groq couldn’t process that recording. Try a shorter clip or type your question.");
      return fail(res, 502, `GROQ_TRANSCRIPTION_HTTP_${upstream.status}`, "Voice transcription is temporarily unavailable. Please type your question or try again shortly.");
    }

    const result = await upstream.json();
    if (typeof result?.text !== "string" || !result.text.trim()) {
      return fail(res, 502, "TRANSCRIPTION_EMPTY", "I couldn’t make out any words. Please try again in a quieter place or type your question.");
    }
    return res.status(200).json({ text: result.text.trim() });
  } catch (error) {
    if (error?.name === "TimeoutError" || error?.name === "AbortError") {
      return fail(res, 504, "GROQ_TRANSCRIPTION_TIMEOUT", "Voice transcription took too long. Please try again or type your question.");
    }
    return fail(res, 502, "TRANSCRIPTION_REQUEST_FAILED", "I couldn’t reach voice transcription. Please check your connection and try again.");
  }
}
