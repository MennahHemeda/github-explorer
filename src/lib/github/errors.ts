/** Base class so callers can catch every GitHub failure with one `instanceof` check. */
export class GitHubError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

/** The requested user or resource does not exist (HTTP 404). */
export class GitHubNotFoundError extends GitHubError {
  constructor(resource: string) {
    super(`GitHub resource not found: ${resource}`, 404);
    this.name = "GitHubNotFoundError";
  }
}

/** The API rate limit was hit (HTTP 403/429 with no remaining requests). */
export class GitHubRateLimitError extends GitHubError {
  constructor(
    status: number,
    /** When the limit resets, or null if GitHub did not say. */
    public readonly resetAt: Date | null,
  ) {
    const when = resetAt ? ` Try again after ${resetAt.toLocaleTimeString()}.` : "";
    super(`GitHub API rate limit exceeded.${when}`, status);
    this.name = "GitHubRateLimitError";
  }
}
