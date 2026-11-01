# Game Day Website Runbook

## Scope And Status

The website implements alias login, event teams, 17 data-driven sections, server-scored answers, shared hunt progression/hints, verification gating, separate leaderboards, celebrations, volunteering, and a PIN-protected host console. External hunt puzzles, downloadable puzzle files, SQL-injection simulations, and the private puzzle kit are outside this change.

Verification uses the requirements' **Google Form fallback**. There is no R2 upload, screenshot thumbnail, or private screenshot-streaming endpoint. A player submits the screenshot externally, then confirms submission on the website. `SUBMITTED` unlocks that player's L4/L5 access; only host approval adds prize eligibility. This is intentionally a trust-based fallback, not proof that a file was uploaded.

This is locally verified, not production acceptance. The production URL, real content, production platform capacity, screenshot retention, and human rehearsal still need sign-off.

## Local Rehearsal

The prepared local database is `ashraya_game_day` on `127.0.0.1:55432`. The website is at:

- Player: http://127.0.0.1:3000/games/game-day-rehearsal
- Host: http://127.0.0.1:3000/games/game-day-rehearsal/admin
- Demo host alias: `rehearsal_host`; local-only PIN: `246810`.

The local database and environment contain synthetic demonstration content only. Never copy demo credentials into production. Log in using any unique valid alias, create/join a team, and use a separate browser profile for the host.

For a fresh local setup, install PostgreSQL 16, start it on a free local port, create an empty database, and export its `DATABASE_URL` in the shell. Prisma/tsx scripts do not automatically read Next's `.env.local`.

```sh
npm ci
export DATABASE_URL='postgresql://YOUR_LOCAL_USER@127.0.0.1:55432/ashraya_game_day'
npx prisma db push
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f prisma/game-day-functions.sql
npm run db:seed:games -- --demo
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Also set `DATABASE_URL`, `GAME_ADMIN_PIN`, and a separate random `GAME_ADMIN_COOKIE_SECRET` of at least 32 characters in the ignored `.env.local`. The PIN must be at least six characters. Existing CMS auth/payment/mail configuration is independent.

The demo seed refuses non-local databases and refuses to overwrite an existing event. Do not rerun it against an already seeded event.

### Demo Answers

These are deliberately synthetic, public rehearsal fixtures, not the organizer's private answers:

- Songs: `three idiots`.
- Riddles: `moon`.
- Both picture rounds, in order: sun, tree, house, book, star, clock, heart, cloud, umbrella, flower.
- Hunt: `key1_DemoOnlyToken00001_lets`, `key2_DemoOnlyToken00001_change`, `key3_DemoOnlyToken00001_one`, `key4_DemoOnlyToken00001_persons`, `key5_DemoOnlyToken00001_world`.

Section 16 is titled Emoji Movie but uses drawing fixtures locally. Supply actual emoji/movie content before the event. Demo Benevity/Google Forms links are generic placeholders.

## Database Deployment

Back up the target database and rehearse the upgrade on a copy first. `prisma/game-day-schema.sql` is a **one-time additive upgrade from the pre-change repository schema**, not an empty-database installer and not an idempotent migration. It was generated with Prisma and tested against that baseline without schema drift. Check it against the actual deployed schema before applying it.

```sh
mkdir -p .game-day
pg_dump "$DATABASE_URL" --format=custom --file=.game-day/before-game-day.dump
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
  -f prisma/game-day-schema.sql \
  -f prisma/game-day-functions.sql
npx prisma generate
```

Use the direct PostgreSQL connection for schema changes. The scripts do not perform deployment automatically. Do not use `db push --accept-data-loss` or rerun the one-time schema script against an upgraded database.

`game-day-functions.sql` is required in addition to the Prisma schema. It defines team-slot/name constraints and atomic game/participant mutation functions. Mutations use one PostgreSQL call with transaction-scoped advisory locks; there are no interactive Prisma transactions, so the Neon HTTP adapter remains supported. Event mutation calls serialize within an event. Participant rename/merge/delete acquire event locks in a stable order.

Reapply the functions script after changing it. It is also needed after schema tooling recreates the custom constraints. Keep these functions and the app version compatible. Backups and any generated private migration artifacts must stay ignored.

## Production Content

Keep production content in ignored `*.private.json` files. The seed checks that both files are ignored and untracked. `extra_info/` remains reference-only and is excluded from Git; do not move the kit into public assets or imports.

```sh
npm run db:seed:games -- \
  --hunt .game-day/hunt.private.json \
  --content .game-day/event.private.json
```

The hunt input contains `levels`, exactly five entries in progression order. Each entry requires:

| Field | Content |
|---|---|
| `title` | Level title |
| `card` | Markdown prompt; only L1 should contain the initial external puzzle link |
| `answer` | `keyN_<15-20 alphanumeric characters>_<mission word>` |
| `hints` | Exactly three `{ "order": 1, "penaltyPct": 20, "text": "..." }` objects, ordered 1-3 |
| `revealOnSolve` | Markdown containing the next external link or final message |

The random token is case-sensitive. Prefix and mission word are case-insensitive; apostrophes in the word are optional. The seed sets L4/L5 verification requirements and L5 final status. The initial deadline is 45 minutes; the host can extend it. Other kit metadata such as methods/estimated times is not imported.

The live-content file requires `eventId`, `title`, `company`, `location`, `givingUrl`, `verificationFormUrl`, and `rounds`. Each round has `order`, optional `title`, and `questions`. Each question has `acceptedAnswers`, optional `prompt`, optional absolute `mediaUrl`, and optional `matchThreshold` (0.80-0.95, default 0.85).

Provide orders **1, 2, 9, 10, 11, 12, 14, 15** with one question each, and **13, 16** with ten questions each. Media must contain only the intended visible clue, never the answer in its filename/metadata. Test actual accepted-answer variants and three or four realistic misspellings per question. The default event date is 4 November 2026.

Existing event IDs are never overwritten. Seeding is a sequence of writes, so a failed seed can leave a partial new event: inspect it and remove only that unpublished event before retrying. Do not delete an event with real participation to rerun a seed.

## Host Access And Operations

Set a strong production `GAME_ADMIN_PIN` and independent random `GAME_ADMIN_COOKIE_SECRET` through the deployment secret manager. Never use `NEXT_PUBLIC_` variables for secrets. The signed, httpOnly, same-site PIN cookie lasts 12 hours and is secure in production. Every privileged API also checks the participant's database flag. Five PIN attempts are allowed per alias per 15-minute window; a successful login clears that counter.

Create the intended host alias through the normal login page, then grant the flag manually in the database:

```sql
UPDATE "GameParticipant" SET "isAdmin" = true WHERE alias = 'YOUR_HOST_ALIAS';
```

There is no UI to grant administrator status. Alias login remains impersonable by design; the PIN is what protects the host's mutation privileges. Revoking the database flag takes effect even while a PIN cookie exists.

The console supports round open/close/reopen/extend, paginated score awards and voids, team operations, hunt solve/reset/refund, individual verification reviews, recent attempts, global alias operations, and volunteer CSV export.

- Open L1 to lock teams and start the 45-minute hunt. Later levels are team-paced, not manually opened in normal play.
- A round reopen restarts its clock but does not erase attempts or prior awards.
- Score voids retain tombstones so a player cannot answer again to reclaim the points.
- Hunt reset removes that level and subsequent progression, related awards/refunds, and the finish bonus. It does not retroactively rerank other teams. Use an audited adjustment if prize corrections are necessary.
- Participant rename/merge/delete are global across events, as confirmed in the UI. Merge retains the destination's existing team/forms and voids duplicate question awards. Deletion removes individual scores but preserves shared team awards when teammates remain. Admin aliases cannot be renamed, merged, or deleted here.
- Score, verification, and recovery changes require reasons. Audit records are stored server-side. The attempts view shows the latest 100 attempts, not the full archive.

## Verification And Privacy

Create a restricted Google Form that collects event ID, alias, Benevity hours, and screenshot; configure its upload access for the intended audience. Put the participant-facing form URL in `verificationFormUrl`. Hosts must separately retain the private response-folder URL; the website does not access Google responses automatically.

Before opening the event, test the form with an actual participant account, including any organizational login requirements. Players confirm their external submission on the website. Check the matching screenshot in the restricted Google responses before approval. Rejection removes access to L4/L5 until resubmission but does not erase already-earned team awards.

Assign an organizer to delete screenshots and copies from the Google Form response storage, exports, and trash after 30 days. This retention is manual for the fallback, not automated by the website. Restrict volunteer exports to authorized organizers and follow the collected contact consent. Never log screenshots/contact fields to Workers logs. No contact details are collected at alias login.

## Verification Commands

Run against the isolated local database and an already-running local website:

```sh
npm run test:games
npm run test:games:db
npx playwright install chromium
GAME_ADMIN_PIN=246810 npm run test:games:browser
npm run build
npm run start -- --hostname 127.0.0.1 --port 3000
npm run test:games:load
npm run build:worker
```

Stop the dev server before building, and run build/worker packaging without another process writing `.next`. The browser test requires the demo event, creates disposable events/participants, and removes them afterward. Database tests are opt-in and local-only. The load script is also local-only, creates 150 players/30 teams/17 rounds, polls every five seconds for five minutes, and cleans up. `GAME_LOAD_SECONDS` can shorten a smoke run; `GAME_TEST_URL` selects another local port.

Verified locally:

- Four unit-test groups: matcher examples, score formula/hints, exact hunt keys, rank ties and CSV formula protection.
- Two database regression tests: concurrent team slots/solves, lock/captain/gate/deadline rules, hint refund/reset, and alias rename/merge/delete.
- Full 17-section Playwright rehearsal, forbidden player mutations, CSRF check, content hiding, mobile layout/navigation, verification gating, asset/canvas rendering, volunteer export, score tombstones and ledger pagination.
- Five-minute optimized-build load run: **9,002 successful state polls**, **zero errors**, p50 **8 ms**, p95 **10 ms**, p99 **11 ms**, max **49 ms** on local PostgreSQL. This is a staggered polling test, not a simultaneous answer storm or a production/edge measurement.
- Next production build and OpenNext worker packaging passed. The one-time SQL upgrade matched the target Prisma schema on a disposable baseline database.

## Release Gates And Deferred Work

1. Replace demo media/answers/URLs; test the real external hunt separately. Confirm admin secrets and schema/functions are present in the target environment.
2. Deploy to staging, verify Neon-over-HTTP runtime behavior and signed cookies, then complete all P0 acceptance checks on the actual production URL. No deployment was performed as part of this local implementation.
3. Use Workers Paid for event week. Run an explicitly authorized 150-player production/staging load check and inspect Workers CPU/error telemetry. Local timings do not establish the <500 ms state / <800 ms answer targets or the Workers CPU budget. Concurrent answer latency is not measured by the polling harness.
4. Complete the 6-10-person rehearsal with two teams, tune real hints/content, confirm the Google Form/privacy retention process, and verify event-day recovery with the host.
5. Review dependency security before release. OpenNext warns that Next.js 14.2.35 is unsupported and uses the repository's existing unsupported-version override. Installation reported 42 dependency audit findings, including high/critical findings. Framework/dependency upgrades were not included in this feature change.

Deferred: R2 uploads/private screenshot viewing, bulk approval, P2 leaderboard freeze/announcements/bonus games/volunteer sync. Teammates receive shared progress within a poll; the submitting player receives the animation. The level timer is in the sticky header rather than duplicated inside the team card. The provided diagram/media fixtures are for local rehearsal only.