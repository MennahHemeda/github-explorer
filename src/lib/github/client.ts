import { GitHubError, GitHubNetworkError, GitHubNotFoundError, GitHubRateLimitError } from "./errors";

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
  const response = await fetchWithRetry(`${GITHUB_API_URL}${path}`, {
    headers: buildHeaders(),
    next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw toError(response, path);
  }
  return response;
}

const NETWORK_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * fetch() throws (instead of returning a response) when the connection itself fails:
 * DNS, reset, timeout. Those failures are usually momentary, so retry a couple of times
 * with a short back-off before giving up with a clear GitHubNetworkError.
 */
export async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      if (attempt >= NETWORK_RETRIES) throw new GitHubNetworkError(error);
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }
  }
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

  const pageNumbers = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
  const remainingPages = await mapWithConcurrency(pageNumbers, MAX_PARALLEL_PAGES, (page) =>
    githubFetch<T[]>(pageUrl(page), options),
  );

  return firstPage.concat(...remainingPages);
}

/** Pages fetched at the same time. Enough to be fast, few enough not to flood the connection. */
const MAX_PARALLEL_PAGES = 5;

/** Like Promise.all(items.map(fn)), but with at most `limit` calls running at once. Keeps order. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}
