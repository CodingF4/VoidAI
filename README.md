# VoidAI

A ChatGPT-style AI chat app I built for a hackathon. You can sign in or start as a guest, talk with an assistant named VOID, upload files for the model to look at, and see conversation summaries and topic insights.

I originally built this on Replit with an OpenAI key. This version uses [Google Gemini](https://ai.google.dev/) so the project can run on the free tier as a portfolio demo.

<!-- Add a screenshot of the chat page at docs/screenshot.png, then uncomment the line below.
![VoidAI chat](docs/screenshot.png)
-->

## Features

- Chat with VOID, including recent conversation history
- Guest sign-in, full accounts, and a profile page
- File uploads (images, text, and documents) that the assistant can analyze
- Conversation starters, summaries, and topic connections
- Personalization settings (theme, font size, layout)
- Optional Stripe subscription checkout (Pro / Elite). The app still runs without Stripe; paid plans just stay disabled until keys are added.

## Tech stack

- **Frontend:** TypeScript, React, Vite, Tailwind CSS, Wouter, TanStack Query
- **Backend:** Express, Passport (local sessions)
- **AI:** Google Gemini (`gemini-2.5-flash` by default, via `GEMINI_API_KEY`)
- **Database:** Drizzle schema for Postgres is in the repo. The running app currently stores users, messages, and sessions in memory, so data resets when the server restarts. A [Neon](https://neon.tech/) free Postgres database can be wired up later for a lasting deploy.

## Setup

You need Node.js 20 or later.

```bash
git clone https://github.com/CodingF4/VoidAI.git
cd VoidAI
cp .env.example .env
npm install
```

Add values in `.env`:

- `GEMINI_API_KEY` — create a free key at [Google AI Studio](https://aistudio.google.com/apikey)
- `SESSION_SECRET` — a long random string (for example, `openssl rand -hex 32`)
- `ADMIN_CODE` — a private code used only if you register an admin account

Then start the app:

```bash
npm run dev
```

The server listens on port 5000 (or `PORT` if you set one). Open [http://localhost:5000](http://localhost:5000).

```bash
# production build
npm run build
npm start
```

## Deploying on Vercel Hobby (free)

Use a **personal Vercel Hobby account**, not the paid Wyvew team, so this stays a free portfolio project.

1. Push this repo (or import `CodingF4/VoidAI` from GitHub) into a new Vercel project.
2. Framework preset can stay “Other”. Build command: `npm run build`.
3. Add environment variables in the Vercel project: `GEMINI_API_KEY`, `SESSION_SECRET`, `ADMIN_CODE`.
4. Deploy. This repo includes a `vercel.json` and an `api/` entry that serve the Express app as a serverless function.

**What to know about this setup:**

- Sessions and chat history live in memory, so they reset on a cold start. For a lasting demo, connect a [Neon](https://neon.tech/) free Postgres database (`DATABASE_URL`) and switch `server/storage.ts` from `MemStorage` to Drizzle. The schema in `shared/schema.ts` and `drizzle.config.ts` are already written for that.
- File uploads go to `/tmp` on Vercel and are not kept across requests. That’s fine for a short demo.
- Subscription checkout is optional. If you want it, add `STRIPE_SECRET_KEY`, `STRIPE_PRICE_PRO`, and `STRIPE_PRICE_ELITE`.
- If the serverless deploy is awkward (timeouts or missing static files), the same `npm run build && npm start` app also runs on any small Node host. The Vercel path is there so a free public demo is possible.

## Project origin

Built for a hackathon as a personal Gen AI project. Recovered from the public GitHub copy after the original Replit project was deleted. Anything changed on Replit after the last GitHub push (April 2025) is not in this repo.
