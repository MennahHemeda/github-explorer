import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("DATABASE_URL is not set.");
    this.name = "DatabaseNotConfiguredError";
  }
}

let client: NeonQueryFunction<false, false> | null = null;

/**
 * Neon's HTTP driver: every query is one HTTPS request, with no connection pool to manage,
 * which suits serverless functions on Vercel. Created lazily so the app still starts without a database.
 */
export function db(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  client ??= neon(url);
  return client;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
