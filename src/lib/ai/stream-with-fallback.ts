import { APICallError, RetryError, streamText, type LanguageModel, type TextStreamPart, type ToolSet } from "ai";

/** The streamText options this app uses (a single prompt, no tools). */
interface StreamTextOptions {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
  maxRetries?: number;
  abortSignal?: AbortSignal;
}
type Part = TextStreamPart<ToolSet>;

export interface ModelCandidate {
  id: string;
  model: LanguageModel;
  providerOptions?: Parameters<typeof streamText>[0]["providerOptions"];
}

/** Busy, out of quota, or not offered to this key: worth trying the next model. */
export function isTemporaryModelFailure(error: unknown): boolean {
  const cause = RetryError.isInstance(error) ? error.lastError : error;
  return APICallError.isInstance(cause) && [404, 429, 500, 503].includes(cause.statusCode ?? 0);
}

/**
 * Like streamText, but tries the next model if one fails BEFORE writing any text
 * (busy, quota reached, model unavailable). Once text has started, we stay with that model,
 * so the user never sees two half-answers mixed together.
 *
 * Returns the stream plus the id of the model that answered.
 */
export async function streamTextWithFallback(
  candidates: ModelCandidate[],
  options: StreamTextOptions,
): Promise<{ stream: ReadableStream<Part>; modelId: string }> {
  let lastFailure: unknown = null;

  for (const [index, candidate] of candidates.entries()) {
    const isLast = index === candidates.length - 1;
    const result = streamText({
      ...options,
      model: candidate.model,
      providerOptions: candidate.providerOptions,
      // Errors are handled below (fallback) and logged once by the caller; skip the SDK's default console dump.
      onError: () => {},
    });
    const reader = result.stream.getReader();

    // Read until the first piece of text (success) or an error (maybe try the next model).
    const buffered: Part[] = [];
    let failure: unknown = null;
    let sawText = false;
    let finishReason: unknown = null;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.type === "error") {
        failure = value.error;
        break;
      }
      buffered.push(value);
      if (value.type === "finish") finishReason = value.finishReason;
      if (value.type === "text-delta" && value.text.length > 0) {
        sawText = true;
        break;
      }
    }

    // Finished without writing anything (e.g. a safety filter or all tokens spent "thinking").
    const finishedEmpty = failure === null && !sawText;
    if (finishedEmpty) {
      console.warn(`AI model "${candidate.id}" returned no text (finish reason: ${JSON.stringify(finishReason)}).`);
    }

    if (!isLast && (finishedEmpty || (failure !== null && isTemporaryModelFailure(failure)))) {
      if (!finishedEmpty) console.warn(`AI model "${candidate.id}" unavailable, trying the next one.`);
      lastFailure = failure;
      await reader.cancel().catch(() => {});
      continue;
    }

    // Replay what we already read, then pass the rest of the stream through unchanged.
    const stream = new ReadableStream<Part>({
      start(controller) {
        for (const part of buffered) controller.enqueue(part);
        if (failure !== null) {
          controller.enqueue({ type: "error", error: failure } as Part);
          controller.close();
        }
      },
      async pull(controller) {
        if (finishedEmpty) {
          controller.close();
          return;
        }
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
        } else if (value.type === "abort" && options.abortSignal?.aborted) {
          // A stop caused by our time limit would otherwise end the text silently, mid-sentence.
          controller.enqueue({ type: "error", error: options.abortSignal.reason } as Part);
          controller.close();
        } else {
          controller.enqueue(value);
        }
      },
      cancel(reason) {
        return reader.cancel(reason);
      },
    });
    return { stream, modelId: candidate.id };
  }

  // Only reachable with an empty candidate list.
  throw lastFailure ?? new Error("No AI models configured.");
}
