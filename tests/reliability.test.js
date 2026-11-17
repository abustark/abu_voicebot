import test from 'node:test';
import assert from 'node:assert/strict';
import chatHandler, { SYSTEM_PROMPT } from '../api/chat.js';
import transcribeHandler from '../api/transcribe.js';
import { matchQuestionKey } from '../src/legacy.js';

function responseMock() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

const originalFetch = globalThis.fetch;
const originalKey = process.env.GROQ_API_KEY;
test.after(() => {
  globalThis.fetch = originalFetch;
  if (originalKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = originalKey;
});

test('deterministic matcher handles supported intents and leaves unknown prompts to fallback', () => {
  assert.equal(matchQuestionKey('Hi'), 'greet');
  assert.equal(matchQuestionKey('What do you do at Amazon?'), 'life');
  assert.equal(matchQuestionKey('Why should we consider you?'), 'hire');
  assert.equal(matchQuestionKey('Why do you want to join 100x?'), 'why');
  assert.equal(matchQuestionKey('What is your favorite movie?'), null);
  assert.equal(matchQuestionKey(''), null);
});

test('profile fallback prompt maintains truth and persona boundaries', () => {
  assert.match(SYSTEM_PROMPT, /never guess or fill gaps with assumptions/i);
  assert.match(SYSTEM_PROMPT, /do not state or imply that I have built, worked on, or tinkered with AI agents or prompts/i);
  assert.match(SYSTEM_PROMPT, /For unrelated or live factual questions/i);
  assert.match(SYSTEM_PROMPT, /For a simple greeting/i);
});

test('chat API rejects invalid methods, empty questions, and overlong questions', async () => {
  const method = responseMock();
  await chatHandler({ method: 'GET' }, method);
  assert.equal(method.statusCode, 405);
  const empty = responseMock();
  await chatHandler({ method: 'POST', body: { q: '  ' } }, empty);
  assert.equal(empty.statusCode, 400);
  const long = responseMock();
  await chatHandler({ method: 'POST', body: { q: 'x'.repeat(501) } }, long);
  assert.equal(long.statusCode, 413);
});

test('chat API handles missing configuration and successful grounded upstream requests', async () => {
  delete process.env.GROQ_API_KEY;
  const missing = responseMock();
  await chatHandler({ method: 'POST', body: { q: 'Tell me about your experience' } }, missing);
  assert.equal(missing.statusCode, 503);

  process.env.GROQ_API_KEY = 'test-key';
  let upstreamBody;
  globalThis.fetch = async (_url, options) => {
    upstreamBody = JSON.parse(options.body);
    return { ok: true, json: async () => ({ choices: [{ message: { content: '  I validate multimodal data.  ' } }] }) };
  };
  const success = responseMock();
  await chatHandler({ method: 'POST', body: { q: 'What do you do?' } }, success);
  assert.equal(success.statusCode, 200);
  assert.deepEqual(success.body, { text: 'I validate multimodal data.' });
  assert.equal(upstreamBody.messages[0].content, SYSTEM_PROMPT);
  assert.equal(upstreamBody.messages[1].content, 'What do you do?');
});

test('chat API maps provider rate limits and timeouts to safe errors', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
  const limited = responseMock();
  await chatHandler({ method: 'POST', body: { q: 'question' } }, limited);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.body.code, 'GROQ_RATE_LIMITED');

  globalThis.fetch = async () => { throw Object.assign(new Error('timeout'), { name: 'TimeoutError' }); };
  const timedOut = responseMock();
  await chatHandler({ method: 'POST', body: { q: 'question' } }, timedOut);
  assert.equal(timedOut.statusCode, 504);
  assert.equal(timedOut.body.code, 'GROQ_TIMEOUT');
});

test('transcription API validates media type and rejects empty audio', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  const unsupported = responseMock();
  await transcribeHandler({ method: 'POST', headers: { 'content-type': 'text/plain' } }, unsupported);
  assert.equal(unsupported.statusCode, 415);

  const empty = responseMock();
  await transcribeHandler({ method: 'POST', headers: { 'content-type': 'audio/webm' }, [Symbol.asyncIterator]: async function* () {} }, empty);
  assert.equal(empty.statusCode, 400);
  assert.equal(empty.body.code, 'AUDIO_EMPTY');
});

test('transcription API sends audio upstream and returns trimmed transcript', async () => {
  process.env.GROQ_API_KEY = 'test-key';
  let upstreamOptions;
  globalThis.fetch = async (_url, options) => {
    upstreamOptions = options;
    return { ok: true, json: async () => ({ text: '  Tell me about your projects.  ' }) };
  };
  const req = { method: 'POST', headers: { 'content-type': 'audio/webm;codecs=opus' }, [Symbol.asyncIterator]: async function* () { yield Buffer.from('audio'); } };
  const res = responseMock();
  await transcribeHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { text: 'Tell me about your projects.' });
  assert.equal(upstreamOptions.method, 'POST');
  assert.match(upstreamOptions.headers.Authorization, /^Bearer test-key$/);
  assert.ok(upstreamOptions.body instanceof FormData);
});
