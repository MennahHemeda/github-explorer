import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

/**
 * The app has no login, so each browser gets an anonymous, random ID in an httpOnly cookie.
 * Notes belong to that ID: they persist across visits, and other visitors can't see or edit them.
 */
const COOKIE_NAME = "visitor_id";
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The current visitor's ID, or null if this browser hasn't saved anything yet. */
export async function getVisitorId(): Promise<string | null> {
  const value = (await cookies()).get(COOKIE_NAME)?.value;
  return value && UUID_PATTERN.test(value) ? value : null;
}

/** Returns the visitor ID, creating the cookie on first use. Only callable from Server Actions. */
export async function getOrCreateVisitorId(): Promise<string> {
  const existing = await getVisitorId();
  if (existing) return existing;

  const id = randomUUID();
  (await cookies()).set(COOKIE_NAME, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: ONE_YEAR_SECONDS,
    path: "/",
  });
  return id;
}
