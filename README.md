# GitHub Profile Explorer

A pastel, game-styled explorer for GitHub: search any user, see a year of their activity, browse **all** of their repositories, compare two developers side by side, get an **AI analysis** of a profile, and keep **private notes** on users and repositories.

**Live demo:** https://github-explorer-lilac-one.vercel.app
**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · GitHub REST + GraphQL APIs · Vercel AI SDK with Google Gemini and Groq · Neon Postgres · deployed on Vercel

---

## Features

| Feature | Where | Notes |
|---|---|---|
| Search users | `/` | Username is validated before any API call |
| Profile + all repositories | `/users/[username]` | Avatar, bio, stats; **every** repo (follows pagination), filter by name/language, sort by stars/updated/name, "Show more" paging |
| Activity map | Profile page | A year of daily contributions as a pixel grid, with total, longest and current streak and busiest weekday. Streams in on its own (`<Suspense>`), so the rest of the profile never waits for it |
| Compare two users | `/compare?a=…&b=…` | Repos, stars, forks, followers, **commits and commit frequency (last 12 months)**, active weeks, languages; winner per row; weekly contributions chart with hover + keyboard support and a data table |
| AI profile analysis | Profile page | Streams a structured summary (Summary, Strengths, Notable projects, Activity) as it is written |
| Notes | Profile page, repo cards, `/notes`, home page | Notes on a user or on a specific repo; create / edit / delete; shown on the home page as soon as you open the app |

## How it works

### Server and client components working together
- **Pages are Server Components.** They fetch GitHub data on the server, so the GitHub token never reaches the browser and the HTML arrives already filled in.
- **Interactive parts are small Client Components:** the search and compare forms, repo filtering and sorting, the chart, the AI panel, and the note editors.
- **The URL is the state** (`/users/octocat`, `/compare?a=x&b=y`). Links can be shared and bookmarked, and the Back button works, without a client-side state library.
- **Notes use Server Actions** (`src/app/actions/notes.ts`): forms post straight to the server, the data is validated there, and the page re-renders with fresh data (`revalidatePath`).
- Loading skeletons (`loading.tsx`, `<Suspense>`), a not-found page and an error boundary with retry cover every state. The compare form stays usable while the results stream in.

### Performance and scale
- **Caching:** every GitHub response is cached by Next.js for 5 minutes (`next: { revalidate: 300 }`), so repeat visits and the AI route reuse the same data without new API calls.
- **All repositories, fetched efficiently:** the first page's `Link` header gives the page count. The remaining pages are fetched in parallel with a **concurrency limit of 5**, so a user with 1,000+ repos loads quickly without flooding the connection.
- **Commit frequency and the activity map from one GraphQL query** (`contributionsCollection`) instead of one REST call per repository. The profile and compare pages share the cached result.
- **Parallel requests:** the profile and repos load at the same time; comparing two users runs six requests at once.
- **Small payloads:** API responses are trimmed to the fields the UI uses before they're cached or sent to the browser. The repo list renders 30 cards at a time.
- **Resilience:** dropped connections are retried with back-off. A missing user, the rate limit (with the reset time) and GitHub being unreachable each have their own message.

### AI analysis (`/api/analyze`)
- The browser sends only a **username**. The server loads the data itself, so users can't inject their own text into the prompt.
- The model gets a **compact, pre-computed brief** (totals, recent vs. earlier activity, top repos) instead of raw JSON, which is cheaper, faster and more accurate. The prompt requires every point to cite real data.
- **Built not to fail**, in three layers:
  1. **Saved analyses:** each result is stored in Postgres and reused for 24 hours, so repeat visits are instant and use no AI quota. **Regenerate** asks for a new one.
  2. **Two providers with fallback:** Google Gemini and Groq (Llama) models, alternating. If a model is busy, out of quota, unavailable, errors mid-request or returns nothing *before writing anything*, the next one is tried (`src/lib/ai/stream-with-fallback.ts`).
  3. **Last resort:** if every model fails (or GitHub is down), the most recent saved analysis is shown instead of an error.
- The response is streamed, has an overall time limit, and retries are capped to protect free quotas.

### Notes
- Stored in **Postgres (Neon)**. Schema: [`db/schema.sql`](db/schema.sql).
- The app has no login, so each browser gets an **anonymous ID in an httpOnly cookie**. Notes are private to that browser and persist across visits. Every query filters by that ID, so one visitor can't read or change another's notes.
- All input is validated on the server (username, repo name, length), and queries are parameterized.

## Project structure

```
src/
  app/
    page.tsx                     search + recent notes
    users/[username]/            profile page, loading, not-found, error
    compare/                     compare page + streamed results
    notes/page.tsx               all notes
    api/analyze/route.ts         AI analysis (streaming)
    actions/notes.ts             Server Actions for notes
  components/                    UI (compare/, notes/, repo list, profile card, AI panel…)
  lib/
    github/                      API client, pagination, GraphQL, stats, errors, validation
    ai/                          prompt builder, streaming with model fallback
    notes/  db/                  queries, visitor cookie, database client
db/schema.sql                    database schema
scripts/setup-db.mjs             creates the tables
```

## Running locally

Requirements: Node.js 20+.

```bash
git clone https://github.com/MennahHemeda/github-explorer.git
cd github-explorer
npm install
cp .env.example .env.local     # then fill in the values below
npm run db:setup               # creates the database tables (safe to re-run)
npm run dev                    # http://localhost:3000
```

| Variable | Required | Where to get it |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub → Settings → Developer settings → Fine-grained token (public repositories, read-only). Raises the limit from 60 to 5,000 requests/hour and is required for GraphQL |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For AI | [Google AI Studio](https://aistudio.google.com) → Get API key |
| `GROQ_API_KEY` | Recommended | [Groq console](https://console.groq.com) → API Keys. Second AI provider, used when Gemini is busy |
| `DATABASE_URL` | For notes | Any Postgres. On Vercel: Storage → Neon |
| `GEMINI_MODEL` | No | A model to try first, before the built-in fallback list |

The app degrades gracefully: without a database, notes are disabled with a clear message; without an AI key, the AI panel explains it's not configured.

## Deploying to Vercel

1. Import the repository in Vercel. Next.js is detected automatically.
2. Add `GITHUB_TOKEN`, `GOOGLE_GENERATIVE_AI_API_KEY` and `GROQ_API_KEY` under **Settings → Environment Variables**.
3. **Storage → Create Database → Neon → Connect.** This sets `DATABASE_URL`.
4. Run `npm run db:setup` once with that `DATABASE_URL`, then deploy.

## Possible next steps

- Sign in with GitHub, so notes follow the user across devices.
- Tests: unit tests for `lib/github` (pagination, stats) and Playwright end-to-end tests for the main flows.
