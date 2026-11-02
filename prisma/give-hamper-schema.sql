-- Creates the Give Hamper table (one row per player per India-time day) and moves the office
-- location onto the participant. Safe to run more than once, including on the older one-row table.
CREATE TABLE IF NOT EXISTS "GiveHamper" (
    "id" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "hamperDate" DATE NOT NULL,
    "hoursTracked" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "remark" VARCHAR(500),
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    "treasureHuntAt" TIMESTAMP(3),

    CONSTRAINT "GiveHamper_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GiveHamper_alias_hamperDate_key" UNIQUE ("alias", "hamperDate"),
    CONSTRAINT "GiveHamper_alias_fkey" FOREIGN KEY ("alias") REFERENCES "GameParticipant"("alias") ON DELETE CASCADE ON UPDATE CASCADE
);

ALTER TABLE "GiveHamper" ADD COLUMN IF NOT EXISTS "treasureHuntAt" TIMESTAMP(3);
ALTER TABLE "GiveHamper" ADD COLUMN IF NOT EXISTS "remark" VARCHAR(500);

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

-- Turn the original one-row-per-player table into one row per player per day.
ALTER TABLE "GiveHamper" ADD COLUMN IF NOT EXISTS "id" TEXT;
ALTER TABLE "GiveHamper" ADD COLUMN IF NOT EXISTS "hamperDate" DATE;
UPDATE "GiveHamper"
SET "hamperDate" = (("acceptedAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Asia/Kolkata')::date
WHERE "hamperDate" IS NULL;
UPDATE "GiveHamper" SET "id" = gen_random_uuid()::text WHERE "id" IS NULL;

DO $$
DECLARE definition text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO definition FROM pg_constraint WHERE conname = 'GiveHamper_pkey';
  IF definition = 'PRIMARY KEY (alias)' THEN
    ALTER TABLE "GiveHamper" DROP CONSTRAINT "GiveHamper_pkey";
    ALTER TABLE "GiveHamper" ALTER COLUMN "id" SET NOT NULL;
    ALTER TABLE "GiveHamper" ALTER COLUMN "hamperDate" SET NOT NULL;
    ALTER TABLE "GiveHamper" ADD CONSTRAINT "GiveHamper_pkey" PRIMARY KEY ("id");
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "GiveHamper_alias_hamperDate_key" ON "GiveHamper" ("alias", "hamperDate");
