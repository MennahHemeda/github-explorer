import {
  APICallError,
  createUIMessageStream,
  createUIMessageStreamResponse,
  RetryError,
  StreamProviderError,
  toUIMessageStream,
  type TextStreamPart,
  type ToolSet,
} from "ai";
import { buildUserStats, getAllRepos, getContributions, getUser, isValidUsername, settle } from "@/lib/github";
import { getSavedAnalysis, isFresh, saveAnalysis, type SavedAnalysis } from "@/lib/ai/analysis-cache";
import { getModelCandidates } from "@/lib/ai/models";
import { buildProfilePrompt, PROFILE_ANALYST_SYSTEM_PROMPT } from "@/lib/ai/profile-prompt";
import { AllModelsFailedError, streamTextWithFallback } from "@/lib/ai/stream-with-fallback";

// Allow the response to keep streaming for up to 60 seconds on Vercel.
export const maxDuration = 60;

/** Give up instead of leaving the user waiting forever (covers all fallback attempts). */
const AI_TIMEOUT_MS = 50_000;

/** Answers shorter than this are treated as broken and not saved. */
const MIN_SAVED_LENGTH = 80;

/**
 * POST /api/analyze  { "username": "octocat", "fresh"?: true }
 *
 * The client only sends a username; the server loads the profile itself, so nobody can
 * inject their own text into the prompt. Layers that keep this working:
 *   1. A saved analysis less than 24 hours old is returned immediately (no AI call).
 *   2. Otherwise models are tried in order across two providers until one answers.
 *   3. If every model fails, the last saved analysis (any age) is shown instead of an error.
 * `fresh: true` (the Regenerate button) skips step 1.
 */
export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const field = (name: string) => (typeof body === "object" && body !== null ? (body as Record<string, unknown>)[name] : undefined);
  const username = field("username");
  const wantsFresh = field("fresh") === true;

  if (typeof username !== "string" || !isValidUsername(username)) {
    return textError("Please provide a valid GitHub username.", 400);
  }

  const saved = await getSavedAnalysis(username);
  if (saved && !wantsFresh && isFresh(saved)) {
    return savedAnalysisResponse(saved);
  }

  const candidates = getModelCandidates();
  if (candidates.length === 0) {
    return saved
      ? savedAnalysisResponse(saved)
      : textError("AI analysis is not configured on the server (no AI API key set).", 503);
  }

  // Same cached GitHub calls the pages use, so this usually costs no extra API requests.
  const result = await settle(async () => {
    const [user, repos, contributions] = await Promise.all([
      getUser(username),
      getAllRepos(username),
      getContributions(username),
    ]);
    return { user, repos, stats: buildUserStats(user, repos, contributions) };
  }).catch((error: unknown) => {
    // Anything unexpected from GitHub (an outage, a rejected token) is handled like "unreachable".
    console.error("Could not load GitHub data for the analysis:", error);
    return { status: "unreachable" } as const;
  });

  if (result.status !== "ok") {
    if (saved) return savedAnalysisResponse(saved);
    if (result.status === "not-found") return textError(`GitHub user "${username}" was not found.`, 404);
    if (result.status === "rate-limited") return textError("GitHub rate limit reached. Please try again in a few minutes.", 429);
    return textError("Couldn't reach GitHub. Check the internet connection and try again.", 502);
  }

  let ai: Awaited<ReturnType<typeof streamTextWithFallback>>;
  try {
    ai = await streamTextWithFallback(candidates, {
      system: PROFILE_ANALYST_SYSTEM_PROMPT,
      prompt: buildProfilePrompt(result.stats, result.repos, result.user),
      // Includes the model's hidden "thinking" tokens, so leave plenty of room;
      // the prompt itself keeps the visible answer short (< 200 words).
      maxOutputTokens: 4096,
      // One retry per model at most: on free tiers every attempt counts against the quota.
      maxRetries: 1,
      abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(AI_TIMEOUT_MS)]),
    });
  } catch (error) {
    console.error("AI analysis failed:", error);
    if (saved) return savedAnalysisResponse(saved);
    return textError(describeAiError(error), 503);
  }

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: ai.stream.pipeThrough(saveWhenComplete(username, ai.modelId)),
      onError: (error) => {
        console.error("AI analysis failed mid-answer:", error);
        return describeAiError(error);
      },
    }),
  });
}

/** Passes the stream through unchanged and saves the full text once it finished without errors. */
function saveWhenComplete(login: string, model: string) {
  let text = "";
  let failed = false;
  return new TransformStream<TextStreamPart<ToolSet>, TextStreamPart<ToolSet>>({
    transform(part, controller) {
      if (part.type === "text-delta") text += part.text;
      if (part.type === "error" || part.type === "abort") failed = true;
      controller.enqueue(part);
    },
    async flush() {
      if (!failed && text.trim().length >= MIN_SAVED_LENGTH) {
        await saveAnalysis(login, text.trim(), model);
      }
    },
  });
}

/** Streams a saved analysis in the same format as a live one, so the client handles both the same way. */
function savedAnalysisResponse(saved: SavedAnalysis) {
  return createUIMessageStreamResponse({
    stream: createUIMessageStream({
      execute: ({ writer }) => {
        writer.write({ type: "text-start", id: "saved" });
        writer.write({ type: "text-delta", id: "saved", delta: saved.content });
        writer.write({ type: "text-end", id: "saved" });
      },
    }),
  });
}

/** A short, safe explanation for the user. Never includes keys or raw provider responses. */
function describeAiError(error: unknown): string {
  // Unwrap the SDK's retry wrapper and our own "every model failed" wrapper.
  if (RetryError.isInstance(error)) return describeAiError(error.lastError);
  if (error instanceof AllModelsFailedError) return describeAiError(error.cause);

  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "The AI took too long to respond. Please try again.";
  }
  const status = APICallError.isInstance(error) || StreamProviderError.isInstance(error) ? error.statusCode : undefined;
  switch (status) {
    case 401:
    case 403:
      return "The AI service rejected the API key. Check the AI keys in the server settings.";
    case 429:
      return "Today's free AI quota is used up on every available model. Please try again later.";
    case 500:
    case 502:
    case 503:
      return "All AI models are busy right now. Please try again in a moment.";
  }
  return "The AI service couldn't finish the analysis. Please try again in a moment.";
}

function textError(message: string, status: number) {
  return new Response(message, { status, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
