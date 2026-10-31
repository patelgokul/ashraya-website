# Community Base Advancement Foundation — Website

> Production-ready NGO platform built with Next.js 15, TypeScript, Tailwind CSS, Prisma, and PostgreSQL.

## Game Day

See [the Game Day runbook](docs/game-day-implementation.md) for the local rehearsal, private content import, database upgrade, host controls, verification fallback, tests, and production release gates.

## 🚀 Quick Start

```bash
# 1. Clone and enter project
git clone <repo-url> cbaf-website
cd cbaf-website

# 2. Copy and configure environment
cp .env.local.example .env.local
# Edit .env.local with your database URL, Razorpay keys, SMTP credentials

# 3. Run setup script (renames folders + installs + seeds DB)
chmod +x setup.sh && ./setup.sh

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🗺️ Routes

### Public
| Route | Description |
|-------|-------------|
| `/` | Home page |
| `/about` | About Us |
| `/vision-mission` | Vision & Mission |
| `/campaigns` | All campaigns with search/filter |
| `/campaigns/[slug]` | Individual campaign + donation |
| `/projects` | All projects |
| `/projects/[slug]` | Individual project detail |
| `/fund-predictor` | AI Fund Predictor tool |
| `/impact` | Impact dashboard |
| `/volunteer` | Volunteer registration |
| `/donate` | Donation page |
| `/contact` | Contact form |
| `/news` | News & media |
| `/gallery` | Photo gallery |
| `/payment-success` | Payment confirmation |
| `/payment-failed` | Payment failure |
| `/privacy-policy` | Privacy Policy |
| `/terms-and-conditions` | Terms & Conditions |
| `/refund-policy` | Cancellation & Refund Policy |
| `/shipping-policy` | Shipping & Delivery Policy |

### Admin (Protected)
| Route | Description |
|-------|-------------|
| `/admin` | Dashboard |
| `/admin/campaigns` | Manage campaigns |
| `/admin/projects` | Manage projects |
| `/admin/donations` | View donations |
| `/admin/volunteers` | View volunteers |
| `/admin/subscribers` | Newsletter subscribers |
| `/admin/analytics` | Analytics dashboard |

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI + custom
- **Animations**: Framer Motion
- **Database**: PostgreSQL (Neon/Supabase/Railway)
- **ORM**: Prisma
- **Auth**: NextAuth.js v4
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Payments**: Razorpay
- **Email**: Nodemailer
- **Deployment**: Vercel

## 🗄️ Database Commands

```bash
npm run db:push     # Push schema to database
npm run db:migrate  # Create migration
npm run db:studio   # Open Prisma Studio
npm run db:seed     # Seed with demo data
```

## 🚢 Deployment (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables — add via Vercel dashboard:
# DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
# RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET,
# NEXT_PUBLIC_RAZORPAY_KEY_ID,
# SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM
```

## 📧 Default Admin Credentials

```
Email:    admin@communityfoundation.in
Password: admin@cbaf2025
```
⚠️ Change password immediately after first login in production.

## 🤖 Future AI Integration

The Fund Predictor is designed to support a FastAPI + Python ML backend.
Set `ML_SERVICE_URL` in `.env.local` to enable it automatically.

See `CBAF_NGO_Complete_Architecture.md` for the full ML integration guide.

## 📞 Contact

**Community Base Advancement Foundation**
📞 +91 85297 16474
✉️ info@communityfoundation.in

---
© 2025 Community Base Advancement Foundation. Built for impact.
