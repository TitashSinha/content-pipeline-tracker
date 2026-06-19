# Content Pipeline Tracker

An internal workflow tool for the **Lexiconn** content agency. Admins assign writing
tasks and review them; writers move their work through the pipeline. Every piece of
content flows through four stages and the time spent actually writing (TTW) is tracked
automatically.

```
BRIEF PENDING  →  WRITING  →  REVIEW  →  COMPLETED
```

> It's not a writing tool — the actual writing happens in Google Docs. This app tracks
> the *status and progress* of that work.

---

## Highlights

- **Two roles, two dashboards.** Admins see everything and manage the pipeline; writers
  see only their own assignments.
- **TTW (Time to Write).** The clock runs only while a piece is in `WRITING`, pausing in
  review and resuming on every send-back. Actual time is summed from the activity log.
- **Admin dashboard.** Live stats, a by-stage donut, per-writer workload, plus a
  searchable / filterable / sortable / paginated table with CSV export.
- **Full audit trail.** Every status change is recorded forever, with who, when, and an
  optional note (this is how feedback travels back to the writer).
- **Client management.** Add and rename clients from the UI.
- **Soft, modern UI.** A pastel design system, responsive down to mobile (the table
  collapses into cards).

---

## Tech stack

Deliberately lean — one `npm install` and you're running, no database server to set up.

| Layer | Choice |
|-------|--------|
| Frontend | React 18 + Vite + React Router |
| Styling | One hand-written `index.css` (CSS variables, no framework) |
| Backend | Express |
| Auth | JWT + `bcryptjs` |
| Storage | A small JSON-file datastore (`backend/data/db.json`) |

For an agency-sized dataset (a dozen writers, dozens of articles) a JSON store is plenty
and keeps the data layer fully transparent. The data access is isolated in
`backend/src/db.js`, so swapping in Postgres/Prisma later is a contained change.

---

## Getting started

```bash
# from the project root
npm run install:all     # installs root, backend, and frontend deps

npm run dev             # starts the API (:4000) and the app (:5190) together
```

Then open **http://localhost:5190**. The database self-seeds with demo data on first run.

### Other scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Run API + frontend together (Vite proxies `/api` → `:4000`) |
| `npm run seed` | Wipe and reseed the database with fresh demo data |
| `npm run build` | Build the frontend to `frontend/dist` |
| `npm start` | Run the API in production mode (also serves the built frontend) |

### Demo accounts

All accounts use the password **`Lexiconn@2025`**.

| Role | Email |
|------|-------|
| Admin | `admin@lexiconn.in` |
| Writer | `titash@lexiconn.in` (and nine other writers — see the seed file) |

The login screen has one-click **Admin** / **Writer** buttons to fill these in.

---

## Project structure

```
backend/
  src/
    index.js              Express app + static serving in production
    db.js                 JSON datastore (load / persist / nextId)
    seed.js               Demo data + interval-based activity logs
    auth.js               JWT signing + auth/admin middleware
    ttw.js                TTW interval-summing logic
    routes/               auth, articles, clients, users, articleTypes, dashboard
frontend/
  src/
    api/client.js         Single fetch wrapper (attaches the JWT)
    context/AuthContext   Logged-in user, kept in localStorage
    components/            Layout, StatusBadge, Stepper, Timeline, Donut, Modal, …
    pages/                 Login, ChangePassword, admin/*, writer/*
    lib/                   constants, utils (formatTTW, isOverdue, …), icons
    index.css             The entire design system
docs/
  PRODUCTION_LOG.md       Chronological build log (how this was made)
```

---

## How TTW is calculated

The system walks an article's activity log in order and sums every interval between
*entering* `WRITING` and *leaving* it. Time in `REVIEW` never counts. If a piece is
currently writing, the open interval is counted up to "now" (a live clock).

```
Mon 09:00  enter WRITING
Mon 11:00  → REVIEW            +2h
Tue 14:00  ← WRITING (feedback)
Tue 16:00  → REVIEW            +2h
           → COMPLETED
                       TTW actual = 4h   (the review gap is ignored)
```

See `backend/src/ttw.js`.

---

## Permissions

| Action | Writer | Admin |
|--------|:------:|:-----:|
| See own articles | ✓ | ✓ |
| See all articles | — | ✓ |
| Create / edit / delete article | — | ✓ |
| `BRIEF_PENDING → WRITING` | ✓ | ✓ |
| `WRITING → REVIEW` | ✓ | ✓ |
| `REVIEW → WRITING` (with feedback) | ✓ | ✓ |
| `REVIEW → COMPLETED` | — | ✓ |
| Save Google Doc link | ✓ | ✓ |
| Manage clients / export CSV / view stats | — | ✓ |

---

## Design

Pastel palette, driven by CSS variables in `index.css`:

| Token | Hex |
|-------|-----|
| Primary (sage) | `#657166` |
| Blue | `#99CDD8` |
| Mint | `#DAEBE3` |
| Cream | `#FDE8D3` |
| Peach | `#F3C3B2` |
| Sage accent | `#CFD6C4` |

Font: **Plus Jakarta Sans**. Status badges stay distinct (blue / peach / gold / green)
while keeping the palette cohesive.

---

*Want to make it yours? The archetypes are demo content — change the seed, the clients,
the palette, anything. It's all editable.*
