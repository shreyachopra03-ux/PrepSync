CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE kits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  version INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_kits_user_created ON kits(user_id, created_at DESC);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  kit_id TEXT,
  status TEXT NOT NULL,
  steps TEXT NOT NULL DEFAULT '[]',
  idempotency_key TEXT NOT NULL UNIQUE,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_runs_user ON runs(user_id);

CREATE TABLE practice (
  kit_id TEXT NOT NULL REFERENCES kits(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id),
  card_id TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence IN (1, 2, 3)),
  last_seen_at TEXT NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (kit_id, user_id, card_id)
);

CREATE TABLE rate_limits (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  expires_at INTEGER NOT NULL
);
