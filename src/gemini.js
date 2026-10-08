// gemini.js — Gemini API communication and response parsing

const { GoogleGenAI } = require('@google/genai');

// Model list — primary first, fallback(s) after.
// To change models or order, edit this list only.
// All models here must support image (multimodal) input.
const CANDIDATE_MODELS = [
  'gemini-3.8-flash',      // primary: newest, fastest
  'gemini-3.5-flash-lite', // fallback: used when primary is overloaded
];

const MAX_ROUNDS = 3;       // try all models up to this many rounds
const TIMEOUT_MS = 30000;   // 30 s per individual attempt

// Prompt instructs Gemini to return structured JSON with JP and EN content in one call.
// days_remaining is intentionally omitted — calculated in-app for accuracy.
const DOCUMENT_PROMPT = `You are analyzing a Japanese official document (from a government office, insurance company, or school).

Extract the following information and return ONLY valid JSON with no markdown fences and no explanation:
{
  "deadline_jp": "deadline date in Japanese era format exactly as printed (e.g. 令和8年10月31日), or null if no deadline in document",
  "deadline_iso": "same deadline as YYYY-MM-DD (e.g. 2026-10-31), or null. Always return even if date is in the past.",
  "ja": {
    "what": "what the recipient must do, in simple Japanese (やさしい日本語, one short sentence)",
    "how": "how to do it, in simple Japanese (one short sentence)"
  },
  "en": {
    "what": "what the recipient must do, in plain English (one short sentence)",
    "by_when": "deadline in English including the full year (e.g. By October 31, 2026), or null",
    "how": "how to do it, in plain English (one short sentence)"
  }
}
If this is not a Japanese official document, return exactly: {"error":"not_a_document"}`;

// Validation prompt — used only to check that the API key works.
const VALIDATION_PROMPT = 'Reply with the single word: ok';

// Calculate days remaining using JST date-only comparison.
// Positive = future, 0 = today, negative = overdue.
function calcDaysRemainingJST(deadlineIso) {
  if (!deadlineIso) return null;
  const jstOffsetMs = 9 * 60 * 60 * 1000;
  const nowJst = new Date(Date.now() + jstOffsetMs);
  const todayMs = Date.UTC(nowJst.getUTCFullYear(), nowJst.getUTCMonth(), nowJst.getUTCDate());
  const [dy, dm, dd] = deadlineIso.split('-').map(Number);
  const deadlineMs = Date.UTC(dy, dm - 1, dd);
  return Math.round((deadlineMs - todayMs) / 86400000);
}

function isOverloaded(err) {
  const msg = err.message || '';
  return msg === 'TIMEOUT' ||
    msg.includes('503') ||
    msg.includes('429') ||
    msg.toLowerCase().includes('unavailable') ||
    msg.toLowerCase().includes('resource_exhausted');
}

async function callModel(ai, model, contents) {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('TIMEOUT')), TIMEOUT_MS)
  );
  const callPromise = ai.models.generateContent({ model, contents });
  return Promise.race([callPromise, timeoutPromise]);
}

async function readDocument(apiKey, base64Image, mimeType = 'image/jpeg') {
  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    {
      parts: [
        { text: DOCUMENT_PROMPT },
        { inlineData: { mimeType, data: base64Image } },
      ],
    },
  ];

  for (let round = 0; round < MAX_ROUNDS; round++) {
    if (round > 0) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    for (const model of CANDIDATE_MODELS) {
      try {
        const response = await callModel(ai, model, contents);
        const text = (response.text || '').trim();
        // Strip markdown code fences if Gemini wraps the JSON
        const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
        const result = JSON.parse(cleaned);
        // Add app-calculated fields
        result.days_remaining = calcDaysRemainingJST(result.deadline_iso);
        if (result.deadline_iso) {
          const [y, m, d] = result.deadline_iso.split('-').map(Number);
          result.deadline = `${y}年${m}月${d}日`; // Gregorian for primary display
        } else {
          result.deadline = null;
        }
        console.log(`[Paperclear] success — model: ${model}, round: ${round + 1}`);
        return result;
      } catch (err) {
        if (isOverloaded(err)) {
          console.log(`[Paperclear] ${model} overloaded (round ${round + 1}), trying next`);
          continue;
        }
        throw err; // non-retryable (auth error, bad request, etc.)
      }
    }
  }

  // All rounds and all models exhausted
  throw new Error('503');
}

async function validateApiKey(apiKey) {
  const ai = new GoogleGenAI({ apiKey });
  await ai.models.generateContent({
    model: CANDIDATE_MODELS[0],
    contents: VALIDATION_PROMPT,
  });
}

module.exports = { readDocument, validateApiKey, CANDIDATE_MODELS };
