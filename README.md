# LCTC Foundation website

Next.js site for the Lake County Tech Campus Foundation with a built-in admin dashboard and its own small database.

Every public form (donations, aid applications, contact messages, RSVPs, subscribers, alumni sign-ups) is saved on the server, so the admin dashboard sees submissions from any computer. Open pages refresh themselves every few seconds.

**Where the data lives** (`lib/server/db.ts`, picked automatically):
- **Vercel (lctc-2):** the Neon Postgres database `lctc-db`, already connected to the project (`DATABASE_URL`). The site keeps everything in its own table, `lctc_site_store`, one row per environment (`site:production`, `site:preview`), so preview deployments never touch live data. It doesn't use the other tables in that database. Each save checks nobody else saved in between, so simultaneous submissions on different servers are never lost.
- **Local:** a JSON file at `.data/db.json` (change with `DATA_DIR`). Delete it to start over from `lib/seed.ts`. If you pull Vercel env vars into `.env.local`, local dev uses Postgres (`site:development` row) instead; set `LCTC_STORE=file` to keep using the file.
- Upstash Redis / Vercel KV also works (`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) if Postgres isn't set.
- Optional `SESSION_SECRET` signs sign-in cookies; otherwise one is generated and stored in the database.

Passwords are checked on the server and never sent to the browser. Visitors only receive published content; staff receive the lists their role allows (`lib/roles.ts`); members see their own gifts and RSVPs.

## Admin dashboard

Admin → Donations has three views: **Submissions** (one row per checkout, all its gifts and the receipt), **Donors** (everyone who gave, with every donation and receipt) and **Gift lines** (each gift on its own line, for recording checks and offline gifts).


Sign in at `/login`. Demo accounts (password `demo1234` for all):

| Email | Level | Can use |
| --- | --- | --- |
| superadmin@lctc.demo | Super admin | Everything, plus staff accounts and resetting demo data |
| admin@lctc.demo | Admin | All submissions and all content |
| accountant@lctc.demo | Accountant | Dashboard, donations, yearly reports |
| member@lctc.demo | Member | Public account: prefilled RSVPs/donations, `/account` history |

Visitors can also create a member account on `/login`.

Every public form lands in the dashboard: donations, grant applications, contact messages, event RSVPs, event subscribers and alumni sign-ups. Each list has search, filters and CSV export.

Content marked `sample` in `lib/seed.ts` is placeholder text and shows a yellow "Sample" tag on the site until an admin edits or deletes it.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Deploy (Vercel)

Import the GitHub repo in Vercel. It detects Next.js automatically: no settings or environment variables needed. Every push to `main` redeploys.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: hero slideshow, stats, member-school ticker (once schools are added in Settings), student aid, programs, events, donate |
| `/programs` | All programs with category filters |
| `/programs/[slug]` | One page per program, generated from the data |
| `/apply` | Aid application for students or teachers (the first step asks which), plus outside scholarships |

## Editing content

Day-to-day content is edited in the admin dashboard. Starting data is in `lib/seed.ts`; fixed content (hero slides, grant types, photo credits) is in `lib/content.ts`. `sitemap.xml` lists the static pages plus the seeded programs, events and posts.

## Grant applications



- The form checks every field before it can be finished (`lib/application.ts`).
- Students and teachers get different questions (teachers: position, program taught, classroom requests, a supervisor reference).
- Progress saves on the applicant's device, so they can come back later.
- On submit it goes to Admin → Aid applications, and the applicant gets a confirmation number plus a download/print copy.

## Donations

The donate dialog is a **demo checkout**: it accepts any amount (no upper limit) but charges nothing. To take real gifts, point the button at a hosted payment page (Stripe Payment Links, PayPal, Givebutter, etc.) in `components/DonateModal.tsx`; those need no server either.
