CREATE TABLE IF NOT EXISTS "quiz_session" (
  "id"                   SERIAL PRIMARY KEY,
  "userId"               INTEGER NOT NULL,
  "username"             TEXT NOT NULL,
  "completedAt"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "answersAgriculteurs"  JSONB NOT NULL DEFAULT '[]',
  "answersIndustriels"   JSONB NOT NULL DEFAULT '[]',
  "answersHabitants"     JSONB NOT NULL DEFAULT '[]',
  "answersElus"          JSONB NOT NULL DEFAULT '[]',
  "summaryAgriculteurs"  TEXT NOT NULL DEFAULT '',
  "summaryIndustriels"   TEXT NOT NULL DEFAULT '',
  "summaryHabitants"     TEXT NOT NULL DEFAULT '',
  "summaryElus"          TEXT NOT NULL DEFAULT '',
  CONSTRAINT "quiz_session_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "user_ecovillage"("id") ON DELETE CASCADE
);
