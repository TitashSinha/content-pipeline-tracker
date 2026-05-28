# Content Pipeline Tracker

An internal tool for content agencies to manage articles from assignment through to final delivery. Admins assign and track all content. Writers see only their own work and move it through the pipeline.

---

## Running Locally

### What you need before starting

- [Node.js 18+](https://nodejs.org) — check with `node -v`
- [Docker Desktop](https://www.docker.com/products/docker-desktop) — must be running before step 2

---

### Step 1 — Clone the repo

```bash
git clone https://github.com/TitashSinha/content-pipeline-tracker.git
cd content-pipeline-tracker
```

---

### Step 2 — Start the database

This starts a PostgreSQL container locally. Make sure Docker Desktop is open first.

```bash
docker compose up -d
```

You should see `✔ Container content-pipeline-tracker-db-1 Started`. If you see an error, make sure Docker Desktop is running.

---

### Step 3 — Set up the backend

Open a terminal in the project root:

```bash
cd backend
```

Copy the example environment file and open it:

```bash
cp .env.example .env
```

Open `backend/.env` in any text editor. It will look like this:

```
DATABASE_URL="postgresql://pipeline:pipeline_pass@localhost:5432/content_pipeline"
PORT=3001
JWT_SECRET="change-this-to-a-long-random-string"
FRONTEND_URL="http://localhost:5173"
RESEND_API_KEY="re_your_api_key_here"
RESEND_FROM="Content Pipeline <noreply@yourdomain.com>"
```

For local use you only need to change `JWT_SECRET` — set it to any random string (e.g. `mysecretkey123`). Leave everything else as-is. `RESEND_API_KEY` is only needed if you want deadline emails to work locally.

Install dependencies, push the schema, and seed the database:

```bash
npm install
npm run db:push       # Creates all tables in Postgres
npx prisma db seed    # Creates test users, clients, and article types
```

Start the backend:

```bash
npm run dev
```

You should see:
```
Backend running on http://localhost:3001
[deadline-reminder] Job scheduled — runs daily at 08:00
```

---

### Step 4 — Set up the frontend

Open a **second terminal** in the project root:

```bash
cd frontend
```

Copy the example environment file:

```bash
cp .env.example .env
```

The `.env` file already points to `http://localhost:3001` — no changes needed.

Install dependencies and start the dev server:

```bash
npm install
npm run dev
```

You should see:
```
  VITE ready in Xms
  ➜  Local:   http://localhost:5173/
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

### Step 5 — Log in

Use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@lexiconn.in | Lexiconn@2025 |
| Writer | nandakumar@lexiconn.in | Lexiconn@2025 |
| Writer | abhijeet@lexiconn.in | Lexiconn@2025 |
| Writer | anjana@lexiconn.in | Lexiconn@2025 |
| Writer | dinu@lexiconn.in | Lexiconn@2025 |
| Writer | harsh@lexiconn.in | Lexiconn@2025 |
| Writer | raavi@lexiconn.in | Lexiconn@2025 |
| Writer | sakshi@lexiconn.in | Lexiconn@2025 |
| Writer | sameer@lexiconn.in | Lexiconn@2025 |
| Writer | taher@lexiconn.in | Lexiconn@2025 |
| Writer | titash@lexiconn.in | Lexiconn@2025 |

---

### Stopping the app

```bash
# Stop the frontend: Ctrl+C in the frontend terminal
# Stop the backend: Ctrl+C in the backend terminal
# Stop the database:
docker compose down
```

To wipe the database and start fresh:

```bash
docker compose down -v   # -v removes the data volume
docker compose up -d
# Then re-run: npm run db:push and npx prisma db seed
```

---

## User Roles

### Admin
- Create, edit, and delete articles
- Assign articles to writers with a client, type, and deadline
- View the full dashboard — active count, overdue, completions this month, workload per writer
- Filter and search the article list by title, status, or writer
- Export the current view to CSV

### Writer
- See only articles assigned to them
- Move articles forward and backward through the status pipeline
- Add an optional note on each status change
- Submit a Google Doc link when writing begins
- View the full activity history for each article

---

## Status Pipeline

```
Brief Pending → Writing → Review → Revision → Completed
```

Writers can move in both directions at every stage.

---

## Features

- JWT authentication with role-based access control
- Full article CRUD (admin only)
- Status workflow with atomic activity logging (every change recorded with who, when, and an optional note)
- Google Doc link submission per article
- Progress stepper and activity timeline on the article detail page
- Admin dashboard with stat cards, stage breakdown, and writer workload panel
- Overdue detection — articles past deadline are flagged throughout
- CSV export — exports the current filtered view with one click
- Deadline email reminders — daily cron at 08:00 emails writers whose articles are due within 48 hours (via Resend)
- Search and filter by title, status, and assigned writer

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, Prisma 5, PostgreSQL |
| Frontend | React 18, Vite, React Router |
| Auth | JWT (7-day expiry), bcryptjs |
| Email | Resend |
| Scheduler | node-cron |
| Local DB | Docker (postgres:16) |

---

## Folder Structure

```
content-pipeline-tracker/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma           # Database schema
│   │   └── seed.js                 # Seed users, clients, article types
│   ├── src/
│   │   ├── index.js                # Express app entry point
│   │   ├── jobs/
│   │   │   └── deadlineReminder.js # Daily cron job
│   │   ├── lib/
│   │   │   ├── asyncHandler.js
│   │   │   ├── mailer.js           # Resend email helper
│   │   │   └── prisma.js           # Shared Prisma client
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT + role middleware
│   │   └── routes/
│   │       ├── articles.js
│   │       ├── articleTypes.js
│   │       ├── auth.js
│   │       ├── clients.js
│   │       ├── dashboard.js
│   │       └── users.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/client.js           # Fetch wrapper
│   │   ├── components/             # Shared + admin components
│   │   ├── context/                # Auth context
│   │   ├── pages/
│   │   │   ├── admin/              # Admin dashboard
│   │   │   └── writer/             # Writer dashboard + article detail
│   │   └── routes/                 # ProtectedRoute
│   ├── .env.example
│   └── vercel.json
├── docker-compose.yml
├── render.yaml                     # Render deployment config
└── README.md
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required locally | Description |
|----------|-----------------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `PORT` | No | Port to listen on (default: 3001) |
| `JWT_SECRET` | Yes | Any random string locally; use a long secret in production |
| `FRONTEND_URL` | No | Restricts CORS to this origin in production; not needed locally |
| `RESEND_API_KEY` | No | Only needed if you want deadline reminder emails to work |
| `RESEND_FROM` | No | Sender address for reminder emails |

### Frontend (`frontend/.env`)

| Variable | Required locally | Description |
|----------|-----------------|-------------|
| `VITE_API_URL` | No | Backend URL — defaults to `http://localhost:3001` if not set |

---

## Deployment

### Backend → Render
- Connect the GitHub repo as a Web Service
- Set Root Directory to `backend`
- Build Command: `npm install`
- Start Command: `npx prisma db push && node src/index.js`
- Add all backend env vars in the Render dashboard

### Database → Neon
- Create a project at [neon.tech](https://neon.tech)
- Copy the connection string into `DATABASE_URL` on Render
- Prisma handles schema sync automatically on each deploy

### Frontend → Vercel
- Connect the GitHub repo, set Root Directory to `frontend`
- Add `VITE_API_URL` pointing to your Render backend URL
- `vercel.json` handles SPA routing automatically
