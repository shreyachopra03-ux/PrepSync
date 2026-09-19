DROP TABLE IF EXISTS practice;
DROP TABLE IF EXISTS runs;
DROP TABLE IF EXISTS kits;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS rate_limits;

CREATE TABLE "user" (
  "id" text NOT NULL PRIMARY KEY,
  "name" text NOT NULL,
  "email" text NOT NULL UNIQUE,
  "emailVerified" integer NOT NULL,
  "image" text,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL
);

CREATE TABLE "session" (
  "id" text NOT NULL PRIMARY KEY,
  "expiresAt" date NOT NULL,
  "token" text NOT NULL UNIQUE,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL,
  "ipAddress" text,
  "userAgent" text,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE
);

CREATE TABLE "account" (
  "id" text NOT NULL PRIMARY KEY,
  "accountId" text NOT NULL,
  "providerId" text NOT NULL,
  "userId" text NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" date,
  "refreshTokenExpiresAt" date,
  "scope" text,
  "password" text,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL
);

CREATE TABLE "verification" (
  "id" text NOT NULL PRIMARY KEY,
  "identifier" text NOT NULL,
  "value" text NOT NULL,
  "expiresAt" date NOT NULL,
  "createdAt" date NOT NULL,
  "updatedAt" date NOT NULL
);

CREATE TABLE "rateLimit" (
  "id" text NOT NULL PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "count" integer NOT NULL,
  "lastRequest" bigint NOT NULL
);

CREATE INDEX "session_userId_idx" ON "session" ("userId");
CREATE INDEX "account_userId_idx" ON "account" ("userId");
CREATE INDEX "verification_identifier_idx" ON "verification" ("identifier");

CREATE TABLE kits (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_kits_user_created ON kits(user_id, created_at DESC);

CREATE TABLE runs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
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
  user_id TEXT NOT NULL REFERENCES "user" ("id") ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence IN (1, 2, 3)),
  last_seen_at TEXT NOT NULL,
  times_seen INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (kit_id, user_id, card_id)
);
