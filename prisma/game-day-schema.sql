-- CreateEnum
CREATE TYPE "RoundKind" AS ENUM ('SONG', 'RIDDLE', 'HUNT_LEVEL', 'SCRIBBLE', 'VERIFY', 'VOLUNTEER');

-- CreateEnum
CREATE TYPE "ScoreSource" AS ENUM ('AUTO', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "GameEvent" ADD COLUMN     "huntDeadlineAt" TIMESTAMP(3),
ADD COLUMN     "teamsLockedAt" TIMESTAMP(3),
ADD COLUMN     "verificationFormUrl" TEXT;

-- AlterTable
ALTER TABLE "GameParticipant" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "GameScore" ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "questionId" TEXT,
ADD COLUMN     "reason" TEXT,
ADD COLUMN     "refundForId" TEXT,
ADD COLUMN     "roundId" TEXT,
ADD COLUMN     "source" "ScoreSource" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "teamId" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "GameRegistration" (
    "eventId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameRegistration_pkey" PRIMARY KEY ("eventId","alias")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "captainAlias" TEXT NOT NULL,
    "finishedAt" TIMESTAMP(3),
    "finishPlace" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "eventId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "slot" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("eventId","alias")
);

-- CreateTable
CREATE TABLE "GameRound" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "kind" "RoundKind" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "maxPoints" INTEGER NOT NULL DEFAULT 1000,
    "graceSec" INTEGER NOT NULL DEFAULT 3,
    "halfLifeSec" INTEGER NOT NULL DEFAULT 20,
    "floorPct" INTEGER NOT NULL DEFAULT 30,
    "durationSec" INTEGER,
    "maxAttempts" INTEGER,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "requiresVerification" BOOLEAN NOT NULL DEFAULT false,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GameRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameQuestion" (
    "id" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "prompt" TEXT,
    "mediaUrl" TEXT,
    "acceptedAnswers" TEXT[],
    "matchThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    "maxPoints" INTEGER,
    "hints" JSONB NOT NULL DEFAULT '[]',
    "revealOnSolve" TEXT,

    CONSTRAINT "GameQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAttempt" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "teamId" TEXT,
    "answer" TEXT NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamLevelProgress" (
    "teamId" TEXT NOT NULL,
    "roundId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL,
    "solvedAt" TIMESTAMP(3),
    "highestHint" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TeamLevelProgress_pkey" PRIMARY KEY ("teamId","roundId")
);

-- CreateTable
CREATE TABLE "ScoreVerification" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "screenshotKey" TEXT,
    "note" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'SUBMITTED',
    "rejectReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScoreVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VolunteerPledge" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "alias" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "mode" TEXT NOT NULL,
    "city" TEXT,
    "availability" TEXT NOT NULL,
    "hoursPerMonth" TEXT NOT NULL,
    "interests" TEXT[],
    "other" TEXT,
    "consent" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VolunteerPledge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameAudit" (
    "id" TEXT NOT NULL,
    "eventId" TEXT,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "detail" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GameAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePinAttempt" (
    "alias" TEXT NOT NULL,
    "failures" INTEGER NOT NULL DEFAULT 0,
    "windowAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePinAttempt_pkey" PRIMARY KEY ("alias")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_eventId_name_key" ON "Team"("eventId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_slot_key" ON "TeamMember"("teamId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "GameRound_eventId_order_key" ON "GameRound"("eventId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "GameQuestion_roundId_order_key" ON "GameQuestion"("roundId", "order");

-- CreateIndex
CREATE INDEX "GameAttempt_questionId_alias_idx" ON "GameAttempt"("questionId", "alias");

-- CreateIndex
CREATE INDEX "GameAttempt_questionId_teamId_idx" ON "GameAttempt"("questionId", "teamId");

-- CreateIndex
CREATE INDEX "GameAttempt_alias_createdAt_idx" ON "GameAttempt"("alias", "createdAt");

-- CreateIndex
CREATE INDEX "GameAttempt_teamId_createdAt_idx" ON "GameAttempt"("teamId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScoreVerification_eventId_alias_key" ON "ScoreVerification"("eventId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "VolunteerPledge_eventId_alias_key" ON "VolunteerPledge"("eventId", "alias");

-- CreateIndex
CREATE INDEX "GameAudit_eventId_createdAt_idx" ON "GameAudit"("eventId", "createdAt");

-- CreateIndex
CREATE INDEX "GameScore_refundForId_idx" ON "GameScore"("refundForId");

-- CreateIndex
CREATE UNIQUE INDEX "GameScore_questionId_alias_key" ON "GameScore"("questionId", "alias");

-- CreateIndex
CREATE UNIQUE INDEX "GameScore_roundId_teamId_key" ON "GameScore"("roundId", "teamId");

-- AddForeignKey
ALTER TABLE "GameScore" ADD CONSTRAINT "GameScore_refundForId_fkey" FOREIGN KEY ("refundForId") REFERENCES "GameScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRegistration" ADD CONSTRAINT "GameRegistration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRegistration" ADD CONSTRAINT "GameRegistration_alias_fkey" FOREIGN KEY ("alias") REFERENCES "GameParticipant"("alias") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_alias_fkey" FOREIGN KEY ("alias") REFERENCES "GameParticipant"("alias") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameRound" ADD CONSTRAINT "GameRound_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "GameEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameQuestion" ADD CONSTRAINT "GameQuestion_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameAttempt" ADD CONSTRAINT "GameAttempt_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "GameQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLevelProgress" ADD CONSTRAINT "TeamLevelProgress_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamLevelProgress" ADD CONSTRAINT "TeamLevelProgress_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "GameRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;
