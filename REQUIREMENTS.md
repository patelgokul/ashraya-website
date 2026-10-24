# Ashraya Website — Requirements Tracker

Live target: https://ashrayaconnect.org · Config: `lib/site.ts` (env overrides in `.env.example`) · Content: `lib/content.ts`

Status: ✅ done · 🟡 placeholder / partial · ⏳ pending · ⏸️ deferred

## P0 — MVP launch

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | Rebrand CBAF → Ashraya (name, logo, favicon, colours) | ✅ | Logo from `ASHRAYA.svg` → `public/icons/` |
| 2 | ASHRAYA 7 verticals (home section + `/verticals`) | ✅ | Content from Ashraya Connect PPT |
| 3 | Projects: Paryavaran Sewa, Shiksha Sarthi, Udyam | ✅ | Static in `lib/content.ts`, no DB needed |
| 4 | About, Vision & Mission (+ Vision 2030), Impact | ✅ | Numbers from PPT |
| 5 | Donate page with bank transfer details | ✅ | Online payments deferred |
| 6 | Contact details configurable via env | 🟡 | Placeholder email/phone (Gokul) |
| 6b | Public name is Ashraya only | ✅ | “Ashraya Vikas Association” stays on the Donate bank details only |
| 6c | India presence map on the homepage | ✅ | 27 locations, 18 cities, 13 states & UTs. “15+ organisations” removed |
| 6d | Team page `/team` | 🟡 | Page is ready. Member names not received yet — add them in `lib/content.ts` → `TEAM` |
| 7 | Domain `ashrayaconnect.org` | 🟡 | Set `NEXT_PUBLIC_SITE_URL`, point DNS to Vercel |
| 8 | Social links | 🟡 | Dummy URLs in config |
| 9 | Office address | 🟡 | Placeholder "Bengaluru, Karnataka, India" |
| 10 | Photos | 🟡 | Reusing existing codebase photos |
| 11 | Production build passes without a database | ✅ | `npm run build` |
| 12 | Deploy to Vercel | ⏳ | |

## P1 — After launch

| # | Item | Status | Notes |
|---|------|--------|-------|
| 13 | Real contact email, phone, address | ⏳ | Update env vars, no code change |
| 14 | Real social media links | ⏳ | Update env vars |
| 15 | Real Ashraya photos (hero, projects, about, gallery) | ⏳ | PPT photos available, ~700px; prefer 1920px |
| 16 | Project details: locations, beneficiaries, metrics | ⏳ | Currently drafted from PPT |
| 17 | Partner logos section (CAF, GlobalGiving, MathWorks, Rotary, Adobe, NVIDIA, Cisco…) | ⏳ | Need permission to display |
| 18 | Real testimonials | ⏳ | CBAF testimonials kept for MVP |
| 19 | Team / leadership section | ⏳ | Names, photos, bios |
| 20 | Link to sister org CBAF | ⏳ | Confirm wording |

## Deferred

| # | Item | Status | Notes |
|---|------|--------|-------|
| 21 | Online payments via Cashfree (bank: HDFC0000983 / 50200115627320) | ⏸️ | Needs Cashfree App ID + Secret; replace Razorpay code |
| 22 | Registration / 80G / 12A / CSR details | ⏸️ | Not shown; 80G claims removed |
| 23 | Database (Postgres) for volunteer, contact, newsletter forms and admin panel | ⏸️ | Forms fail to save until `DATABASE_URL` is set |
| 24 | SMTP for confirmation emails | ⏸️ | |
| 25 | Admin panel credentials and seed data (`prisma/seed.ts` still CBAF) | ⏸️ | |
| 26 | News & Media page | ⏸️ | Removed CBAF news; re-add with Ashraya updates |
