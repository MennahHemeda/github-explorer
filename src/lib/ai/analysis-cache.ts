import { db, isDatabaseConfigured } from "@/lib/db/client";

/** A saved analysis is served as-is for this long, so repeat visits cost no AI quota. */
export const ANALYSIS_FRESH_FOR_MS = 24 * 60 * 60 * 1000;

export interface SavedAnalysis {
  content: string;
  model: string;
  createdAt: Date;
}

/**
 * The last AI analysis saved for a user, or null. Never throws: the cache must not be
 * the reason an analysis fails.
 */
export async function getSavedAnalysis(login: string): Promise<SavedAnalysis | null> {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await db()`
      SELECT content, model, created_at FROM ai_analyses WHERE github_login = ${login.toLowerCase()}
    `;
    const row = rows[0];
    return row ? { content: row.content, model: row.model, createdAt: new Date(row.created_at) } : null;
  } catch (error) {
    console.error("Could not read saved analysis:", error);
    return null;
  }
}

export function isFresh(analysis: SavedAnalysis): boolean {
  return Date.now() - analysis.createdAt.getTime() < ANALYSIS_FRESH_FOR_MS;
}

/** Saves (or replaces) the analysis for a user. Never throws. */
export async function saveAnalysis(login: string, content: string, model: string): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    await db()`
      INSERT INTO ai_analyses (github_login, content, model)
      VALUES (${login.toLowerCase()}, ${content}, ${model})
      ON CONFLICT (github_login)
      DO UPDATE SET content = EXCLUDED.content, model = EXCLUDED.model, created_at = now()
    `;
  } catch (error) {
    console.error("Could not save analysis:", error);
  }
}
