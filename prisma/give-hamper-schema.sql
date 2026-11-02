-- Creates the Give Hamper table and moves the office location onto the participant.
-- Safe to run more than once.
CREATE TABLE IF NOT EXISTS "GiveHamper" (
    "alias" TEXT NOT NULL,
    "hoursTracked" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "treasureHuntAt" TIMESTAMP(3),

    CONSTRAINT "GiveHamper_pkey" PRIMARY KEY ("alias"),
    CONSTRAINT "GiveHamper_alias_fkey" FOREIGN KEY ("alias") REFERENCES "GameParticipant"("alias") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "GiveHamper" ADD COLUMN IF NOT EXISTS "treasureHuntAt" TIMESTAMP(3);

-- Workers deployed before the office moved to the participant still write "GiveHamper"."officeLocation",
-- so deploy the new Worker right after running this.
ALTER TABLE "GameParticipant" ADD COLUMN IF NOT EXISTS "officeLocation" TEXT;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'GiveHamper' AND column_name = 'officeLocation') THEN
    UPDATE "GameParticipant" AS participant SET "officeLocation" = hamper."officeLocation"
    FROM "GiveHamper" AS hamper
    WHERE hamper.alias = participant.alias AND participant."officeLocation" IS NULL AND hamper."officeLocation" IS NOT NULL;
    ALTER TABLE "GiveHamper" DROP COLUMN "officeLocation";
  END IF;
END $$;
