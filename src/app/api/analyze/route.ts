import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { APICallError, createUIMessageStreamResponse, RetryError, toUIMessageStream } from "ai";
import {
  buildUserStats,
  getAllRepos,
  getContributions,
  getUser,
  isValidUsername,
  settle,
} from "@/lib/github";
import { buildProfilePrompt, PROFILE_ANALYST_SYSTEM_PROMPT } from "@/lib/ai/profile-prompt";
import { streamTextWithFallback, type ModelCandidate } from "@/lib/ai/stream-with-fallback";

// Allow the response to keep streaming for up to 60 seconds on Vercel.
export const maxDuration = 60;

/**
 * Models to try, in order. On Google's free tier each model has its own small daily quota
 * and models are sometimes overloaded, so falling back to the next one keeps the feature working.
 * GEMINI_MODEL (optional) is tried first.
 */
const DEFAULT_MODELS = ["gemini-3.5-flash-lite", "gemini-3.8-flash", "gemini-flash-latest", "gemini-3-flash-preview"];
const MODEL_IDS = [...new Set([process.env.GEMINI_MODEL, ...DEFAULT_MODELS].filter((id): id is string => Boolean(id)))];

/** Give up instead of leaving the user waiting forever. */
const AI_TIMEOUT_MS = 50_000;

/**
 * Newer Gemini models "think" silently before writing, which delays the first word.
 * A profile summary doesn't need deep reasoning, so thinking is kept low.
 * (Gemini 2.5 uses a token budget, newer models a level.)
 */
function googleOptions(modelId: string): GoogleLanguageModelOptions {
  return { thinkingConfig: modelId.includes("2.5") ? { thinkingBudget: 0 } : { thinkingLevel: "low" } };
}

const MODEL_CANDIDATES: ModelCandidate[] = MODEL_IDS.map((id) => ({
  id,
  model: google(id),
  providerOptions: { google: googleOptions(id) },
}));

/**
 * POST /api/analyze  { "username": "octocat" }
 * Loads the profile on the server (the client only sends a username, so it can't
 * inject its own data into the prompt) and streams the AI analysis back.
 */
export async function POST(request: Request) {
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return textError("AI analysis is not configured on the server (missing GOOGLE_GENERATIVE_AI_API_KEY).", 503);
  }

  const body: unknown = await request.json().catch(() => null);
  const username = typeof body === "object" && body !== null && "username" in body ? body.username : null;
  if (typeof username !== "string" || !isValidUsername(username)) {
    return textError("Please provide a valid GitHub username.", 400);
  }

  // Same cached GitHub calls the pages use, so this usually costs no extra API requests.
  const result = await settle(async () => {
    const [user, repos, contributions] = await Promise.all([
      getUser(username),
      getAllRepos(username),
      getContributions(username),
    ]);
    return { user, repos, stats: buildUserStats(user, repos, contributions) };
  });

  if (result.status === "not-found") {
    return textError(`GitHub user "${username}" was not found.`, 404);
  }
  if (result.status === "rate-limited") {
    return textError("GitHub rate limit reached. Please try again in a few minutes.", 429);
  }

  const ai = await streamTextWithFallback(MODEL_CANDIDATES, {
    system: PROFILE_ANALYST_SYSTEM_PROMPT,
    prompt: buildProfilePrompt(result.stats, result.repos, result.user),
    // Includes the model's hidden "thinking" tokens, so leave plenty of room;
    // the prompt itself keeps the visible answer short (< 220 words).
    maxOutputTokens: 4096,
    // One retry per model at most: on the free tier every attempt counts against the daily quota.
    maxRetries: 1,
    abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(AI_TIMEOUT_MS)]),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: ai.stream,
      onError: (error) => {
        console.error("AI analysis failed:", error);
        return describeAiError(error);
      },
    }),
  });
}

/** A short, safe explanation for the user. Never includes keys or raw provider responses. */
function describeAiError(error: unknown): string {
  // The SDK retries failed calls and then wraps the last failure; report that one.
  if (RetryError.isInstance(error)) {
    return describeAiError(error.lastError);
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "The AI took too long to respond. Please try again.";
  }
  if (APICallError.isInstance(error)) {
    switch (error.statusCode) {
      case 400:
      case 401:
      case 403:
        // Google's own explanation, e.g. "API key not valid" or an unsupported setting.
        return `The AI service rejected the request: ${providerMessage(error)}`;
      case 404:
        return "None of the configured AI models are available for this API key.";
      case 429:
        return /per day|daily/i.test(error.message)
          ? "Today's free AI quota is used up for all available models. Please try again tomorrow."
          : "The AI service quota was reached. Please wait a minute and try again.";
      case 500:
      case 503:
        return "All AI models are busy right now. Please try again in a moment.";
    }
    return `The AI service returned an error (HTTP ${error.statusCode ?? "unknown"}). Please try again.`;
  }
  const kind = error instanceof Error ? ` (${error.name})` : "";
  return `The AI service could not complete the analysis${kind}. Please try again.`;
}

/** Google's error text, shortened. It describes the problem and never echoes the API key. */
function providerMessage(error: APICallError): string {
  const message = error.message.replace(/\s+/g, " ").trim();
  return message.length > 220 ? `${message.slice(0, 220)}…` : message;
}

function textError(message: string, status: number) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
