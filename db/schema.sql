-- Notes a visitor writes about a GitHub user (repo_name IS NULL) or about one of their repositories.
CREATE TABLE IF NOT EXISTS notes (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  visitor_id   UUID        NOT NULL,
  github_login TEXT        NOT NULL,
  repo_name    TEXT,
  body         TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Every query filters by visitor, then by profile (and sorts by newest).
CREATE INDEX IF NOT EXISTS notes_visitor_login_idx ON notes (visitor_id, github_login, created_at DESC);
CREATE INDEX IF NOT EXISTS notes_visitor_recent_idx ON notes (visitor_id, updated_at DESC);

-- The latest AI analysis per GitHub user. Served for 24 hours (saves AI quota), and used
-- as a fallback when every AI model is unavailable.
CREATE TABLE IF NOT EXISTS ai_analyses (
  github_login TEXT        PRIMARY KEY,
  content      TEXT        NOT NULL,
  model        TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
