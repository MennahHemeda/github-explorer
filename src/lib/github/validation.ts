/**
 * GitHub usernames: 1–39 characters, letters, digits or single hyphens,
 * and they cannot start or end with a hyphen.
 * Checking this before calling the API saves requests on obviously bad input.
 */
const USERNAME_PATTERN = /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i;

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(value);
}

/** Trims spaces and a leading "@" so "  @octocat " becomes "octocat". */
export function normalizeUsername(value: string): string {
  return value.trim().replace(/^@/, "");
}
