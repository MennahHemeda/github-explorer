import { buildHeaders, DEFAULT_REVALIDATE_SECONDS, fetchWithRetry, GITHUB_API_URL, toError, type GitHubFetchOptions } from "./client";
import { GitHubError, GitHubNotFoundError } from "./errors";

interface GraphQLResponse<T> {
  data?: T;
  errors?: { type?: string; message: string }[];
}

/**
 * POST a query to the GitHub GraphQL API.
 * GraphQL lets us get a whole year of contribution data in ONE request,
 * where the REST API would need one request per repository.
 */
export async function githubGraphQL<T>(
  query: string,
  variables: Record<string, unknown>,
  options: GitHubFetchOptions = {},
): Promise<T> {
  if (!process.env.GITHUB_TOKEN) {
    throw new GitHubError("The GitHub GraphQL API requires GITHUB_TOKEN to be set.", 401);
  }

  const response = await fetchWithRetry(`${GITHUB_API_URL}/graphql`, {
    method: "POST",
    headers: { ...buildHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: options.revalidate ?? DEFAULT_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw toError(response, "/graphql");
  }

  const body = (await response.json()) as GraphQLResponse<T>;

  if (body.errors?.length) {
    if (body.errors.some((error) => error.type === "NOT_FOUND")) {
      throw new GitHubNotFoundError(JSON.stringify(variables));
    }
    throw new GitHubError(`GitHub GraphQL error: ${body.errors[0].message}`, 502);
  }
  if (!body.data) {
    throw new GitHubError("GitHub GraphQL returned no data.", 502);
  }
  return body.data;
}
