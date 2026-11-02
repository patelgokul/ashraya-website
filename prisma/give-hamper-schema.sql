-- Additive only: creates the Give Hamper table and leaves every existing table untouched.
-- Safe to run more than once.
CREATE TABLE IF NOT EXISTS "GiveHamper" (
    "alias" TEXT NOT NULL,
    "officeLocation" TEXT NOT NULL,
    "hoursTracked" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "treasureHuntAt" TIMESTAMP(3),

    CONSTRAINT "GiveHamper_pkey" PRIMARY KEY ("alias"),
    CONSTRAINT "GiveHamper_alias_fkey" FOREIGN KEY ("alias") REFERENCES "GameParticipant"("alias") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "GiveHamper" ADD COLUMN IF NOT EXISTS "treasureHuntAt" TIMESTAMP(3);

-- The office now belongs to the participant. "GiveHamper"."officeLocation" stays (nullable) until
-- every deployed Worker reads the participant column, because older Workers still write it.
ALTER TABLE "GameParticipant" ADD COLUMN IF NOT EXISTS "officeLocation" TEXT;
UPDATE "GameParticipant" AS participant SET "officeLocation" = hamper."officeLocation"
FROM "GiveHamper" AS hamper
WHERE hamper.alias = participant.alias AND participant."officeLocation" IS NULL AND hamper."officeLocation" IS NOT NULL;
ALTER TABLE "GiveHamper" ALTER COLUMN "officeLocation" DROP NOT NULL;
