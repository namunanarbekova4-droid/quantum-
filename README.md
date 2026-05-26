# Quantum — AI Decision Intelligence Platform

> Where serious people make serious decisions.

Quantum is a premium AI-powered decision intelligence platform for founders, investors, and executives. Submit any high-stakes decision and receive a complete intelligence package: structured report, decision map, AI conversation, and real market data.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Auth:** NextAuth.js (email/password + Google OAuth)
- **Database:** PostgreSQL + Prisma ORM
- **Animations:** Framer Motion + **Charts:** Recharts + **Icons:** Lucide React

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your values
npx prisma generate
npx prisma db push
npm run dev
```

Open http://localhost:3000

## Environment Variables

| Variable | Description |
|----------|-------------|
| DATABASE_URL | PostgreSQL connection string |
| NEXTAUTH_URL | Your app URL (http://localhost:3000) |
| NEXTAUTH_SECRET | Random 32+ char secret |
| GOOGLE_CLIENT_ID | Google OAuth client ID (optional) |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret (optional) |

## Key Pages

| Route | Description |
|-------|-------------|
| / | Landing page |
| /auth/signup | Registration with role selection |
| /auth/signin | Sign in |
| /onboarding | 4-step new user setup |
| /dashboard | Personalized command center |
| /dashboard/decision/[id] | Full decision intelligence package |
| /dashboard/history | All past decisions |
| /dashboard/market | Market intelligence |
| /dashboard/alerts | Intelligence alerts |
| /dashboard/leaderboard | Global leaderboard |
| /dashboard/insights | Weekly reports |
| /dashboard/rooms | Private collaborative rooms |
| /dashboard/settings | Account settings |
| /pricing | Pricing page |
| /premium | Enterprise page |

## Design System

Dark premium: #080808 background · #111111 surfaces · #C9A84C gold accents

## Deployment

```bash
npm run build
npx prisma migrate deploy
```

Deploy to Vercel with all environment variables set.
