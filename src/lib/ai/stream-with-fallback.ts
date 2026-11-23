import { streamText, type LanguageModel, type TextStreamPart, type ToolSet } from "ai";

type Part = TextStreamPart<ToolSet>;

export interface ModelCandidate {
  id: string;
  model: LanguageModel;
  providerOptions?: Parameters<typeof streamText>[0]["providerOptions"];
}

/** The streamText options this app uses (a single prompt, no tools). */
interface StreamTextOptions {
  system: string;
  prompt: string;
  maxOutputTokens?: number;
  maxRetries?: number;
  abortSignal?: AbortSignal;
}

/** Thrown when every model failed before writing anything. `cause` is the last failure. */
export class AllModelsFailedError extends Error {
  constructor(cause: unknown) {
    super("Every AI model failed before producing an answer.", { cause });
    this.name = "AllModelsFailedError";
  }
}

/**
 * Like streamText, but moves on to the next model whenever one fails BEFORE writing any text:
 * busy, out of quota, unavailable, an error mid-request, or an empty answer.
 * Once text has started we stay with that model, so the user never sees two answers mixed together.
 *
 * Throws AllModelsFailedError if no model produced any text.
 */
export async function streamTextWithFallback(
  candidates: ModelCandidate[],
  options: StreamTextOptions,
): Promise<{ stream: ReadableStream<Part>; modelId: string }> {
  let lastFailure: unknown = new Error("No AI models are configured.");

  for (const candidate of candidates) {
    if (options.abortSignal?.aborted) break; // the visitor left, or we ran out of time

    const result = streamText({
      ...options,
      model: candidate.model,
      providerOptions: candidate.providerOptions,
      // Failures are handled below and logged once by the caller; skip the SDK's default console dump.
      onError: () => {},
    });
    const reader = result.stream.getReader();

    // Read until the first piece of text (success), an error, or the end of an empty answer.
    const buffered: Part[] = [];
    let failure: unknown = null;
    let sawText = false;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value.type === "error") {
        failure = value.error;
        break;
      }
      buffered.push(value);
      if (value.type === "text-delta" && value.text.length > 0) {
        sawText = true;
        break;
      }
    }

    if (!sawText) {
      const reason = failure ?? new Error("The model finished without writing any text.");
      console.warn(`AI model "${candidate.id}" failed before answering, trying the next one:`, describe(reason));
      lastFailure = reason;
      await reader.cancel().catch(() => {});
      continue;
    }

    // Replay what we already read, then pass the rest of the stream through unchanged.
    const stream = new ReadableStream<Part>({
      start(controller) {
        for (const part of buffered) controller.enqueue(part);
      },
      async pull(controller) {
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

  throw new AllModelsFailedError(lastFailure);
}

function describe(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message.slice(0, 200)}` : String(error);
}
