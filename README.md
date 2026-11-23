# GitHub Profile Explorer

Search any GitHub user, browse **all** of their repositories, compare two developers side by side, get an **AI analysis** of a profile, and keep **private notes** on users and repositories.

**Live demo:** _add your Vercel link here_
**Stack:** Next.js 16 (App Router) · TypeScript (strict) · Tailwind CSS 4 · GitHub REST + GraphQL APIs · Vercel AI SDK + Google Gemini · Neon Postgres · deployed on Vercel

---

## Features

| Feature | Where | Notes |
|---|---|---|
| Search users | `/` | Username is validated before any API call |
| Profile + all repositories | `/users/[username]` | Avatar, bio, stats; **every** repo (follows pagination), filter by name/language, sort by stars/updated/name, "Show more" paging |
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
- **Commit frequency from one GraphQL query** (`contributionsCollection`) instead of one REST call per repository.
- **Parallel requests:** the profile and repos load at the same time; comparing two users runs six requests at once.
- **Small payloads:** API responses are trimmed to the fields the UI uses before they're cached or sent to the browser. The repo list renders 30 cards at a time.
- **Resilience:** dropped connections are retried with back-off. A missing user, the rate limit (with the reset time) and GitHub being unreachable each have their own message.

### AI analysis (`/api/analyze`)
- The browser sends only a **username**. The server loads the data itself, so users can't inject their own text into the prompt.
- The model gets a **compact, pre-computed brief** (totals, recent vs. earlier activity, top repos) instead of raw JSON, which is cheaper, faster and more accurate. The prompt requires every point to cite real data.
- **Model fallback:** if a Gemini model is busy, out of quota, unavailable, or finishes without text *before writing anything*, the next model is tried. Each model has its own free quota.
- The response is streamed, has a time limit, retries are capped to protect the quota, and errors are explained to the user.

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
npm run db:setup               # creates the notes table (safe to re-run)
npm run dev                    # http://localhost:3000
```

| Variable | Required | Where to get it |
|---|---|---|
| `GITHUB_TOKEN` | Yes | GitHub → Settings → Developer settings → Fine-grained token (public repositories, read-only). Raises the limit from 60 to 5,000 requests/hour and is required for GraphQL |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For AI | [Google AI Studio](https://aistudio.google.com) → Get API key |
| `DATABASE_URL` | For notes | Any Postgres. On Vercel: Storage → Neon |
| `GEMINI_MODEL` | No | A model to try first, before the built-in fallback list |

The app degrades gracefully: without a database, notes are disabled with a clear message; without an AI key, the AI panel explains it's not configured.

## Deploying to Vercel

1. Import the repository in Vercel. Next.js is detected automatically.
2. Add `GITHUB_TOKEN` and `GOOGLE_GENERATIVE_AI_API_KEY` under **Settings → Environment Variables**.
3. **Storage → Create Database → Neon → Connect.** This sets `DATABASE_URL`.
4. Run `npm run db:setup` once with that `DATABASE_URL`, then deploy.

## Possible next steps

- Cache AI analyses in the database, so each profile is analyzed once per day.
- Sign in with GitHub, so notes follow the user across devices.
- Tests: unit tests for `lib/github` (pagination, stats) and Playwright end-to-end tests for the main flows.
