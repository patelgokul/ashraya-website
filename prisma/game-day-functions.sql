ALTER TABLE "TeamMember" DROP CONSTRAINT IF EXISTS game_team_slot;
ALTER TABLE "TeamMember" ADD CONSTRAINT game_team_slot CHECK (slot BETWEEN 1 AND 5);
CREATE UNIQUE INDEX IF NOT EXISTS game_team_name_ci ON "Team" ("eventId", lower(name));

CREATE OR REPLACE FUNCTION game_day_command(event_id text, actor text, command text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  event_row "GameEvent"%ROWTYPE;
  round_row "GameRound"%ROWTYPE;
  question_row "GameQuestion"%ROWTYPE;
  team_row "Team"%ROWTYPE;
  progress_row "TeamLevelProgress"%ROWTYPE;
  score_row "GameScore"%ROWTYPE;
  now_at timestamp;
  target_alias text := coalesce(payload->>'alias', actor);
  target_team text := payload->>'teamId';
  old_team text;
  next_round text;
  free_slot integer;
  attempt_count integer;
  hint_number integer;
  penalty numeric := 0;
  points_value integer := 0;
  bonus integer := 0;
  finish_place integer;
  elapsed numeric;
  started_at timestamp;
  admin_command boolean := command LIKE 'admin.%';
  member_row record;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(event_id, 0));
  now_at := clock_timestamp() AT TIME ZONE 'UTC';
  SELECT * INTO event_row FROM "GameEvent" WHERE id = event_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Event not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "GameParticipant" WHERE alias = actor) THEN RAISE EXCEPTION 'Sign in first'; END IF;
  IF admin_command AND NOT EXISTS (SELECT 1 FROM "GameParticipant" WHERE alias = actor AND "isAdmin") THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF admin_command THEN
    INSERT INTO "GameAudit" (id, "eventId", actor, action, detail) VALUES (gen_random_uuid()::text, event_id, actor, command, payload);
  END IF;

  IF command IN ('team.create', 'team.join', 'team.leave', 'admin.team.create', 'admin.team.move', 'admin.team.disband', 'admin.team.rename', 'admin.team.auto', 'admin.team.lock') THEN
    IF NOT admin_command AND event_row."teamsLockedAt" IS NOT NULL THEN RAISE EXCEPTION 'Teams are locked by the host'; END IF;
    IF command = 'team.leave' AND event_row."huntDeadlineAt" IS NOT NULL THEN RAISE EXCEPTION 'The hunt has started. Ask the host to move you to another team.'; END IF;
    IF command = 'admin.team.lock' THEN
      UPDATE "GameEvent" SET "teamsLockedAt" = CASE WHEN (payload->>'locked')::boolean THEN now_at ELSE NULL END WHERE id = event_id;
      RETURN '{"ok":true}';
    END IF;
    IF command = 'admin.team.auto' THEN
      FOR member_row IN SELECT registration.alias FROM "GameRegistration" registration
        WHERE registration."eventId" = event_id AND NOT EXISTS (SELECT 1 FROM "TeamMember" member WHERE member."eventId" = event_id AND member.alias = registration.alias) ORDER BY random()
      LOOP
        SELECT team.id INTO target_team FROM "Team" team WHERE team."eventId" = event_id
          AND (SELECT count(*) FROM "TeamMember" WHERE "teamId" = team.id) < 5 ORDER BY team."createdAt" LIMIT 1;
        IF target_team IS NULL THEN
          target_team := gen_random_uuid()::text;
          INSERT INTO "Team" (id, "eventId", name, "captainAlias") VALUES (target_team, event_id, 'Team ' || left(target_team, 8), member_row.alias);
          INSERT INTO "TeamLevelProgress" ("teamId", "roundId", "unlockedAt") SELECT target_team, id, now_at FROM "GameRound" WHERE "eventId" = event_id AND kind = 'HUNT_LEVEL' AND "openedAt" IS NOT NULL ORDER BY "order" LIMIT 1;
        END IF;
        SELECT candidate INTO free_slot FROM generate_series(1,5) candidate WHERE NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = target_team AND slot = candidate) LIMIT 1;
        INSERT INTO "TeamMember" ("eventId", alias, "teamId", slot) VALUES (event_id, member_row.alias, target_team, free_slot);
      END LOOP;
      RETURN '{"ok":true}';
    END IF;
    IF command IN ('team.create', 'admin.team.create') THEN
      IF NOT admin_command THEN target_alias := actor; END IF;
      IF EXISTS (SELECT 1 FROM "TeamMember" WHERE "eventId" = event_id AND alias = target_alias) THEN RAISE EXCEPTION 'Player already has a team'; END IF;
      IF NOT EXISTS (SELECT 1 FROM "GameRegistration" WHERE "eventId" = event_id AND alias = target_alias) THEN RAISE EXCEPTION 'Player must join this event first'; END IF;
      target_team := gen_random_uuid()::text;
      INSERT INTO "Team" (id, "eventId", name, "captainAlias") VALUES (target_team, event_id, trim(payload->>'name'), target_alias);
      INSERT INTO "TeamMember" ("eventId", alias, "teamId", slot) VALUES (event_id, target_alias, target_team, 1);
      INSERT INTO "TeamLevelProgress" ("teamId", "roundId", "unlockedAt") SELECT target_team, id, now_at FROM "GameRound" WHERE "eventId" = event_id AND kind = 'HUNT_LEVEL' AND "openedAt" IS NOT NULL ORDER BY "order" LIMIT 1;
      RETURN jsonb_build_object('ok', true, 'teamId', target_team);
    END IF;
    SELECT * INTO team_row FROM "Team" WHERE id = target_team AND "eventId" = event_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Team not found'; END IF;
    IF command = 'admin.team.rename' THEN
      UPDATE "Team" SET name = trim(payload->>'name') WHERE id = target_team;
    ELSIF command = 'admin.team.disband' THEN
      UPDATE "GameScore" SET "voidedAt" = now_at WHERE "teamId" = target_team;
      DELETE FROM "Team" WHERE id = target_team;
    ELSIF command IN ('team.join', 'admin.team.move') THEN
      IF NOT admin_command AND target_alias <> actor AND team_row."captainAlias" <> actor THEN RAISE EXCEPTION 'Only the captain can add other players'; END IF;
      IF NOT EXISTS (SELECT 1 FROM "GameRegistration" WHERE "eventId" = event_id AND alias = target_alias) THEN RAISE EXCEPTION 'Player must join this event first'; END IF;
      SELECT "teamId" INTO old_team FROM "TeamMember" WHERE "eventId" = event_id AND alias = target_alias;
      IF old_team IS NOT NULL AND NOT admin_command THEN RAISE EXCEPTION 'Player already has a team'; END IF;
      IF old_team = target_team THEN RETURN '{"ok":true}'; END IF;
      SELECT candidate INTO free_slot FROM generate_series(1,5) candidate WHERE NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = target_team AND slot = candidate) LIMIT 1;
      IF free_slot IS NULL THEN RAISE EXCEPTION 'This team is full'; END IF;
      DELETE FROM "TeamMember" WHERE "eventId" = event_id AND alias = target_alias;
      INSERT INTO "TeamMember" ("eventId", alias, "teamId", slot) VALUES (event_id, target_alias, target_team, free_slot);
    ELSIF command = 'team.leave' THEN
      IF target_alias <> actor AND team_row."captainAlias" <> actor THEN RAISE EXCEPTION 'Only the captain can remove other players'; END IF;
      DELETE FROM "TeamMember" WHERE "teamId" = target_team AND alias = target_alias;
      old_team := target_team;
    END IF;
    IF old_team IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = old_team) THEN
        UPDATE "GameScore" SET "voidedAt" = now_at WHERE "teamId" = old_team;
        DELETE FROM "Team" WHERE id = old_team;
      ELSE
        UPDATE "Team" SET "captainAlias" = (SELECT alias FROM "TeamMember" WHERE "teamId" = old_team ORDER BY "joinedAt", alias LIMIT 1)
          WHERE id = old_team AND NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = old_team AND alias = "Team"."captainAlias");
      END IF;
    END IF;
    RETURN '{"ok":true}';
  END IF;

  IF command IN ('admin.round.open', 'admin.round.close', 'admin.round.extend') THEN
    SELECT * INTO round_row FROM "GameRound" WHERE id = payload->>'roundId' AND "eventId" = event_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Round not found'; END IF;
    IF command = 'admin.round.close' THEN
      UPDATE "GameRound" SET "closedAt" = now_at WHERE id = round_row.id;
    ELSIF command = 'admin.round.extend' THEN
      IF round_row."openedAt" IS NULL THEN RAISE EXCEPTION 'Open the round first'; END IF;
      IF round_row.kind = 'HUNT_LEVEL' THEN
        UPDATE "GameEvent" SET "huntDeadlineAt" = greatest("huntDeadlineAt", now_at) + make_interval(secs => (payload->>'seconds')::integer) WHERE id = event_id;
      ELSE
        UPDATE "GameRound" SET "closedAt" = greatest("closedAt", now_at) + make_interval(secs => (payload->>'seconds')::integer) WHERE id = round_row.id;
      END IF;
    ELSIF round_row.kind = 'HUNT_LEVEL' THEN
      IF event_row."huntDeadlineAt" IS NULL THEN
        IF round_row."order" <> (SELECT min("order") FROM "GameRound" WHERE "eventId" = event_id AND kind = 'HUNT_LEVEL') THEN RAISE EXCEPTION 'Open Hunt Level 1 first'; END IF;
        UPDATE "GameEvent" SET "huntDeadlineAt" = now_at + interval '45 minutes' WHERE id = event_id;
        UPDATE "GameRound" SET "openedAt" = now_at, "closedAt" = NULL WHERE "eventId" = event_id AND kind = 'HUNT_LEVEL';
        INSERT INTO "TeamLevelProgress" ("teamId", "roundId", "unlockedAt") SELECT id, round_row.id, now_at FROM "Team" WHERE "eventId" = event_id ON CONFLICT DO NOTHING;
      ELSE
        UPDATE "GameRound" SET "closedAt" = NULL WHERE id = round_row.id;
      END IF;
    ELSE
      IF round_row.kind IN ('SONG', 'RIDDLE', 'SCRIBBLE') THEN
        UPDATE "GameRound" SET "closedAt" = now_at WHERE "eventId" = event_id AND kind IN ('SONG', 'RIDDLE', 'SCRIBBLE') AND "openedAt" IS NOT NULL AND "closedAt" > now_at;
      END IF;
      UPDATE "GameRound" SET "openedAt" = now_at, "closedAt" = CASE WHEN "durationSec" IS NULL THEN NULL ELSE now_at + make_interval(secs => "durationSec") END WHERE id = round_row.id;
    END IF;
    RETURN '{"ok":true}';
  END IF;

  IF command IN ('admin.score.award', 'admin.score.void', 'admin.score.adjust') THEN
    IF command <> 'admin.score.award' THEN
      SELECT * INTO score_row FROM "GameScore" WHERE id = payload->>'scoreId' AND "eventId" = event_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Score not found'; END IF;
      IF command = 'admin.score.void' THEN
        UPDATE "GameScore" SET "voidedAt" = now_at WHERE id = score_row.id;
        RETURN '{"ok":true}';
      END IF;
      target_alias := score_row.alias;
      target_team := score_row."teamId";
    END IF;
    IF target_team IS NOT NULL THEN
      SELECT "captainAlias" INTO target_alias FROM "Team" WHERE id = target_team AND "eventId" = event_id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Team not found'; END IF;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM "GameRegistration" WHERE "eventId" = event_id AND alias = target_alias) THEN RAISE EXCEPTION 'Player not registered in event'; END IF;
    INSERT INTO "GameScore" (id, alias, "eventId", game, points, "teamId", source, reason, "createdBy")
      VALUES (gen_random_uuid()::text, target_alias, event_id, 'Admin adjustment', (payload->>'points')::integer, target_team, 'ADMIN', payload->>'reason', actor);
    RETURN '{"ok":true}';
  END IF;

  IF command = 'admin.verification' THEN
    IF NOT EXISTS (SELECT 1 FROM "GameRegistration" WHERE "eventId" = event_id AND alias = target_alias) THEN RAISE EXCEPTION 'Player not registered in event'; END IF;
    INSERT INTO "ScoreVerification" (id, "eventId", alias, hours, status, "rejectReason", "reviewedBy", "reviewedAt")
      VALUES (gen_random_uuid()::text, event_id, target_alias, coalesce((payload->>'hours')::numeric, 1), (payload->>'status')::"VerificationStatus", payload->>'reason', actor, now_at)
      ON CONFLICT ("eventId", alias) DO UPDATE SET status = EXCLUDED.status, "rejectReason" = EXCLUDED."rejectReason", "reviewedBy" = actor, "reviewedAt" = now_at;
    RETURN '{"ok":true}';
  END IF;
  IF command IN ('answer', 'hint', 'admin.hunt.solve', 'admin.hunt.reset', 'admin.hunt.refund') THEN
    IF command = 'answer' THEN
      SELECT * INTO question_row FROM "GameQuestion" WHERE id = payload->>'questionId';
      SELECT * INTO round_row FROM "GameRound" WHERE id = question_row."roundId" AND "eventId" = event_id;
    ELSE
      SELECT * INTO round_row FROM "GameRound" WHERE id = payload->>'roundId' AND "eventId" = event_id;
      SELECT * INTO question_row FROM "GameQuestion" WHERE "roundId" = round_row.id ORDER BY "order" LIMIT 1;
    END IF;
    IF round_row.id IS NULL OR question_row.id IS NULL THEN RAISE EXCEPTION 'Question not found'; END IF;
    IF NOT admin_command THEN
      IF round_row."openedAt" IS NULL THEN RAISE EXCEPTION 'This round has not opened'; END IF;
      IF round_row."closedAt" <= now_at THEN RAISE EXCEPTION 'This round is closed'; END IF;
      IF round_row.kind = 'HUNT_LEVEL' AND event_row."huntDeadlineAt" <= now_at THEN RAISE EXCEPTION 'The hunt deadline has passed'; END IF;
      IF round_row."requiresVerification" AND NOT EXISTS (SELECT 1 FROM "ScoreVerification" WHERE "eventId" = event_id AND alias = actor AND status IN ('SUBMITTED', 'APPROVED')) THEN RAISE EXCEPTION 'Log your Benevity hours and submit verification to unlock this level'; END IF;
    END IF;
    IF round_row.kind = 'HUNT_LEVEL' THEN
      IF NOT admin_command THEN SELECT "teamId" INTO target_team FROM "TeamMember" WHERE "eventId" = event_id AND alias = actor; END IF;
      IF NOT EXISTS (SELECT 1 FROM "Team" WHERE id = target_team AND "eventId" = event_id) THEN RAISE EXCEPTION 'Join a team first'; END IF;
      SELECT * INTO progress_row FROM "TeamLevelProgress" WHERE "teamId" = target_team AND "roundId" = round_row.id;
      IF NOT FOUND THEN RAISE EXCEPTION 'Solve the previous level first'; END IF;
      started_at := progress_row."unlockedAt";
      IF command = 'admin.hunt.reset' THEN
        DELETE FROM "GameScore" WHERE "teamId" = target_team AND ("roundId" IN (SELECT id FROM "GameRound" WHERE "eventId" = event_id AND "order" >= round_row."order" AND kind = 'HUNT_LEVEL') OR game = 'Hunt finish bonus');
        DELETE FROM "GameAttempt" WHERE "teamId" = target_team AND "questionId" IN (SELECT question.id FROM "GameQuestion" question JOIN "GameRound" round ON round.id = question."roundId" WHERE round."eventId" = event_id AND round."order" >= round_row."order");
        DELETE FROM "TeamLevelProgress" WHERE "teamId" = target_team AND "roundId" IN (SELECT id FROM "GameRound" WHERE "eventId" = event_id AND "order" > round_row."order");
        UPDATE "TeamLevelProgress" SET "unlockedAt" = now_at, "solvedAt" = NULL, "highestHint" = 0 WHERE "teamId" = target_team AND "roundId" = round_row.id;
        UPDATE "Team" SET "finishedAt" = NULL, "finishPlace" = NULL WHERE id = target_team;
        RETURN '{"ok":true}';
      END IF;
      IF command = 'admin.hunt.refund' THEN
        IF progress_row."solvedAt" IS NOT NULL THEN
          SELECT * INTO score_row FROM "GameScore" WHERE "teamId" = target_team AND "roundId" = round_row.id;
          elapsed := greatest(0, extract(epoch FROM progress_row."solvedAt" - started_at) - round_row."graceSec");
          points_value := round(round_row."maxPoints" * (round_row."floorPct"::numeric / 100 + (1 - round_row."floorPct"::numeric / 100) * power(0.5::numeric, elapsed / round_row."halfLifeSec")));
          IF progress_row."highestHint" > 0 AND score_row."voidedAt" IS NULL THEN
            INSERT INTO "GameScore" (id, alias, "eventId", game, points, "teamId", source, reason, "createdBy", "refundForId") VALUES (gen_random_uuid()::text, actor, event_id, 'Hint refund', points_value - score_row.points, target_team, 'ADMIN', payload->>'reason', actor, score_row.id);
          END IF;
        END IF;
        UPDATE "TeamLevelProgress" SET "highestHint" = 0 WHERE "teamId" = target_team AND "roundId" = round_row.id;
        RETURN '{"ok":true}';
      END IF;
      IF progress_row."solvedAt" IS NOT NULL THEN
        SELECT * INTO score_row FROM "GameScore" WHERE "roundId" = round_row.id AND "teamId" = target_team;
        RETURN jsonb_build_object('correct', true, 'alreadySolved', true, 'points', CASE WHEN score_row."voidedAt" IS NULL THEN coalesce(score_row.points, 0) ELSE 0 END);
      END IF;
      IF command = 'hint' THEN
        hint_number := (payload->>'hint')::integer;
        IF hint_number < 1 OR hint_number > jsonb_array_length(question_row.hints) OR hint_number > progress_row."highestHint" + 1 THEN RAISE EXCEPTION 'Open hints in order'; END IF;
        UPDATE "TeamLevelProgress" SET "highestHint" = greatest("highestHint", hint_number) WHERE "teamId" = target_team AND "roundId" = round_row.id;
        RETURN jsonb_build_object('hint', question_row.hints->(hint_number - 1));
      END IF;
      IF progress_row."highestHint" > 0 THEN penalty := (question_row.hints->(progress_row."highestHint" - 1)->>'penaltyPct')::numeric; END IF;
    ELSE
      IF command <> 'answer' OR round_row.kind NOT IN ('SONG', 'RIDDLE', 'SCRIBBLE') THEN RAISE EXCEPTION 'This action is not available'; END IF;
      target_team := NULL;
      started_at := round_row."openedAt";
      SELECT * INTO score_row FROM "GameScore" WHERE "questionId" = question_row.id AND alias = actor;
      IF FOUND THEN RETURN jsonb_build_object('correct', true, 'alreadySolved', true, 'points', CASE WHEN score_row."voidedAt" IS NULL THEN score_row.points ELSE 0 END); END IF;
    END IF;
    IF NOT admin_command THEN
      IF EXISTS (SELECT 1 FROM "GameAttempt" WHERE (alias = actor AND "createdAt" > now_at - interval '2 seconds') OR (target_team IS NOT NULL AND "teamId" = target_team AND "createdAt" > now_at - interval '3 seconds')) THEN RAISE EXCEPTION 'Please wait a few seconds before trying again'; END IF;
      SELECT count(*) INTO attempt_count FROM "GameAttempt" WHERE "questionId" = question_row.id AND alias = actor;
      IF round_row."maxAttempts" IS NOT NULL AND attempt_count >= round_row."maxAttempts" THEN RAISE EXCEPTION 'No attempts left'; END IF;
    END IF;
    IF coalesce((payload->>'correct')::boolean, false) OR command = 'admin.hunt.solve' THEN
      elapsed := greatest(0, extract(epoch FROM now_at - started_at) - round_row."graceSec");
      points_value := round(coalesce(question_row."maxPoints", round_row."maxPoints") * (round_row."floorPct"::numeric / 100 + (1 - round_row."floorPct"::numeric / 100) * power(0.5::numeric, elapsed / round_row."halfLifeSec")) * (1 - penalty / 100));
      INSERT INTO "GameScore" (id, alias, "eventId", game, points, "roundId", "questionId", "teamId", source, reason, "createdBy") VALUES (gen_random_uuid()::text, actor, event_id, round_row.title, points_value, round_row.id, CASE WHEN target_team IS NULL THEN question_row.id ELSE NULL END, target_team, CASE WHEN admin_command THEN 'ADMIN'::"ScoreSource" ELSE 'AUTO'::"ScoreSource" END, payload->>'reason', CASE WHEN admin_command THEN actor ELSE NULL END);
      IF target_team IS NOT NULL THEN
        UPDATE "TeamLevelProgress" SET "solvedAt" = now_at WHERE "teamId" = target_team AND "roundId" = round_row.id AND "solvedAt" IS NULL;
        SELECT id INTO next_round FROM "GameRound" WHERE "eventId" = event_id AND kind = 'HUNT_LEVEL' AND "order" > round_row."order" ORDER BY "order" LIMIT 1;
        IF next_round IS NOT NULL THEN INSERT INTO "TeamLevelProgress" ("teamId", "roundId", "unlockedAt") VALUES (target_team, next_round, now_at) ON CONFLICT DO NOTHING; END IF;
        IF round_row."isFinal" THEN
          SELECT coalesce(max("finishPlace"), 0) + 1 INTO finish_place FROM "Team" WHERE "eventId" = event_id;
          UPDATE "Team" SET "finishedAt" = now_at, "finishPlace" = finish_place WHERE id = target_team;
          bonus := CASE finish_place WHEN 1 THEN 500 WHEN 2 THEN 300 WHEN 3 THEN 150 ELSE 0 END;
          IF bonus > 0 THEN INSERT INTO "GameScore" (id, alias, "eventId", game, points, "teamId", source) VALUES (gen_random_uuid()::text, actor, event_id, 'Hunt finish bonus', bonus, target_team, 'AUTO'); END IF;
        END IF;
      END IF;
    END IF;
    INSERT INTO "GameAttempt" (id, "questionId", alias, "teamId", answer, similarity, "isCorrect", points, "createdAt") VALUES (gen_random_uuid()::text, question_row.id, actor, target_team, coalesce(payload->>'answer', '[Admin solve]'), coalesce((payload->>'similarity')::double precision, 1), points_value > 0, points_value, now_at);
    RETURN jsonb_build_object('correct', points_value > 0, 'points', points_value, 'bonus', bonus, 'finishPlace', finish_place, 'elapsedSec', extract(epoch FROM now_at - started_at), 'penaltyPct', penalty, 'attemptsLeft', round_row."maxAttempts" - coalesce(attempt_count, 0) - 1);
  END IF;
  RAISE EXCEPTION 'Unknown action';
END;
$$;

CREATE OR REPLACE FUNCTION game_participant_command(event_id text, actor text, command text, payload jsonb)
RETURNS jsonb LANGUAGE plpgsql AS $$
DECLARE
  source_alias text := payload->>'alias';
  destination text := coalesce(payload->>'newAlias', payload->>'targetAlias');
  locked_event record;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('game-participant-management', 0));
  FOR locked_event IN SELECT id FROM "GameEvent" ORDER BY id LOOP
    PERFORM pg_advisory_xact_lock(hashtextextended(locked_event.id, 0));
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM "GameParticipant" WHERE alias = actor AND "isAdmin") THEN RAISE EXCEPTION 'Admin access required'; END IF;
  IF NOT EXISTS (SELECT 1 FROM "GameRegistration" WHERE "eventId" = event_id AND alias = source_alias) THEN RAISE EXCEPTION 'Player not registered in event'; END IF;
  IF EXISTS (SELECT 1 FROM "GameParticipant" WHERE alias IN (source_alias, destination) AND "isAdmin") THEN RAISE EXCEPTION 'Admin aliases cannot be renamed, merged or deleted'; END IF;
  IF source_alias = destination THEN RAISE EXCEPTION 'Choose a different destination alias'; END IF;
  INSERT INTO "GameAudit" (id, "eventId", actor, action, detail) VALUES (gen_random_uuid()::text, event_id, actor, command, payload);
  IF command = 'admin.participant.rename' THEN
    IF EXISTS (SELECT 1 FROM "GameParticipant" WHERE alias = destination) THEN RAISE EXCEPTION 'Alias already exists; use merge instead'; END IF;
    UPDATE "GameParticipant" SET alias = destination, name = CASE WHEN name = source_alias THEN destination ELSE name END WHERE alias = source_alias;
    UPDATE "GameAttempt" SET alias = destination WHERE alias = source_alias;
    UPDATE "ScoreVerification" SET alias = destination WHERE alias = source_alias;
    UPDATE "VolunteerPledge" SET alias = destination WHERE alias = source_alias;
    UPDATE "Team" SET "captainAlias" = destination WHERE "captainAlias" = source_alias;
  ELSIF command = 'admin.participant.merge' THEN
    IF NOT EXISTS (SELECT 1 FROM "GameParticipant" WHERE alias = destination) THEN RAISE EXCEPTION 'Destination alias not found'; END IF;
    UPDATE "GameScore" source SET "voidedAt" = NOW(), "questionId" = NULL, "roundId" = NULL
      WHERE source.alias = source_alias AND source."questionId" IS NOT NULL AND EXISTS (SELECT 1 FROM "GameScore" target WHERE target.alias = destination AND target."questionId" = source."questionId");
    UPDATE "GameScore" SET alias = destination WHERE alias = source_alias;
    UPDATE "GameAttempt" SET alias = destination WHERE alias = source_alias;
    INSERT INTO "GameRegistration" ("eventId", alias, "joinedAt") SELECT "eventId", destination, "joinedAt" FROM "GameRegistration" WHERE alias = source_alias ON CONFLICT DO NOTHING;
    DELETE FROM "TeamMember" source WHERE source.alias = source_alias AND EXISTS (SELECT 1 FROM "TeamMember" target WHERE target.alias = destination AND target."eventId" = source."eventId");
    UPDATE "TeamMember" SET alias = destination WHERE alias = source_alias;
    DELETE FROM "ScoreVerification" source WHERE source.alias = source_alias AND EXISTS (SELECT 1 FROM "ScoreVerification" target WHERE target.alias = destination AND target."eventId" = source."eventId");
    UPDATE "ScoreVerification" SET alias = destination WHERE alias = source_alias;
    DELETE FROM "VolunteerPledge" source WHERE source.alias = source_alias AND EXISTS (SELECT 1 FROM "VolunteerPledge" target WHERE target.alias = destination AND target."eventId" = source."eventId");
    UPDATE "VolunteerPledge" SET alias = destination WHERE alias = source_alias;
    DELETE FROM "GameParticipant" WHERE alias = source_alias;
  ELSIF command = 'admin.participant.delete' THEN
    UPDATE "GameScore" SET alias = actor WHERE alias = source_alias AND "teamId" IS NOT NULL;
    DELETE FROM "GameScore" WHERE alias = source_alias;
    DELETE FROM "GameAttempt" WHERE alias = source_alias;
    DELETE FROM "ScoreVerification" WHERE alias = source_alias;
    DELETE FROM "VolunteerPledge" WHERE alias = source_alias;
    DELETE FROM "GameParticipant" WHERE alias = source_alias;
  ELSE
    RAISE EXCEPTION 'Unknown participant action';
  END IF;
  UPDATE "GameScore" SET "voidedAt" = NOW() WHERE "teamId" IN (SELECT id FROM "Team" WHERE NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = "Team".id));
  DELETE FROM "Team" WHERE NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = "Team".id);
  UPDATE "Team" SET "captainAlias" = (SELECT alias FROM "TeamMember" WHERE "teamId" = "Team".id ORDER BY "joinedAt", alias LIMIT 1)
    WHERE NOT EXISTS (SELECT 1 FROM "TeamMember" WHERE "teamId" = "Team".id AND alias = "Team"."captainAlias");
  DELETE FROM "GamePinAttempt" WHERE alias = source_alias;
  RETURN '{"ok":true}';
END;
$$;