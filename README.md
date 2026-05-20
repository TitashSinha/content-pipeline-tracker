# Content Pipeline Tracker

An internal tool for content agencies to manage articles from assignment through to final delivery. Admins assign and track all content. Writers see only their own work and move it through the pipeline.

---

## User Roles

### Admin
- Create, edit, and delete articles
- Assign articles to writers with a client, type, and deadline
- View the full dashboard — active count, overdue, completions this month, workload per writer
- Filter and search the article list by title, status, or writer
- Export the current view to CSV
- Change any article's status at any time

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
│   │   ├── schema.prisma      # Database schema
│   │   └── seed.js            # Seed users, clients, article types
│   ├── src/
│   │   ├── index.js           # Express app entry point
│   │   ├── jobs/
│   │   │   └── deadlineReminder.js  # Daily cron job
│   │   ├── lib/
│   │   │   ├── asyncHandler.js
│   │   │   ├── mailer.js      # Resend email helper
│   │   │   └── prisma.js      # Shared Prisma client
│   │   ├── middleware/
│   │   │   └── auth.js        # JWT + role middleware
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
│   │   ├── api/client.js      # Fetch wrapper
│   │   ├── components/        # Shared + admin components
│   │   ├── context/           # Auth context
│   │   ├── pages/
│   │   │   ├── admin/         # Admin dashboard
│   │   │   └── writer/        # Writer dashboard + article detail
│   │   └── routes/            # ProtectedRoute
│   ├── .env.example
│   └── vercel.json
├── docker-compose.yml
├── render.yaml                # Render deployment config
└── README.md
```

---

## Running Locally

### Prerequisites
- Node.js 18+
- Docker Desktop

### 1. Clone the repo

```bash
git clone https://github.com/TitashSinha/content-pipeline-tracker.git
cd content-pipeline-tracker
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Set up the backend

```bash
cd backend
cp .env.example .env
# Edit .env and fill in JWT_SECRET (anything works locally)
npm install
npm run db:push    # Creates the schema in Postgres
npx prisma db seed # Seeds users, clients, and article types
npm run dev
```

Backend runs on `http://localhost:3001`.

### 4. Set up the frontend

Open a second terminal:

```bash
cd frontend
cp .env.example .env
# .env already points to http://localhost:3001 — no changes needed
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@agency.com | password123 |
| Writer | sarah@agency.com | password123 |
| Writer | james@agency.com | password123 |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `PORT` | Port to listen on (default: 3001) |
| `JWT_SECRET` | Secret for signing JWTs — use a long random string in production |
| `FRONTEND_URL` | Your frontend URL — used to restrict CORS in production |
| `RESEND_API_KEY` | API key from resend.com |
| `RESEND_FROM` | Sender address (e.g. `Content Pipeline <noreply@yourdomain.com>`) |

### Frontend (`frontend/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL (e.g. `https://your-api.onrender.com`) |

---

## Deployment

### Backend → Render
- Connect the GitHub repo as a Web Service
- Set Root Directory to `backend`
- Build Command: `npm install`
- Start Command: `npx prisma db push && node src/index.js`
- Add all backend env vars in the Render dashboard

### Database → Neon
- Create a project at neon.tech
- Copy the connection string into `DATABASE_URL` on Render
- Prisma handles schema sync automatically on each deploy

### Frontend → Vercel
- Connect the GitHub repo, set Root Directory to `frontend`
- Add `VITE_API_URL` pointing to your Render backend URL
- `vercel.json` handles SPA routing automatically
