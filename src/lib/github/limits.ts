/**
 * Upper limit on repositories loaded for one account (100 per page × 30 pages).
 * Only a handful of accounts exceed it; without a cap, one of them could use up
 * the whole hourly API quota. The UI says so when the limit is reached.
 *
 * Kept in its own file so client components can import it without pulling in server code.
 */
export const MAX_REPOS = 3000;
export const REPOS_PER_PAGE = 100;
