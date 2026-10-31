# Ashraya Online Game Day — Requirements

**Event date:** Wednesday, 4 November 2026
**Codebase:** `ashraya-website` (Next.js 14 App Router, Prisma + Neon Postgres, deployed on Cloudflare Workers via OpenNext)
**Status:** Draft v1 for build — decisions marked **[Default]** can be changed by the organizer; everything else is a requirement.

---

## 0. TL;DR

We are turning the existing Game Day page into a **host-run, auto-scored online game** played on **one page**:

- Players log in with **just an alias**.
- Players form **teams of up to 5** for the **Digital Treasure Hunt**.
- Every other game (songs, riddles, scribble) is **individual** and **auto-scored with fuzzy matching**.
- **Faster correct answers score more** (non-linear decay with a minimum floor).
- **Players can no longer enter their own scores.** Points come from the system or from an **admin**.
- Midway, players must submit their **Benevity hours + screenshot**. Without it they can't continue the hunt and aren't eligible for prizes (no ✓ on the leaderboard).
- The page ends with a **volunteering interest form**.

Section 15 lists what must ship by Wednesday (P0) vs. what can wait.

---

## 1. Goals and non-goals

### Goals
1. A fun, competitive, collaborative ~75-minute online event that works for non-technical people.
2. Zero manual score-keeping in the common case; admin override for everything else.
3. Fair, time-based scoring that's hard to game.
4. Benevity hours logged by as many participants as possible (this is a business goal, so the verification step is a hard gate).
5. Collect volunteering leads at the end.

### Non-goals (for Wednesday)
- Real authentication (passwords, OTP, email verification). Alias-only is intentional.
- Real-time WebSockets. Polling is enough.
- A general-purpose quiz builder UI. Admin content can be seeded by script/JSON for this event.
- A real vulnerable SQL database. See §6.1.1 for the safe simulation.

---

## 2. What already exists (read this first)

| Area | Current state | Change needed |
|---|---|---|
| Alias login | `lib/games.ts` stores a lowercase alias in an httpOnly cookie `ashraya_game_alias` (60 days). `GameParticipant.alias` is the primary key. Registration asks for name + phone. | Drop the name/phone requirement; alias only (§4.1). |
| Events | `GameEvent` with `games String[]` | Add structured **rounds** (§9). |
| Scores | `GameScore` ledger (alias, eventId, game, points). Players add their own points via `AddPointsDialog` and can delete their own scores. | **Remove player self-scoring.** Score creation/deletion becomes system + admin only (§4.4). |
| Leaderboard | Per-event, individual, ranked by total points, with polling refresh and a victory fanfare. | Add team leaderboard, ✓ verification badge, time-based tie-break. |
| Admin | NextAuth `User` with `Role` exists for the CMS side, **unrelated** to game players. | Add `isAdmin` on `GameParticipant` (§4.4). |

**Platform constraints the builder must respect:**
- **Neon over HTTP: no interactive transactions** (see commit `da33847`). Use unique constraints, `upsert`, `createMany({ skipDuplicates: true })` and conditional `updateMany({ where: { solvedAt: null } })` to stay race-safe.
- **Workers free plan: 10 ms CPU per request and 100,000 requests/day** (commit `f908eea` already had to trim CPU on public pages). Keep game API handlers small. Time spent waiting on the database doesn't count as CPU; JSON building and Prisma overhead do.
- **Request budget math:** `players × (60 / pollSeconds) × eventMinutes`. 100 players polling every 5 s for 90 min ≈ **108,000 requests**, which is over the free daily limit. **[Default]** Poll every 10 s, pause polling when the tab is hidden, and **switch to Workers Paid ($5/month) for event week**. Static assets (images, audio, Lottie files) don't count toward the limit.
- **No object storage configured yet.** Benevity screenshots need an **R2 bucket** binding in `wrangler.jsonc`.

---

## 3. Roles and glossary

| Term | Meaning |
|---|---|
| **Player** | Anyone logged in with an alias. |
| **Captain** | The player who created a team. |
| **Admin** | A player with `isAdmin = true` in the DB (set manually) **plus** the admin PIN (§4.4). |
| **Round** | One collapsible section on the page (e.g. "Guess the Song 2"). |
| **Live round** | Host-paced. Admin opens it when the performance starts and closes it after. Everyone shares the same clock. Songs, riddles, scribble. |
| **Self-paced round** | Team-paced. The clock starts when **your team** unlocks it. Treasure-hunt levels. |
| **Gate round** | Has no points; blocks later rounds until completed. Benevity verification. |
| **Ledger** | `GameScore` table. Every point change is a row, including admin adjustments (which can be negative). Totals are always sums of the ledger. |

---

## 4. Part A — Platform features

### 4.1 Login (alias only)
- One input: **alias**. No password, OTP, email or phone.
- Rules: 3–20 chars, `a–z 0–9 _ -`, case-insensitive (stored lowercase, trimmed). Reserved: `admin`, `host`, `ashraya`, `system`.
- If the alias exists, you're logged in as that player; if not, a new player is created. Display name defaults to the alias, optionally editable later.
- Same alias on another device logs into the same player (current behavior, keep it).
- "Log out" clears the cookie.
- **Known risk (accepted):** anyone who types your alias becomes you. Mitigations: admin can void scores; the UI suggests "pick something unique, like `priya_blr_42`".

**Acceptance:** typing a new alias creates a player and lands on the game page in under 2 s; typing it again on another browser shows the same scores.

### 4.2 Teams
- **Teams are per event.** A player can be in **at most one team per event** (enforced by a DB unique constraint, not just the UI).
- **Create team:** a player with no team enters a team name (unique within the event, 2–30 chars) and becomes **Captain**.
- **Add members:** the captain picks from a searchable list of **available players** (logged in for this event, not in any team). Max **5 including the captain**.
- **[Default]** Adding is immediate; no invite or accept step. It's faster for a live event, and anyone added by mistake can leave.
- **Join:** **[Default]** players can also join any team with open slots via a "Join" button, so they don't have to wait for a captain to find them.
- **Leave:** any member can leave at any time **before the team lock** (below).
  - If the captain leaves, captaincy passes to the earliest-joined remaining member.
  - If the last member leaves, the team is deleted.
- **Remove member:** the captain can remove members (before the lock).
- **Team lock (important for fairness):** when admin opens **Treasure Hunt L1**, team membership locks. Otherwise a player could leave a slow team and join the leading team mid-hunt. After the lock, only an admin can move players.
- **Auto-team (admin):** a button that groups all players without a team into random teams of up to 5, so no one is left out when the hunt starts.
- A player joining a team (admin move after the lock) **inherits the team's hunt progress**.

**Acceptance:** two players trying to grab the last slot at the same moment results in exactly 5 members; a player can't be in two teams; leave works before L1 opens and is blocked after.

### 4.3 Team dashboard and leaderboards
On the game page (a collapsible panel or tab, always reachable):

**My team card:** team name, captain, members (with ✓ verification badge each), team points, current hunt level, time on current level, hints used.

**Leaderboards** (polled, see §8):
1. **Individual:** sum of a player's individual-round points (songs, riddles, scribble). Shows ✓ if Benevity is approved.
2. **Teams:** sum of team-round points (treasure hunt levels + finish bonus). Shows level reached and finish time.
3. **[Default]** Hunt points are **not** added to individual totals, and individual points are **not** added to team totals. This keeps "best player" and "best team" separate prizes. (Open question Q1.)

**Ranking and ties:** sort by points desc, then **earlier time of the last point-earning answer** wins (rewards consistency and speed), then alias A–Z.

**Prize eligibility:** players without ✓ are shown greyed with "not eligible for prizes" on hover. See Q2 for teams.

### 4.4 Admin
**Access:**
- `GameParticipant.isAdmin Boolean @default(false)`, set **manually in the DB only**. There's no UI to grant admin.
- **Strong recommendation:** because login is alias-only, anyone who learns the admin's alias would get admin powers. Admin actions therefore also require an **admin PIN** (env var `GAME_ADMIN_PIN`, entered once per device, stored as a signed httpOnly cookie for 12 h). Every admin API checks **both** `isAdmin` and the PIN cookie **on the server**.

**Admin can do everything.** Admin console capabilities:

| Area | Capabilities |
|---|---|
| **Round control** | Open / close / reopen any round, extend time, see a live count of submissions per round. |
| **Scores (ledger)** | Give points to any player or team (with a reason), adjust (positive or negative), void/delete any score row. All admin entries are stored with `source = ADMIN`, `createdBy`, and `reason`. |
| **Live feed** | Stream of attempts: who, round, answer typed, similarity %, correct/wrong, points. Useful to spot fuzzy-match misses and manually award ("they typed *Dilwale* — give it"). |
| **Treasure hunt** | Per-team progress grid (level, time on level, hints, attempts). Mark a level solved, reset a level, refund a hint penalty. |
| **Teams** | Create, rename, disband, move players, auto-team, toggle team lock. |
| **Verifications** | Queue of Benevity submissions with screenshot thumbnails, hours, Approve / Reject (with reason). |
| **Participants** | Rename, delete (and their scores), merge two aliases (same person, two devices/typos). |
| **Volunteer responses** | Table view + **CSV export**. |
| **Leaderboard** | **[P2]** "Freeze" toggle that hides live ranks in the last minutes for suspense; final reveal button. |

**Player self-scoring removed:** `AddPointsDialog` and the player-facing delete in `MyScores` go away. `POST /api/games/events/[eventId]/scores` and `DELETE /api/games/scores/[id]` become **admin-only**. Players only earn points by answering.

---

## 5. Part B — The Wednesday event page

### 5.1 One page, 17 collapsible sections (run of show)

The numbering in the original brief had duplicates; this is the corrected order:

| # | Section | Type | Mode | Scoring |
|---|---|---|---|---|
| 1 | Guess the Song 1 | Song | Live | Individual |
| 2 | Guess the Riddle 1 (Paheli) | Riddle | Live | Individual |
| 3 | Treasure Hunt — Level 1 | Hunt | Self-paced | Team |
| 4 | Treasure Hunt — Level 2 | Hunt | Self-paced | Team |
| 5 | Treasure Hunt — Level 3 | Hunt | Self-paced | Team |
| 6 | **Verify your score** (Benevity) | Gate | Self-paced | None (unlocks ✓) |
| 7 | Treasure Hunt — Level 4 | Hunt | Self-paced | Team |
| 8 | Treasure Hunt — Level 5 (Final vault) | Hunt | Self-paced | Team + finish bonus |
| 9 | Guess the Song 2 | Song | Live | Individual |
| 10 | Guess the Riddle 2 | Riddle | Live | Individual |
| 11 | Guess the Song 3 | Song | Live | Individual |
| 12 | Guess the Riddle 3 | Riddle | Live | Individual |
| 13 | Scribble 1 | Scribble | Live | Individual |
| 14 | Guess the Song 4 | Song | Live | Individual |
| 15 | Guess the Song 5 | Song | Live | Individual |
| 16 | Scribble 2 **or** Emoji Movie (see §6.5) | Scribble | Live | Individual |
| 17 | Volunteering form | Form | Self-paced | None |

Rounds are **data, not code**: each section is a `GameRound` row with an `order`, so the organizer can reorder or swap section 16 without a deploy.

**Rough timing:** songs 5 × ~3 min, riddles 3 × ~2 min, hunt ~40 min, verify ~5 min, scribble 2 × ~5 min, form ~3 min. Total ≈ **85 min** plus host talk (the hunt overlaps later rounds).

**Hunt runs in the background:** once the hunt starts, levels stay open until the **hunt deadline** **[Default: 45 min after L1 opens]**. Admin can open section 9 onward while slower teams are still on L4/L5; players just switch sections.

### 5.2 Section (accordion) states

Each section header shows: number, title, type icon, **state badge**, and points earned.

| State | When | Header shows | Body shows |
|---|---|---|---|
| 🔒 **Locked** | Not yet opened by host, or the previous level isn't solved, or the verification gate isn't done | "Starts soon" / "Solve Level 2 first" / "Verify your Benevity hours to unlock" | Reason only. **No question content is sent to the browser.** |
| 🟢 **Live** | Open and not yet answered | Countdown or elapsed time | Prompt, media, input, hints |
| ✅ **Done** | Answered correctly | `+795 pts`, time taken | Your answer, points breakdown |
| ⏹ **Closed** | Round closed without a correct answer | "Closed" | "Answer: …" (revealed after close) |

**Behaviour:**
- When a live round opens, it **auto-expands and scrolls into view**; the previously live section collapses. Users can still expand any section manually.
- On a correct answer, the section collapses after the celebration and the next unlocked section expands.
- Locked sections are expandable but only show the reason.

### 5.3 Answer feedback
- **Wrong answer:** small inline error below the input ("Not quite — try again"), `aria-live="polite"`, a subtle shake animation, cleared as soon as the user types. Shows attempts left where limited.
- **Close but not accepted** (similarity between 0.65 and the threshold): "So close! Check your spelling." **[P1]**
- **Correct:** a full-screen **Lottie** overlay for ~2 s with "+795" points, then collapse and advance. Also replay the existing fanfare sound if it isn't muted.
- **Hunt finished (L5 solved):**
  - **First team:** a big full-screen Lottie with confetti and trophy, "🏆 You found the treasure! You're the winners!", team name, total time.
  - **Other teams:** a smaller celebration, "Treasure unlocked — you finished #3".
- **Library:** `@lottiefiles/dotlottie-react` (`.lottie` files are smaller than JSON), **lazy-loaded** with `next/dynamic` so it doesn't bloat the first load. Respect `prefers-reduced-motion` (show a static badge instead).
- Pressing **Enter** submits. Double-submits are blocked while a request is in flight.

### 5.4 Top-right timer
A sticky timer in the top-right corner, always visible:
- **If a live round is open:** shows that round's **countdown** (e.g. `01:23`), turning red under 10 s. When it hits 0 the input disables (the server also rejects).
- **Else, if the player's team is on a hunt level:** shows **time on this level** (counting up), plus the overall hunt time remaining in smaller text.
- **Else:** "Waiting for next round".
- The timer **restarts for every round**: each hunt level starts at that team's unlock time; each live round starts when admin opens it.
- **Server time is the only truth.** Every poll response includes `serverNow`; the client computes `offset = serverNow − Date.now()` and renders from that, so a wrong laptop clock doesn't matter. Points are calculated **on the server** from server timestamps.

---

## 6. Game specifications

### 6.1 Digital Treasure Hunt (team)

**Mechanics**
- Teams of up to 5. Any member can submit; the **first correct submission solves the level for the whole team**. Teammates see the unlock within one poll cycle.
- Each level's puzzle reveals two things: that level's **key** and the **link where the next level starts**. The next level's card does not show that link ("Use what the last level revealed"), so levels are chained.
- **Key format:** `keyN_<15–20 random letters/digits>_<word>`. The words of key1–key5 spell the mission: **Let's change one Person's World**. The random part makes later keys unguessable even when earlier ones are known.
- Only L1 is unlocked at the start (when admin opens the hunt). L(n+1) unlocks when the team solves L(n). **L4 additionally requires the player to have submitted the verification** (§6.4).
- **After a level is solved, its card shows the "next" link again** (`revealOnSolve` in the seed), so a refresh or a teammate who missed it doesn't block the team.
- Solving **L5 wins.** The winner screen assembles the five words: "Let's change one Person's World". There is no separate vault input.
- Answers are validated **server-side only**. Answers, hint texts and `revealOnSolve` are never in the page bundle or in API responses for locked/unsolved levels.
- **Rate limit:** 1 attempt per team per 3 s. Unlimited attempts otherwise (it's a puzzle, not a quiz).
- **Key matching is not fuzzy** (use `matchHuntKey` from the handoff, not §7): `keyN` prefix case-insensitive, random part **exact and case-sensitive**, word case-insensitive with the apostrophe optional; surrounding spaces/quotes ignored. If someone submits a key for a different level, say so ("That's your Level 2 key").
- **Device note on the page:** "The hunt works best on a laptop — you'll need View Source, downloads and maybe a script."

**Hints (per level)**
- Three hints, opened in order (Hint 2 requires Hint 1).
- Penalty is based on the **highest hint opened** (not additive), applied to that level's points:

| Hint opened | Deduction (configurable `a, b, c`) | Multiplier |
|---|---|---|
| None | — | × 1.0 |
| Hint 1 | **a = 20%** | × 0.8 |
| Hint 2 | **b = 50%** | × 0.5 |
| Hint 3 | **c = 80%** | × 0.2 |

- Opening a hint asks for confirmation: "Hint 2 will reduce this level's points by 50%. Open it?"
- Hint 3 always repeats where the level starts, so a team that lost the link can still continue (at a cost).
- Hints are **shared per team** (one teammate opens it, all see it, the whole team takes the penalty).
- Suggested hint ladder: Hint 1 = gentle nudge, Hint 2 = names the tool or technique, Hint 3 = near-walkthrough.

#### 6.1.1 Level plan (increasing difficulty: 1, 2, 2, 2, 3 methods)

| Level | Title | Methods | Est. mins |
|---|---|---|---|
| **L1** | The Page Remembers | HTML page source | 3 |
| **L2** | A File Without a Name | Missing file extension → QR code | 6 |
| **L3** | Listen With Your Eyes | Audio spectrogram → Base64 | 8 |
| — | **Verify** (gate, §6.4) | Benevity screenshot | — |
| **L4** | The Needle and the Eraser | 100 files (script or AI) → deleted git commit | 12 |
| **L5** | The Foolish Door | EXIF metadata → Base64 → simulated SQL-injection login | 12 |

**Hunt deadline [Default]:** 45 min after L1 opens.

**The puzzle content is already built** by the organizer in a separate private kit (not in this repo, because this repo is public and the content reveals answers):
- The puzzle files live on a **separate static site** (`ashraya-hunt` on Cloudflare Workers static assets), not under this site's `public/`. The website only links to it from the L1 card.
- The SQL-injection login is **simulated**: a static page where the key is encrypted with the exact username. No database or query exists.
- The organizer sends the developer **`treasure-hunt.seed.json`** (per level: `title`, `card`, `answer`, `hints[{order, penaltyPct, text}]`, `revealOnSolve`, `requiresVerification`, `isFinal`) and **`matchHuntKey.ts`** privately.

**Developer requirements for the seed:**
- Load it into the DB from a **gitignored** file. Never commit it, never send `answer`/`hints`/`revealOnSolve` to the browser before they're earned.
- Render `card` for unlocked levels, hints on request (§ hints), and `revealOnSolve` once solved.
- L1's `card` contains the hunt site URL; L2–L5 cards intentionally contain no links.

#### 6.1.2 Hunt scoring
- Per level: `maxPoints = 1000`, time-decayed from **the team's unlock time for that level** (§8), then × hint multiplier.
- **Finish bonus** when L5 is solved: 1st team **+500**, 2nd **+300**, 3rd **+150**. **[Default]**
- Level points are awarded **once per team** (DB unique constraint on `(teamId, roundId)`).

### 6.2 Guess the Song (individual, live)
- NGO kids sing live in the meeting. **Admin opens the round when the singing starts** (that's t = 0 for everyone).
- Page shows: "Song 3 — Which movie is this song from?" plus one input.
- Fuzzy match against a list of accepted answers (§7). Include common short forms and spellings, e.g. `["dilwale dulhania le jayenge", "ddlj"]`, and optionally a Devanagari spelling.
- **[Default]** Max **3 attempts** per player per song (prevents spamming every movie name). Round window **[Default] 90 s** after open, then auto-close; admin can extend.
- Correct answer = time-decayed points (§8). The answer is revealed when the round closes.
- **[P2]** Bonus field "Song name (optional)" for +200 if correct.

### 6.3 Guess the Riddle / Paheli (individual, live)
- Same engine and UI as songs: kids sing or recite a riddle, players type the answer.
- Riddles may be in Hindi/Marathi. Accepted answers should list English, transliterated, and Devanagari variants (`["chaand", "chand", "moon", "चाँद"]`), since normalization doesn't transliterate between scripts.
- Max 3 attempts, 90 s window.

### 6.4 Verify your score (Benevity gate)
**Why:** Benevity volunteer-hour logging is the business outcome. It's placed mid-game (after L3) so people do it while engaged.

**Form:**
- Hours logged in Benevity (number, 0.25 steps, 0.25–24).
- Screenshot of the Benevity confirmation (JPG/PNG/WEBP, ≤ 5 MB). Client-side resize to max 1600 px before upload to save bandwidth and storage.
- Optional note.
- Short instructions with the Benevity link (`GameEvent.givingUrl` already exists) and a sample screenshot showing what to capture.

**States:** `NOT_SUBMITTED → SUBMITTED → APPROVED` or `REJECTED` (with reason; the player can resubmit).

**Gating rules:**
- **`SUBMITTED` (or `APPROVED`) is required to view or submit Treasure Hunt L4 and L5.** Locked message: "Log your hours in Benevity and upload the screenshot to unlock Level 4."
- **`APPROVED` gives the ✓** on leaderboards. Without ✓, points still show but the player is **not eligible for prizes**.
- Admin approves from the queue (§4.4). **[P1]** Bulk approve.

**Storage and privacy:**
- Private **R2 bucket** (`game-verifications`), key `eventId/alias/<uuid>.webp`. Never public. Admin views through an admin-only route that streams the object.
- Delete screenshots **30 days** after the event (manual script is fine).
- Only accept image MIME types, check magic bytes, and cap the size **on the server**.

**Fallback:** if R2 isn't ready by Wednesday, a "Submit via Google Form" link plus admin manually sets `APPROVED` in the admin console.

### 6.5 Scribble (individual, live)
- Show **10 images** at once in a grid; each has its own input. **[Idea]** Use drawings made by Ashraya kids. It's on-mission and fun.
- Round window **[Default] 3 min**. Each image: `maxPoints = 200`, time-decayed from round open with a longer half-life (§8).
- Fuzzy match per image, max 3 attempts per image.
- A correct image shows ✅ in place. The full-screen Lottie only plays when all 10 are done (avoids 10 overlays).

**Section 16 alternatives (same engine, no new UI needed):**
1. **Emoji Movie** (recommended): 🧔‍♂️🔥🐎🤠 → *Sholay*. Works with the exact same image/text + answer model.
2. **Zoomed-in picture:** an extreme close-up of an object.
3. **Blurred logo / landmark.**

### 6.6 Volunteering form (end)
**Fields:**
- **Contact** (required, because an alias can't be contacted): name, plus email **or** phone (at least one).
- **Mode:** Online / Offline / Both.
- **City** (if offline/both).
- **Availability:** Weekdays / Weekends / Both / Flexible (matches the existing `VolunteerAvail` enum).
- **Hours per month:** <2 / 2–5 / 5–10 / 10+.
- **Interests (multi-select):**
  - Teaching – primary school (classes 1–5)
  - Teaching – middle school (classes 6–8)
  - Teaching – high school / exam prep (classes 9–12)
  - Spoken English & communication
  - Computer literacy / coding for kids
  - Website & tech development
  - Design, social media & content
  - Content writing & translation
  - Photography & video
  - Painting, art & craft
  - Music & dance
  - Yoga & fitness
  - Sports coaching
  - 1-to-1 mentoring & career guidance
  - Fundraising & CSR connections
  - Event management
  - Management & operations
  - Accounts, finance & compliance
  - Legal support
  - HR & volunteer coordination
  - Health camps (medical professionals)
  - Environment drives (tree plantation, clean-ups)
  - Community kitchen / food drives
- **Other:** free text (≤ 500 chars).
- **Consent:** "Ashraya may contact me about volunteering" (required).

One response per player per event (editable). Admin CSV export. **[P2]** Push approved responses into the existing `Volunteer` table.

---

## 7. Fuzzy answer matching

All matching runs **on the server**. Each question has `acceptedAnswers: string[]` and `matchThreshold` (0.80–0.95, **[Default] 0.85**). Hunt keys don't use fuzzy matching (see §6.1).

**Normalize both input and each accepted answer:**
1. Unicode NFKD, strip diacritics, lowercase, trim.
2. Remove punctuation; collapse whitespace.
3. Drop a leading article: `the`, `a`, `an`.
4. Light Hinglish folding: `aa→a`, `ee→i`, `oo→u`, `ph→f`, `w→v`, double consonants → single (`chaand` ≈ `chand`, `dilwaale` ≈ `dilvale`).
5. Convert number words to digits (e.g. `three` → `3`) so `3 idiots` matches `three idiots`.

**Similarity:** `max` over accepted answers of `max(levenshteinRatio, tokenSortRatio)`, where:
- `levenshteinRatio = 1 − distance / max(len(a), len(b))`
- `tokenSortRatio` = `levenshteinRatio` after sorting the words alphabetically (handles word order)

**Rules:**
- Answers ≤ 4 characters after normalization must match **exactly** (one typo in "ddlj" is already 25%).
- Correct if `similarity ≥ matchThreshold`.
- Store `similarity` on every attempt so admin can see near-misses.
- Library: `fastest-levenshtein` (tiny, fast) or a ~20-line implementation. CPU cost is negligible for short strings.

**Test table (must pass as unit tests):**

| Accepted | Input | Expected |
|---|---|---|
| dilwale dulhania le jayenge | Dilwaale Dulhaniya Le Jaayenge | ✅ |
| dilwale dulhania le jayenge | ddlj (if listed) | ✅ |
| 3 idiots | three idiots | ✅ |
| the lion king | Lion King | ✅ |
| kabhi khushi kabhie gham | kabhi khushi kabhi gham | ✅ |
| sholay | sholey | ❌ at 0.85 (0.83). List `sholey` as an accepted variant. |
| sholay | shor | ❌ |
| kal ho naa ho | ho naa ho kal | ✅ (token sort) |
| don | dhoom | ❌ |

---

## 8. Time-based scoring

**Research:** Kahoot's classic formula is `points = (1 − (t / T) / 2) × max`. It's **linear**: it falls evenly from 100% to 50% across the timer, with full points under 0.5 s. We want **non-linear**: a big reward for answering quickly, a gentler decline later, and a guaranteed **floor** so a slow correct answer still beats a wrong one.

**Formula (exponential decay with grace period and floor):**

```
t      = serverSubmitTime − roundStart          // seconds
t'     = max(0, t − G)                          // grace period
factor = F + (1 − F) × 0.5^(t' / H)             // H = half-life
points = round(maxPoints × factor × hintMultiplier)
```

- `roundStart` = admin open time (live rounds) or the team's unlock time (hunt levels).
- `G` = grace period (full points), `H` = half-life (the time for the bonus part to halve), `F` = floor.
- All parameters are **stored per round**, so they're tunable without a deploy.

**[Default] parameters:**

| Round type | maxPoints | Grace G | Half-life H | Floor F | Window |
|---|---|---|---|---|---|
| Song / Riddle | 1000 | 3 s | 20 s | 30% | 90 s |
| Scribble (per image) | 200 | 5 s | 60 s | 30% | 3 min |
| Hunt level | 1000 | 30 s | 4 min | 30% | until hunt deadline |

**Worked examples, Song (1000 max):**

| Answered at | Points | (Kahoot, for comparison) |
|---|---|---|
| 3 s | 1000 | 983 |
| 13 s | 795 | 928 |
| 23 s | 650 | 872 |
| 43 s | 475 | 761 |
| 63 s | 388 | 650 |
| 90 s | 334 | 500 |

**Worked examples, Hunt level (1000 max, no hints):** solved in 2.5 min → **795**; 4.5 min → **650**; 8.5 min → **475**; 8.5 min with Hint 2 → **238**.

**Why this works:** the first ~20 seconds matter a lot (it rewards recognizing the song), but nobody gets a near-zero score for a correct answer.

**Integrity:**
- Points are calculated **only on the server**; the client never sends points or time.
- Each question awards **at most once** per player (individual) or team (hunt), enforced by DB unique constraints.
- Submissions after `closedAt` are rejected.

---

## 9. Data model (Prisma draft)

Additive changes only; existing tables keep working.

```prisma
model GameParticipant {
  alias     String   @id
  name      String
  phone     String?                    // now optional and unused at login
  isAdmin   Boolean  @default(false)   // set manually in DB only
  createdAt DateTime @default(now())
  scores        GameScore[]
  memberships   TeamMember[]
  attempts      GameAttempt[]
  verifications ScoreVerification[]
}

model GameEvent {
  // existing fields …
  teamsLockedAt  DateTime?
  huntDeadlineAt DateTime?
  rounds GameRound[]
  teams  Team[]
}

model Team {
  id           String   @id @default(cuid())
  eventId      String
  name         String
  captainAlias String
  createdAt    DateTime @default(now())
  members  TeamMember[]
  progress TeamLevelProgress[]
  @@unique([eventId, name])
}

model TeamMember {
  eventId  String
  alias    String
  teamId   String
  joinedAt DateTime @default(now())
  @@id([eventId, alias])               // one team per player per event
  @@index([teamId])
}

enum RoundKind { SONG RIDDLE HUNT_LEVEL SCRIBBLE VERIFY VOLUNTEER }

model GameRound {
  id          String    @id @default(cuid())
  eventId     String
  order       Int
  kind        RoundKind
  title       String
  description String?
  maxPoints   Int       @default(1000)
  graceSec    Int       @default(3)
  halfLifeSec Int       @default(20)
  floorPct    Int       @default(30)
  durationSec Int?                      // live rounds auto-close
  maxAttempts Int?                      // null = unlimited
  openedAt    DateTime?
  closedAt    DateTime?
  questions   GameQuestion[]
  @@unique([eventId, order])
}

model GameQuestion {
  id              String   @id @default(cuid())
  roundId         String
  order           Int      @default(0)
  prompt          String?
  mediaUrl        String?                // image / audio
  downloads       Json?                  // [{label, url}] for hunt files
  acceptedAnswers String[]               // never sent to client
  matchThreshold  Float    @default(0.85)
  maxPoints       Int?                   // overrides round (scribble images)
  hints           Json?                  // [{text, penaltyPct}] — never sent until opened
  @@unique([roundId, order])
}

model GameAttempt {
  id         String   @id @default(cuid())
  questionId String
  alias      String
  teamId     String?
  answer     String
  similarity Float
  isCorrect  Boolean
  createdAt  DateTime @default(now())
  @@index([questionId, alias])
  @@index([questionId, teamId])
}

model TeamLevelProgress {
  teamId      String
  roundId     String
  unlockedAt  DateTime
  solvedAt    DateTime?
  highestHint Int      @default(0)
  @@id([teamId, roundId])
}

enum ScoreSource { AUTO ADMIN }

model GameScore {
  // existing: id, alias, eventId, game, points, createdAt
  roundId    String?
  questionId String?
  teamId     String?                     // set for hunt points
  source     ScoreSource @default(AUTO)
  reason     String?
  createdBy  String?                     // admin alias
  @@unique([questionId, alias])          // individual: once per question
  @@unique([roundId, teamId])            // hunt: once per level per team
}

enum VerificationStatus { SUBMITTED APPROVED REJECTED }

model ScoreVerification {
  id            String             @id @default(cuid())
  eventId       String
  alias         String
  hours         Decimal            @db.Decimal(5, 2)
  screenshotKey String
  note          String?
  status        VerificationStatus @default(SUBMITTED)
  rejectReason  String?
  reviewedBy    String?
  reviewedAt    DateTime?
  createdAt     DateTime           @default(now())
  @@unique([eventId, alias])
}

model VolunteerPledge {
  id            String   @id @default(cuid())
  eventId       String
  alias         String
  name          String
  email         String?
  phone         String?
  mode          String                 // ONLINE | OFFLINE | BOTH
  city          String?
  availability  String
  hoursPerMonth String
  interests     String[]
  other         String?
  consent       Boolean
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([eventId, alias])
}
```

**Notes:**
- Postgres treats `NULL`s as distinct in unique constraints, so the `GameScore` uniques only bite on auto-scored rows, while admin adjustments (null `questionId`/`teamId`) can repeat. Admin hunt adjustments should keep `roundId = null` so they don't collide with the level award.
- **Race-safe hunt solve without transactions:** `updateMany({ where: { teamId, roundId, solvedAt: null }, data: { solvedAt: now } })`. Only the request that gets `count === 1` inserts the score and the next level's `TeamLevelProgress`.
- Team join race: insert `TeamMember`, then count members; if > 5, delete your own row and return "team full".

---

## 10. API surface (suggested)

All under `/api/games`. Player routes require the alias cookie; admin routes require `isAdmin` + PIN cookie. Validate every body with **zod** (already a dependency).

**Player**

| Method | Route | Purpose |
|---|---|---|
| POST | `/login` | `{ alias }` → set cookie |
| POST | `/logout` | Clear cookie |
| GET | `/events/:id/state` | **The single poll endpoint:** `serverNow`, rounds with state (no secrets), my attempts and points, my team, team progress, verification status. |
| GET | `/events/:id/leaderboard` | Individual + team boards (cache 5 s at the edge if possible) |
| POST | `/events/:id/teams` | Create team |
| POST | `/teams/:id/members` | Captain adds players / player joins |
| DELETE | `/teams/:id/members/:alias` | Leave / captain removes |
| GET | `/events/:id/available-players` | Players without a team |
| POST | `/questions/:id/answer` | `{ answer }` → `{ correct, points?, attemptsLeft, closeCall? }` |
| POST | `/rounds/:id/hints/:n` | Open a hint (team) → hint text |
| POST | `/events/:id/verification` | Multipart: hours, screenshot, note |
| PUT | `/events/:id/volunteer` | Upsert pledge |

**Admin**

| Method | Route | Purpose |
|---|---|---|
| POST | `/admin/pin` | Verify PIN → admin cookie |
| POST | `/admin/rounds/:id/open` · `/close` · `/extend` | Round control |
| GET | `/admin/events/:id/feed` | Latest attempts |
| POST · PATCH · DELETE | `/admin/scores` | Award / adjust / void |
| POST | `/admin/teams/...` | Create, move, disband, auto-team, lock |
| POST | `/admin/hunt/:teamId/:roundId` | Mark solved / reset / refund hint |
| GET · POST | `/admin/verifications` | Queue, approve, reject; GET screenshot stream |
| GET | `/admin/events/:id/volunteers.csv` | Export |
| POST | `/admin/participants/merge` | Merge aliases |

**Seeding:** `prisma/seed-game-day.ts` (or a JSON file) creates the Wednesday event, 17 rounds, questions, answers and hints. The organizer edits the JSON, not code.

---

## 11. UI notes

- Route: keep the existing `/games/[eventId]`. The game page = sticky header (event title, alias, **timer top-right**, log out) → my team card → 17-section accordion → leaderboards (side column on desktop, tab on mobile).
- Admin console: `/games/[eventId]/admin`. A dense table/grid UI is fine; it doesn't need polish.
- Mobile-friendly for songs, riddles, scribble and the form. Hunt sections say "best on laptop".
- Match the existing site styling (Tailwind, `font-display` headings, orange/blue palette, rounded-2xl cards).
- Accessibility: labels on all inputs, `aria-live` errors, keyboard-only playable, reduced motion respected, colour isn't the only state signal (icons + text).

---

## 12. Non-functional requirements

| Area | Requirement |
|---|---|
| **Scale** | Design for **150 concurrent players**, ~30 teams. |
| **Latency** | Answer submit p95 < 800 ms; state poll p95 < 500 ms. |
| **Polling** | `state` every **10 s** (5 s while a live round is open), paused when the tab is hidden, plus an immediate refresh after any action. Leaderboard every 10 s. |
| **Workers limits** | Keep each handler well under 10 ms CPU; avoid heavy per-request work. Use the Workers Paid plan for event week (see §2). |
| **Security** | No answers or locked content in client bundles or responses; server-side validation; rate limits (answers: 1 per 2 s per player, 1 per 3 s per team for the hunt); admin double-check (flag + PIN); upload type/size checks; private R2. |
| **Fairness** | Server clock only; once-per-question constraints; team lock during the hunt; closed rounds reject. |
| **Privacy** | Collect only the alias by default; contact details only in the volunteer form, with consent; screenshots deleted after 30 days. |
| **Observability** | Workers observability is already enabled. Log every answer attempt (without PII) and every admin action. |
| **Resilience** | If the DB is briefly unavailable, show "Reconnecting…" and retry; never lose a submitted answer silently (show an error and let the user retry). |

---

## 13. Testing and rehearsal

1. **Unit tests:** scoring formula (table in §8), fuzzy matcher (table in §7), hint penalty, tie-break ordering.
2. **Race tests:** two teammates submitting the correct key at the same time results in one score; 6 players joining one team results in 5 members.
3. **Rehearsal on Tuesday 3 Nov** with 6–10 people in 2 teams on the production URL: play all 17 sections end-to-end and time the hunt levels. If a level takes more than 8 min, make it easier or improve its hints.
4. **Load check:** a simple script that simulates 150 clients polling `state` for 5 min; watch Workers CPU and errors.
5. **Content check:** every accepted-answer list tested with 3–4 realistic misspellings.

---

## 14. Event-day runbook (for the host/admin)

1. Before: seed the event, verify the admin PIN works, open the admin console on a second screen, check the R2 upload once.
2. Share the game link and QR in the meeting (`public/games-qr.svg` exists).
3. Players log in → form teams (5 min) → admin presses **Auto-team** for leftovers.
4. Run sections in order: open each live round as the kid starts singing; close it after the window.
5. Opening Hunt L1 **locks teams** and starts the hunt clock.
6. Watch the live feed; manually award obvious near-misses.
7. Approve Benevity screenshots in batches during songs/riddles.
8. End: final reveal of the leaderboard (freeze optional), announce winners (✓ only), remind people about the volunteer form.

**Fallback:** if anything breaks, admin awards points manually from the console. As a last resort, keep a Google Sheet scoreboard and a Google Form for Benevity screenshots.

---

## 15. Priorities (deadline: Wednesday 4 Nov)

**P0 — must ship**
- Alias-only login; remove self-scoring.
- `isAdmin` + PIN; admin open/close rounds; admin award/adjust/void scores.
- Teams: create, add/join, leave, max 5, one team per event, lock at hunt start, auto-team.
- Rounds engine (17 sections from seed data) with Locked / Live / Done / Closed states.
- Answer validation with fuzzy matching; time-decayed server-side scoring.
- Treasure hunt: 5 levels, sequential unlock, 3 hints with penalties, shared team progress.
- Verification gate (submit → unlock L4; admin approve → ✓). The Google Form fallback is acceptable if R2 is late.
- Individual + team leaderboards with ✓.
- Top-right timer with server time sync.
- Inline wrong-answer error; Lottie on correct answer; big winner Lottie on L5.
- Volunteer form + CSV export.

**P1 — should ship**
- "So close" feedback, live attempt feed, hunt progress grid, participant merge, bulk approve, finish bonuses for 2nd/3rd.

**P2 — nice to have**
- Leaderboard freeze/reveal, song-name bonus, SQL-injection simulation and git-history bonus levels, announcements banner, push pledges into `Volunteer`.

---

## 16. Open questions (defaults already assumed above)

| # | Question | Default used |
|---|---|---|
| Q1 | Should hunt points also count toward each member's individual score (or individual points toward the team)? | No, separate boards and prizes. |
| Q2 | Team prize eligibility when some members lack ✓? | The team can still win; only members with ✓ receive the prize. |
| Q3 | Should players be able to join teams themselves, or only be added by a captain? | Both. |
| Q4 | Attempt limit for songs, riddles and scribble? | 3 per question. |
| Q5 | Should the hunt have a hard deadline? | 45 min after L1 opens. |
| Q6 | Section 16: Scribble 2 or Emoji Movie? | Emoji Movie. |
| Q7 | Prizes: how many winners per board? | Top 3 individual, top 1 team (organizer to confirm). |
| Q8 | Should verification block L4 for the whole team or per player? | Per player (each player needs to submit to see/submit L4–L5). |

---

## 17. Definition of done
- All P0 items pass the acceptance notes above on the **production URL**.
- Unit tests for scoring and fuzzy matching pass.
- Tuesday rehearsal completed; content tuned.
- The organizer can run the whole event from the admin console without touching the DB (except granting `isAdmin`).
