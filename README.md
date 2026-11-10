# LCTC Foundation website

Next.js site for the Lake County Tech Campus Foundation, hosted on Vercel, with a built-in admin dashboard backed by **Neon Postgres**.

Everything the dashboard manages (events, RSVPs, blog posts, donations, applications, messages, subscribers, board, alumni, yearly reports, staff accounts, site settings) is stored in the database and shared by every visitor.

## Backend

- **Database:** Neon Postgres (`lctc-db`), added through the Vercel Neon integration and connected to both Vercel projects (`lctc-2` and `lctc-dev`). Vercel sets `DATABASE_URL` automatically.
- **Tables** (`lib/server/db.ts`): `records` (one row per item, the item as JSONB), `settings`, `users`, `sessions`.
- **API** (`app/api`): `/api/data/[collection]` (GET, POST), `/api/data/[collection]/[id]` (PATCH, DELETE), `/api/settings`, `/api/auth/{me,signin,register,signout}`, `/api/admin/reset`.
- **Access rules** are enforced on the server (`lib/server/data.ts`, roles in `lib/roles.ts`): visitors see published content and can only submit the public forms; members see their own gifts and RSVPs; staff see what their role allows. `/admin` redirects anyone who isn't staff.
- **Sign-in:** passwords are hashed with scrypt; the browser gets an httpOnly session cookie (30 days) and the database stores only a hash of it.
- **In the browser**, `lib/store.ts` keeps the same `useData` / `insert` / `update` / `remove` functions, now calling the API. Pages are rendered on the server with the public content already loaded.
- Still kept in the browser on purpose: the giving list (cart) and a grant application in progress.

### Set up a database

```bash
vercel env pull .env.local   # gets DATABASE_URL for local dev
npm run db:setup             # creates the tables and loads the starting content (safe to re-run)
npm run db:setup -- --reset  # wipes content and submissions, reloads the starting content
```

A super admin can also reset from Admin → Settings.

## Recent additions

- **Seasons:** the header shows the season (Nov–Feb: Christmas lights and a Santa hat on the logo; spring flowers from March; summer from June; fall leaves and a squirrel from September), and snow/leaves/petals fall over the top banner of each page for ~30 seconds. A pill above the ⚡ Autofill button switches season. Everything else on the site keeps its normal colours. Code: `components/Seasons.tsx`, `app/seasons.css`.
- **Apply for aid:** the first step asks "student or teacher?" and the questions change to match. Answers are typed (with suggestions), not picked from dropdowns.
- **Admin → Donations:** *Submissions* (one row per checkout with its receipt), *Donors* (everyone who gave, with every donation and receipt) and *Gift lines* (one row per gift; record checks here).
- **Admin → Yearly reports:** "Fill from live data" totals the current school year (July 1 to June 30) from donations and approved applications.
- **Events** are paginated (9 upcoming / 8 past per page). Open pages refresh their data every 10 seconds, so the dashboard shows new submissions without reloading.
- New starting content (extra events) reaches an existing database with `npm run db:setup`, which only adds what's missing.

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

Import the GitHub repo in Vercel and connect the Neon database to the project (Storage tab); that sets `DATABASE_URL`. Run `npm run db:setup` once against a new database. Every push to `main` redeploys.

## Pages

| Route | What it is |
| --- | --- |
| `/` | Home: hero slideshow, stats, member-school ticker (once schools are added in Settings), student aid, programs, events, donate |
| `/programs` | All programs with category filters |
| `/programs/[slug]` | One page per program, generated from the data |
| `/apply` | Aid application for students or teachers (the first step asks which), plus outside scholarships |

## Editing content

Day-to-day content is edited in the admin dashboard. Starting data is in `lib/seed.ts`; fixed content (hero slides, grant types, photo credits) is in `lib/content.ts`. `sitemap.xml` lists the static pages plus the programs, board members, events and posts in the database.

## Grant applications



- The form checks every field before it can be finished (`lib/application.ts`).
- Students and teachers get different questions (teachers: position, program taught, classroom requests, a supervisor reference).
- Progress saves on the applicant's device, so they can come back later.
- On submit it goes to Admin → Aid applications, and the applicant gets a confirmation number plus a download/print copy.

## Donations

The donate page is a **demo checkout**: donors pick from the ten giving opportunities and pay with a test card, and each gift is saved to the database, but no card is charged. To take real gifts, swap the submit handler in `components/DonateCheckout.tsx` for a hosted payment page (Stripe Checkout, PayPal, Givebutter, etc.).

### Admin date filters

Every admin list and the dashboard has a shared date range: All time, Today, Last 7 days, Last month, Last 3 months, Last 6 months, or a custom From/To pair. The selection stays active while navigating admin pages. Dates use America/Chicago and include both boundary days. Month presets select the previous complete calendar month(s); Last 7 days includes today.

Submissions use their submitted/created timestamps. Content without those fields uses the database record's creation timestamp, shown in an Added column. For imported content, this is when the record was added to this database, not its historical publication date. The timestamp is read-only. Invalid ranges show no matches and cannot export records.

Search and status filters combine with the date range. CSV exports match displayed rows. Donor totals and receipt lists include only gifts inside the selected period. `npm test` covers date boundaries, daylight saving time, grouping, and filtered exports.
