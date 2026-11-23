import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { groq } from "@ai-sdk/groq";
import type { ModelCandidate } from "./stream-with-fallback";

/**
 * Which AI models to try, in order. Two independent providers, so an outage or
 * an exhausted free quota at one company never takes the feature down:
 * - Google Gemini (GOOGLE_GENERATIVE_AI_API_KEY): each model has its own free daily quota.
 * - Groq (GROQ_API_KEY, optional): fast open models (Llama), separate infrastructure.
 * The providers alternate, so a failing provider costs one attempt, not several in a row.
 */
const GEMINI_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
const GROQ_MODELS = ["llama-3.3-70b-versatile", "meta-llama/llama-4-scout-17b-16e-instruct"];

/**
 * Newer Gemini models "think" silently before writing, which delays the first word.
 * A profile summary doesn't need deep reasoning, so thinking is kept low.
 */
function geminiOptions(modelId: string): GoogleLanguageModelOptions {
  return { thinkingConfig: modelId.includes("2.5") ? { thinkingBudget: 0 } : { thinkingLevel: "low" } };
}

function geminiCandidate(id: string): ModelCandidate {
  return { id, model: google(id), providerOptions: { google: geminiOptions(id) } };
}

function groqCandidate(id: string): ModelCandidate {
  return { id: `groq/${id}`, model: groq(id) };
}

export function getModelCandidates(): ModelCandidate[] {
  const gemini = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? [...new Set([process.env.GEMINI_MODEL, ...GEMINI_MODELS].filter((id): id is string => Boolean(id)))].map(
        geminiCandidate,
      )
    : [];
  const groqModels = process.env.GROQ_API_KEY ? GROQ_MODELS.map(groqCandidate) : [];

  // Interleave: gemini, groq, gemini, groq, gemini…
  const ordered: ModelCandidate[] = [];
  for (let i = 0; i < Math.max(gemini.length, groqModels.length); i++) {
    if (gemini[i]) ordered.push(gemini[i]);
    if (groqModels[i]) ordered.push(groqModels[i]);
  }
  return ordered;
}
