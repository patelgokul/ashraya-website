-- Alias becomes the player's identity; scores carry the event they belong to.
-- Runs in one transaction: any failure (e.g. two aliases that differ only by case) leaves the DB untouched.
-- No rows are deleted.
BEGIN;

UPDATE "GameParticipant" SET alias = lower(trim(alias));

ALTER TABLE "GameScore" ADD COLUMN alias TEXT, ADD COLUMN "eventId" TEXT;

UPDATE "GameScore" s
SET alias = p.alias,
    "eventId" = COALESCE(p."eventId", (SELECT id FROM "GameEvent" WHERE legacy ORDER BY "createdAt" LIMIT 1))
FROM "GameParticipant" p
WHERE p.id = s."participantId";

ALTER TABLE "GameScore"
  ALTER COLUMN alias SET NOT NULL,
  ALTER COLUMN "eventId" SET NOT NULL,
  DROP CONSTRAINT "GameScore_participantId_fkey",
  DROP COLUMN "participantId";

ALTER TABLE "GameParticipant"
  DROP CONSTRAINT "GameParticipant_eventId_fkey",
  DROP COLUMN "eventId",
  DROP COLUMN "tokenHash",
  DROP COLUMN id,
  ALTER COLUMN alias SET NOT NULL,
  ADD CONSTRAINT "GameParticipant_pkey" PRIMARY KEY (alias);

ALTER TABLE "GameScore"
  ADD CONSTRAINT "GameScore_alias_fkey" FOREIGN KEY (alias) REFERENCES "GameParticipant"(alias) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "GameScore_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "GameScore_alias_idx" ON "GameScore"(alias);
CREATE INDEX "GameScore_eventId_createdAt_idx" ON "GameScore"("eventId", "createdAt");

ALTER TABLE "GameEvent" DROP COLUMN legacy;

COMMIT;
