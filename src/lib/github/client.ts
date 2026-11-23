import { GitHubError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";

export const GITHUB_API_URL = "https://api.github.com";

/** How long (seconds) Next.js may reuse a cached GitHub response before refetching. */
export const DEFAULT_REVALIDATE_SECONDS = 300;

export interface GitHubFetchOptions {
  revalidate?: number;
}

export function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Server-only env var (no NEXT_PUBLIC_ prefix), so the token never reaches the browser.
  const token = process.env.GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export function toError(response: Response, path: string): GitHubError {
  if (response.status === 404) {
    return new GitHubNotFoundError(path);
  }
  if (response.status === 401) {
    return new GitHubError("GitHub rejected the access token. Check GITHUB_TOKEN.", 401);
  }

  const remaining = response.headers.get("x-ratelimit-remaining");
  const isRateLimited =
    response.status === 429 || (response.status === 403 && remaining === "0");

  if (isRateLimited) {
    const reset = response.headers.get("x-ratelimit-reset");
    return new GitHubRateLimitError(
      response.status,
      reset ? new Date(Number(reset) * 1000) : null,
    );
  }

  return new GitHubError(
    `GitHub request failed (${response.status} ${response.statusText}): ${path}`,
    response.status,
  );
}

/**
 * Low-level request to the GitHub REST API. Returns the raw Response so callers
 * can read headers (e.g. the `Link` header for pagination).
 */
async function request(path: string, options: GitHubFetchOptions = {}): Promise<Response> {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    headers: buildHeaders(),
    next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw toError(response, path);
  }
  return response;
}

/** GET a single JSON resource from the GitHub REST API. */
export async function githubFetch<T>(path: string, options?: GitHubFetchOptions): Promise<T> {
  const response = await request(path, options);
  return (await response.json()) as T;
}

/**
 * Reads the last page number from GitHub's `Link` header, e.g.
 * <https://api.github.com/user/1/repos?per_page=100&page=7>; rel="last"
 */
function getLastPage(linkHeader: string | null): number {
  if (!linkHeader) return 1;
  const match = linkHeader.match(/[?&]page=(\d+)[^>]*>;\s*rel="last"/);
  return match ? Number(match[1]) : 1;
}

/**
 * GET every page of a paginated list endpoint.
 * The first page tells us how many pages exist; the rest are fetched in parallel
 * instead of one after another, so 10 pages take about as long as 2.
 *
 * @param path     endpoint path, without `per_page` / `page`
 * @param maxPages safety cap so one huge account cannot burn the whole rate limit
 */
export async function githubFetchAllPages<T>(
  path: string,
  { maxPages = 30, ...options }: GitHubFetchOptions & { maxPages?: number } = {},
): Promise<T[]> {
  const separator = path.includes("?") ? "&" : "?";
  const pageUrl = (page: number) => `${path}${separator}per_page=100&page=${page}`;

  const firstResponse = await request(pageUrl(1), options);
  const firstPage = (await firstResponse.json()) as T[];

  const lastPage = Math.min(getLastPage(firstResponse.headers.get("link")), maxPages);
  if (lastPage <= 1) return firstPage;

  const remainingPages = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, i) => githubFetch<T[]>(pageUrl(i + 2), options)),
  );

  return firstPage.concat(...remainingPages);
}
