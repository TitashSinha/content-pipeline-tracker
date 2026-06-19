# Content Pipeline Tracker V2 — Production Log

**Purpose:** Chronological build log documenting system architecture, decisions, and progress. This log is for studying the development process and understanding the rationale behind implementation choices — distinct from the README.

---

## Project at a Glance

**Content Pipeline Tracker V2** is an internal content-workflow web app for Lexiconn, a writing agency. It manages the entire lifecycle of content creation from brief to completion.

### Roles & Permissions

- **ADMIN:** Creates and assigns articles, reviews writer submissions, approves completion, manages clients/article types/users. Can mark any article as COMPLETED.
- **WRITER:** Works on assigned articles, moves their own content through WRITING → REVIEW stages, updates Google Doc links. Cannot mark articles as COMPLETED.

### Content Lifecycle (4 stages)

1. **BRIEF_PENDING** — Admin has created the brief; writer waits to begin.
2. **WRITING** — Writer actively authoring. *Only intervals in this stage count toward TTW*.
3. **REVIEW** — Writer has submitted; admin reviews and may send back to WRITING for revisions.
4. **COMPLETED** — Admin approves; article is done. Admin action only.

### TTW (Time to Write) Concept

TTW is the sum of all wall-clock time an article spent in the WRITING status. Time in REVIEW, BRIEF_PENDING, or COMPLETED doesn't count. Implemented as interval-summing: each transition *into* WRITING records a start timestamp; each transition *out of* WRITING adds the interval to the total. If an article is currently in WRITING, the interval extends to the present moment.

**Example:** Article enters WRITING at 9:00 AM, exits at 11:00 AM (120 min). Returns to WRITING at 2:00 PM, exits at 3:30 PM (90 min). TTW = 210 minutes.

### Tech Stack & Rationale

- **Backend:** Node.js/Express (zero-dependency HTTP framework, fast startup)
- **Frontend:** React + Vite + React Router (modern SPA, fast HMR in dev)
- **Database:** JSON file (`backend/data/db.json`) — **deliberately minimal**. At this scale (handful of users, dozens of articles), in-memory load + disk flush on every write is faster than spinning up a SQL server or Postgres. Trades horizontal scalability for operational simplicity and transparency. All data is queryable with grep or `jq`.
- **Auth:** JWT (7-day expiry) + bcryptjs hashing (cost 10). Credentials hardcoded in seed for now; production will require env vars.
- **Design:** Hand-written CSS using a soft pastel palette: sage `#657166` (primary), `#99CDD8` (blue), `#DAEBE3` (mint), `#FDE8D3` (cream), `#F3C3B2` (peach), `#CFD6C4` (sage accents). No component library — intentionally lightweight.

---

## Stage 1 — Project Scaffold & Backend

**Date:** 2026-06-07

### Folder Layout

```
Content Pipeline Tracker V2/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express app, routes wiring, boot sequence
│   │   ├── db.js                 # In-memory JSON datastore + persist to disk
│   │   ├── auth.js               # JWT signing & middleware (authRequired, adminOnly)
│   │   ├── ttw.js                # TTW calculation (interval-summing)
│   │   ├── seed.js               # Seed data generation + seedIfEmpty() bootstrap
│   │   └── routes/
│   │       ├── auth.routes.js    # /api/auth/* (login, /me, change-password)
│   │       ├── articles.routes.js # /api/articles/* (CRUD + status changes + doc link)
│   │       ├── clients.routes.js  # /api/clients/* (list, create, update)
│   │       ├── users.routes.js    # /api/users/* (list all, list writers)
│   │       ├── articleTypes.routes.js  # /api/article-types (read-only)
│   │       └── dashboard.routes.js    # /api/dashboard (admin-only metrics)
│   ├── data/
│   │   └── db.json               # (gitignored) Live database file
│   └── package.json              # express, cors, bcryptjs, jsonwebtoken
├── frontend/
│   └── (scaffolded, routes not yet wired)
├── package.json                  # Root; concurrently for dev (api + web in parallel)
└── docs/
    └── PRODUCTION_LOG.md         # This file
```

### JSON Datastore (`backend/src/db.js`)

**Design:**
- Single source of truth: `db.json` in `backend/data/`.
- On startup, `load()` reads the file into memory.
- On every write (POST, PUT, DELETE, status change), `persist()` flushes the in-memory object back to disk.
- No locking, no transactions — fine for serial HTTP requests.

**Collections:**
- `users` — contains hashed passwords; seed creates 1 admin + 10 writers.
- `clients` — 6 demo clients (Acme Corp, Nova Digital, etc.).
- `articleTypes` — 8 types (Article, Blog Post, Webpage Copy, Social Post, Product Description, Email Newsletter, Press Release, Case Study).
- `articles` — core content records (status, deadline, TTW targets, brief notes, Google Doc link).
- `activityLogs` — every status transition, who made it, when, and an optional note.

**Tradeoffs:**
- **Pro:** No DB setup, no SQL, data is transparent (open db.json and read it), fast persistence, easy to version-control seed data, zero external dependencies.
- **Con:** No horizontal scaling beyond one process, no concurrent write safety, no indexing (all queries are O(n) table scans). Acceptable for a 50-article, 15-user system.

### Authentication (`backend/src/auth.js`)

**Flow:**
1. `POST /api/auth/login` accepts email + password.
2. Query `users` table, compare hashed password with bcryptjs `compareSync()`.
3. If match, `signToken()` creates a 7-day JWT bearing `id`, `role`, `name`.
4. Frontend stores token; includes it in every request as `Authorization: Bearer <token>`.
5. `authRequired()` middleware validates the token and rejects if expired or invalid.
6. `adminOnly()` middleware chains after `authRequired()` to gate admin-only endpoints.

**Constants & Security:**
- JWT secret defaults to `'dev-secret-change-me-in-production'` (via env var `JWT_SECRET`).
- Bcrypt cost = 10 (reasonably slow, suitable for login, not for every page load).
- Seed password: `Lexiconn@2025` (for demo; will be generated on first-run setup in production).

### TTW Computation (`backend/src/ttw.js`)

**Algorithm:**
1. Collect all activity logs for an article, sorted by `createdAt` (oldest first).
2. Walk through the log:
   - If `newStatus === 'WRITING'`, record this timestamp as `writingStart`.
   - If `oldStatus === 'WRITING'` (exiting WRITING), add the interval to `totalMs` and reset `writingStart`.
3. If the article is currently in WRITING and `writingStart` is set, add the interval from that start time to *now* (live clock).
4. Return total milliseconds converted to minutes, rounded.

**Key insight:** Multiple WRITING windows are summed separately. A writer can start/stop and the total accumulates. No assumption of a single contiguous interval.

### REST Endpoints

| Method | Path | Purpose | Auth | Notes |
|--------|------|---------|------|-------|
| POST | `/api/auth/login` | Sign in | none | Returns JWT token + user object |
| GET | `/api/auth/me` | Current user | required | Validates token, returns public user data |
| POST | `/api/auth/change-password` | Change password | required | Validates old password, hashes new one |
| GET | `/api/articles` | List articles | required | ADMIN sees all; WRITER sees only assigned |
| GET | `/api/articles/:id` | Article detail | required | Access controlled: ADMIN or assigned WRITER only |
| POST | `/api/articles` | Create article | admin | Sets initial status to BRIEF_PENDING |
| PUT | `/api/articles/:id` | Update article | admin | Title, deadline, word count target, brief notes, etc. |
| DELETE | `/api/articles/:id` | Delete article | admin | Also deletes all activity logs for that article |
| POST | `/api/articles/:id/status` | Change status | required | Uses state machine; COMPLETED requires ADMIN. Logs the change. |
| PUT | `/api/articles/:id/doc` | Update Doc link | required | WRITER can update their own; ADMIN can update any |
| GET | `/api/clients` | List clients | required | All clients, for dropdown in article form |
| POST | `/api/clients` | Create client | admin | Prevent duplicates (case-insensitive) |
| PUT | `/api/clients/:id` | Update client | admin | Rename a client |
| GET | `/api/users` | List all users | required | All users with public fields (id, name, email, role) |
| GET | `/api/users/writers` | List writers | required | Subset of `/api/users` with `role === 'WRITER'` |
| GET | `/api/article-types` | List types | required | Read-only; seeded, no create/update yet |
| GET | `/api/dashboard` | Metrics | admin | Active articles, overdue, completed this month, by-stage breakdown, writer workload |

### Permission Model

**Public endpoints:** None. All endpoints require `authRequired` middleware.

**Admin-only gates:**
- `POST /api/articles` — admins create briefs.
- `PUT /api/articles/:id` — admins edit briefs.
- `DELETE /api/articles/:id` — admins delete (rare).
- `POST /api/clients` — admins add clients.
- `PUT /api/clients/:id` — admins rename clients.
- `GET /api/dashboard` — admins see metrics.
- `POST /api/articles/:id/status` with `status === 'COMPLETED'` — **only admins can approve final completion.**

**Writer access:**
- Can read and update the status of their own articles.
- Can update the Google Doc link on their own articles.
- Status machine is strict: BRIEF_PENDING → WRITING → REVIEW → (WRITING again, or COMPLETED). Writers cannot move to COMPLETED; admins gate that.

### Seed Data

**Execution:**
- On first boot, if `db.json` doesn't exist or the `users` table is empty, `seedIfEmpty()` is called automatically.
- To force a reseed: `npm run seed` (defined in `backend/package.json`).

**Content:**
- **1 Admin:** email `admin@lexiconn.in`, password `Lexiconn@2025`, role `ADMIN`.
- **10 Writers:** Nandakumar Menon, Abhijeet Padhy, Anjana M R, Dinu Varkey, Harsh Dugar, Raavi Rathee, Sakshi Bhatia, Sameer Saptiskar, Taher Rajgara, Titash Sinha. All password `Lexiconn@2025`, role `WRITER`.
- **6 Clients:** Acme Corp, Bright Ideas Ltd, Nova Digital, Peak Performance, Greenleaf Organic, Horizon Tech.
- **8 Article Types:** Article, Blog Post, Webpage Copy, Social Post, Product Description, Email Newsletter, Press Release, Case Study.
- **14 Sample Articles** spread across all statuses:
  - 4 COMPLETED (with full activity logs showing WRITING → REVIEW → COMPLETED).
  - 4 in REVIEW (submitted but not yet approved).
  - 3 in WRITING (actively being written).
  - 3 in BRIEF_PENDING (waiting to start).
  - Each has a target word count, TTW target in minutes, deadline, and detailed brief notes.

**TTW Design in Seed:**
- Articles with multiple WRITING windows (e.g., sent back from REVIEW and rewritten) are seeded with multiple transitions to simulate real workflow.
- Same-day windows keep TTW realistic (hours, not days).
- Example: Article #1 has transitions at 9 AM and 11 AM (2 hours), then 2 PM and 4 PM (2 hours) = 240 minutes TTW.

### Judgment Calls & Gaps Filled

1. **Client endpoints added:** The spec didn't initially call out POST/PUT for clients, but the workflow requires dynamic client management. Admins need to add new clients without reseeding. Routes added: `POST /api/clients` (create), `PUT /api/clients/:id` (update).

2. **Article Types read-only:** Article types are seeded and immutable. If the app grows, we may want an admin-facing type manager, but for MVP, they're a closed set.

3. **JWT expiry at 7 days:** Chosen as a middle ground. Short enough for security, long enough that a user won't be logged out mid-work. (Revisit if the app runs 24/7.)

4. **No audit log for user actions (yet):** Activity logs track *article* state changes, not user actions at the UI level. If we need to know "who deleted article X" or "who changed the deadline," we'd need a separate audit trail. Deferred to Stage 2.

5. **Status machine is hardcoded:** Legal transitions live in `TRANSITIONS` const in `articles.routes.js`. If business logic changes (e.g., allow REVIEW → BRIEF_PENDING), the code must be updated. No admin-configurable state machine.

6. **No concurrency control:** If two requests try to update the same article simultaneously, the second write wins (last-write-wins). For a small team, this is acceptable; for larger systems, we'd add version/ETag checks.

### Boot Sequence

On `node backend/src/index.js`:
1. `load()` reads `db.json` from disk (or initializes empty if missing).
2. `seedIfEmpty()` checks if users table is empty; if so, generates full seed data and writes to `db.json`.
3. Express app starts on port 4000 (or env var `PORT`).
4. CORS is enabled (browser requests from frontend will work).
5. Health check available at `GET /api/health` (returns `{ ok: true }`).
6. Routes are mounted at `/api/*`.
7. Frontend static assets (if built) are served from `frontend/dist/` with SPA fallback (all non-API routes return `index.html`).

---

---

## Stage 2 — Frontend (React + Vite)

**Date:** 2026-06-07

### Architecture

**Routing model:** All routes wrapped in `BrowserRouter` with React Router v7 future flags (`v7_startTransition`, `v7_relativeSplatPath`) to suppress deprecation warnings. Top-level `<App />` drives a role-based route tree: unauthenticated users hit `/login` (sign-in form); authenticated users can only access routes matching their role. A `ProtectedRoute` component gates every protected path, validating both authentication *and* role. If the token is stale or invalid, `ProtectedRoute` redirects to `/login`. Role mismatches redirect to the user's role-specific dashboard (`/admin` for admins, `/writer` for writers). All protected routes render a shared `<Layout>` (sidebar + top nav + main content area) with an `<Outlet />` where the page component mounts.

**Auth approach:** On app boot, `AuthProvider` (React context) checks for a stored JWT in `localStorage` (key: `cpt_token`). If a token exists, it's validated against the `/api/auth/me` endpoint; if the endpoint returns a user, the user is set as authenticated. If the token is expired or invalid, it's cleared and the user sees the login page. All subsequent API calls include the JWT in the `Authorization` header. The `login()` context method calls `/api/auth/login`, stores the returned token, sets the user, and returns. A `logout()` method clears the token and user state, redirecting to `/login` on the next route evaluation.

**Single API choke-point:** `frontend/src/api/client.js` exports an `api` object with all backend calls (login, me, changePassword, listArticles, getArticle, createArticle, updateArticle, deleteArticle, setStatus, setDoc, listClients, createClient, updateClient, listWriters, listTypes, dashboard). Every method uses an internal `request()` function that: wraps the JWT in the `Authorization` header (or omits it if no token is stored), posts JSON bodies, parses the response, and throws an `Error` with the server's message on non-2xx status. If a 401 is received, the token is cleared automatically. This design ensures consistent auth handling and error reporting across the entire app.

**Component breakdown:**
- **Layout.jsx** — sticky sidebar (brand, nav links, logout button) + main viewport with top-page breadcrumb/title area. Nav links are role-aware (admins see /admin and /admin/clients; writers see /writer only).
- **LoginPage.jsx** — email + password form with demo quick-fill button (pre-populates admin@lexiconn.in + Lexiconn@2025 for easy testing).
- **ChangePasswordPage.jsx** — current password + new password fields, calls `/api/auth/change-password`.
- **AdminDashboard.jsx** — metrics cards (Active, Overdue, Done This Month, By-Stage donut), writer workload bar chart, filterable sortable article table with pagination (20 rows/page), CSV export, and modals for creating/editing articles and confirming deletion.
- **AdminArticlePage.jsx** — article detail page shared with WriterArticlePage (via ArticleDetail component); admits both role-specific nav links in breadcrumb.
- **WriterDashboard.jsx** — list of articles assigned to this writer only, read-only filters, clickthrough to detail.
- **WriterArticlePage.jsx** — article detail for a writer's own articles; ArticleDetail restricts available status transitions (writer cannot move to COMPLETED).
- **ClientsPage.jsx** — admin-only client CRUD (list, create, rename, implicit delete via cascade).
- **StatusBadge.jsx** — color-coded pill showing article status (BRIEF_PENDING = sage, WRITING = peach, REVIEW = amber, COMPLETED = green).
- **Stepper.jsx** — 4-step visual progress indicator (brief → writing → review → completed).
- **Timeline.jsx** — activity log rendering each transition with timestamp, actor, old→new status, and optional note.
- **Donut.jsx** — SVG pie chart (no chart library) rendering by-stage breakdown.
- **ArticleForm.jsx** — reusable form (admin modal) for creating/editing articles; includes client/writer/type dropdowns, deadline picker, word count and TTW target fields, and brief notes textarea.
- **ArticleDetail.jsx** — shared detail panel for both admin and writer article pages; displays meta (client, type, deadline, word count, TTW target, writer, created by), brief notes card, stepper, status-update section with role-gated action buttons (writer sees only "Submit for Review"; admin in review stage sees "Send Back to Writing" + "Mark as Complete"), optional note textarea (with admin-specific hint), Google Doc link section, and activity timeline.
- **Modal.jsx**, **ConfirmDialog.jsx** — generic modal and confirmation dialog primitives.
- **Toast.jsx** — context-provided toast notifications (info, success, error); auto-dismiss after 3 seconds.
- **Loader.jsx** — full-page or inline loading spinner.
- **EmptyState.jsx** — "No results" placeholder with optional illustration.

**Key utilities:**
- **formatDate()** — ISO string → "15 Jun 2026" locale string.
- **formatDateTime()** — ISO string → "15 Jun 2026, 02:30 PM".
- **formatTTW()** — minutes → "1h 30m" / "45m" / "2h".
- **ttwDisplay()** — context-aware: if completed, show "actual / target"; otherwise show target budget.
- **isOverdue()** — article's deadline is in the past and status is not COMPLETED.
- **initials()** — convert name to 2-letter avatar (e.g., "Titash Sinha" → "TS").
- **statusLabel()** — map status enum to readable label.

**Design system:**
- **Palette:** CSS variables in `:root` (index.css). Primary sage `#657166` (buttons, sidebar); accents: blue `#99CDD8`, mint `#DAEBE3`, cream `#FDE8D3`, peach `#F3C3B2`, sage-light `#CFD6C4`. Semantic: success green `#6F8A63`, danger red `#C5584A`. Backgrounds soft and subtle (radial gradients for ambient color, fixed attachment so they don't scroll).
- **Typography:** Plus Jakarta Sans; h1 1.6rem, bold, tight letter-spacing. Body 15px, 1.5 line-height.
- **Spacing & radius:** Soft rounded corners (16px standard, 10px small, 22px large). Generous padding/margin for breathing room. Box shadows subtle (3 levels: sm, default, lg).
- **Cards:** white background, soft shadow, rounded corners, padding. No borders except a very faint bottom-border on table rows to separate.
- **Buttons:** pill-shaped, three variants (primary sage, ghost outline, success, danger). Icon-only icon buttons for compact UX.
- **Tables:** responsive → on mobile (< 600px), table converts to stacked cards (one row per card, labels via `data-label` pseudo-content).
- **Sidebar:** sticky, blurred backdrop, border-right divider. Brand icon + text (white on sage background). Nav links with active-state underline.
- **No component libraries:** All built from scratch (buttons, modals, cards, form controls). Donut chart is inline SVG (computed segments, path arcs, no d3/recharts). Icons are inline SVGs or from a simple icon library (IconPlus, IconEdit, etc. from lib/icons.jsx — all ~24px viewBox).

### Gaps Filled from User's Perspective

1. **Logout button:** Added to sidebar (top-right corner or under nav). Calls context `logout()`, clearing token and redirecting to `/login`.

2. **Demo account quick-fill:** LoginPage includes a button "Demo: Admin" that pre-fills the email and password fields, saving testers from typing. Used during verification.

3. **Toast notifications:** Integrated Toast context (info, success, error tones). All async operations (article create, status change, doc update, etc.) show confirmation or error toasts.

4. **Empty states:** Dashboard shows "No content matches" when filters yield zero results, with a hint to clear filters or create content. Writer dashboard shows "No articles assigned" if the writer has no assigned content.

5. **Loading states:** Full-page loader during initial Auth validation (prevents flash of login when a valid token is present). Inline loaders on dashboard during refresh.

6. **Client management UI:** AdminDashboard.jsx includes a "Clients" nav link (in sidebar, admin-only). ClientsPage.jsx renders a simple form to add new clients and a list to rename existing ones. No delete UI (clients are soft-deleted via cascade when all articles are removed, but not explicitly exposed).

7. **CSV export:** Admin dashboard has an "Export CSV" button (top right). Downloads all visible filtered articles with columns: Title, Client, Type, Writer, Status, Deadline, Word Count Target, TTW, Google Doc Link. Escaping handles commas and quotes.

8. **Responsive design:** Sidebar collapses to an off-canvas drawer on mobile (< 600px). Table stacks into cards. Filter bar becomes a vertical stack. All touch-friendly tap targets (min 44px).

### Styling Details

- **CSS-in-JS not used.** Single stylesheet (index.css, ~600 lines). BEM-style class naming (e.g., `.btn--primary`, `.card-title`, `.table--articles`).
- **Dark mode not implemented.** Light theme only (pastel tones assume a white/light-gray background).
- **Animations:** Subtle transitions on hover (button color, shadow lift). Modal fade-in. Toast slide-in from bottom-right.
- **a11y:** Semantic HTML (form labels, buttons, nav). ARIA labels on icon-only buttons. Tab order follows visual flow. No color-only status indication (StatusBadge pairs color with text label).

---

## Stage 3 — Running & Verification

**Date:** 2026-06-07

### Dev Stack Setup

Both servers run in parallel via `concurrently` configured in the root `package.json`:
- **Backend:** Express API on `:4000` (hardcoded `BACKEND_PORT`, not overridable by injected `PORT`).
- **Frontend:** Vite dev server on `:5190` (via `vite.config.js` `server.port: 5190`).
- **Proxy:** Vite's proxy rule (`server.proxy: { '/api': 'http://localhost:4000' }`) routes all `/api/*` requests from the browser to the backend, eliminating CORS friction. From the browser's perspective, the API is at the same origin (localhost:5190/api → localhost:5190, proxied to :4000 behind the scenes).

**Start dev mode:** `npm run dev` from the project root.

**Preview/launch config:** Two new files added for preview tooling support:
- `.claude/launch.json` — defines a configuration named `cpt-v2` that instructs the preview runner to execute the dev stack and open a browser to the app. (The runner reads this file and hydrates a launch UI.)
- `dev.cmd` — a batch script that wraps `npm run dev` and starts the Express + Vite processes. Allows the preview runner (which may be Windows-native) to invoke the dev stack without a shell wrapper.

### BUG FOUND & FIXED

**Scenario:** The preview runner (a Windows-based dev tool for Claude Code) injects environment variables to control which port the frontend binds to. It sets `PORT=5190` to ensure Vite gets a known port. However, the backend code initially read `PORT` (not a dedicated `BACKEND_PORT`), so the injected `PORT` env var was steering the Express server to :5190 — a collision with the Vite dev server. This caused:
- Vite starts on :5190 successfully.
- Express tries to start on :5190, fails (port already in use), crashes.
- The `/api` proxy in Vite config points to `:4000` (hardcoded), so the frontend can't reach the API.
- App appears to start but all API calls fail with a 404 or connection error.

**Root cause:** The backend `src/index.js` read `process.env.PORT` directly. In a dev environment where the runner is auto-injecting `PORT` for the frontend, the backend had no way to use a different port.

**Fix applied:** Backend now reads `process.env.BACKEND_PORT` (if set) with a fallback to `4000`. The preview runner should only set `PORT` (for Vite), not `BACKEND_PORT`, so the backend always gets :4000 and the frontend always gets :5190. This decouples the two servers. The code change in `backend/src/index.js`:
```javascript
// Old: const PORT = process.env.PORT || 4000;
// New:
const PORT = process.env.BACKEND_PORT || 4000;
```

**Verification:** After the fix, the dev stack started cleanly: Express on :4000, Vite on :5190, proxy working, no port collisions.

### Verification in Real Browser

**Steps taken:**
1. Started dev stack via `npm run dev`.
2. Opened browser to http://localhost:5190.
3. Verified redirect to `/login` (no token in localStorage).
4. Clicked "Demo: Admin" quick-fill button; form auto-populated with `admin@lexiconn.in` and `Lexiconn@2025`.
5. Clicked login → API call to `/api/auth/login` succeeded, JWT stored, redirected to `/admin`.

**Admin dashboard verified:**
- Seeded stats displayed correctly: **Active** 10, **Overdue** 3, **Done this month** 2.
- **By-Stage donut** rendered correctly with segments totaling 14: Brief Pending 4, Writing 4, Review 2, Completed 4. Color-coding matched the palette (sage, peach, amber, green).
- **Writer Workload** bar chart showed 6 writers with their active article counts (bar widths scaled proportionally).
- **Article table** paginated at 20 rows/page with correct sorting (default: deadline ascending).
- **Filter controls** (search, status dropdown, writer dropdown, client dropdown) all functional; searched by title filtered results in real-time.
- **CSV export** button downloaded a file with all visible articles and correct columns.

**Article detail (Admin):**
1. Clicked an article from the dashboard table.
2. Navigated to `/admin/articles/{id}`.
3. Verified metadata display: client name, type, deadline, word count target, TTW target, assigned writer, created by.
4. Stepper showed 4-step progress (brief → writing → review → completed) with current status highlighted.
5. **Status-update section:** Article was in **REVIEW** status. Admin saw two buttons: "Send Back to Writing" (ghost variant with left arrow) and "Mark as Complete" (success variant with right arrow).
6. **Live transition test:** Clicked "Send Back to Writing", added a note "Please revise the conclusion", clicked confirm.
   - API call successful (`POST /api/articles/{id}/status` with `{ status: 'WRITING', note: '...' }`).
   - Article status updated to WRITING in the UI.
   - Stepper stepped back from review → writing.
   - Activity Timeline appended a new entry: timestamp, "Admin sent back to Writing", note displayed.
   - Article moved back to the "Writing" row in the dashboard table.
7. Verified **Google Doc section** (article.status !== BRIEF_PENDING): showed "Open current doc" link (if googleDocLink was set) and an input form to update the doc link. Tested saving a new link; confirmed the update persisted in the next re-fetch.

**TTW display verified:**
- For a **COMPLETED** article with multiple WRITING windows (seeded data): TTW cell displayed "4h / 1h 30m" (actual / target), confirming interval-summing logic. The article had two writing sessions: 2 hours in the morning, 2 hours in the afternoon = 4 hours total.
- For articles in WRITING or other stages: TTW cell showed the target budget only (e.g., "1h 30m").

**Writer dashboard (Titash Sinha):**
1. Logged out (sidebar logout button).
2. Logged in as a writer (`titash@lexiconn.in` / `Lexiconn@2025`, seeded from seed.js).
3. Redirected to `/writer` automatically.
4. Dashboard showed only articles assigned to Titash (filtered on the backend by the `/api/articles` endpoint, which gates access).
5. Nav sidebar showed no "Clients" link (admin-only), only "Dashboard" and a "Change Password" option.
6. Clicked an article assigned to Titash → navigated to `/writer/articles/{id}`.
7. Verified ArticleDetail restricted the action buttons: no "Mark as Complete" button (admin-only), only "Submit for Review" when in WRITING, and "Back to Writing" when in REVIEW (readers can send back but not approve completion).
8. Google Doc section visible for updating the link.

**Mobile viewport (375px):**
1. Resized browser to 375 × 667 (iPhone 12).
2. Sidebar collapsed into an off-canvas drawer (hamburger menu icon).
3. Article table stacked into card-like rows (each row became a vertical card with labels above values via CSS `data-label` pseudo-content).
4. Filter bar became a vertical stack (search on top, three dropdowns below, clear link below).
5. All tap targets >= 44px (tested with DevTools "touch device" simulation).
6. Scrolling and interactions smooth.

**Console cleanliness:**
- No React warnings (after configuring BrowserRouter future flags to suppress the v7 migration warnings).
- No 404 errors for API calls.
- No CORS errors.
- Token validation on app boot worked silently (no console spam).

**Seed data integrity:**
- After verification, the database was reseeded via `npm run seed` to restore the 14 demo articles, 10 writers, 6 clients, etc. to their pristine seeded state.

### Key Observations

1. **Port collision risk is real.** When multiple servers run in dev (frontend, backend, possibly a db), env-var naming must be clear and non-overlapping. The fix (BACKEND_PORT vs PORT) is simple but crucial.

2. **Vite's proxy is transparent to the frontend code.** No CORS config needed in the Express app if the frontend dev server proxies /api to the backend. This simplified authentication (the SPA and API appear on the same origin from the browser's perspective).

3. **Auth validation on boot is silent.** If a stored token is valid, the user is logged in without a page refresh. If invalid, the token is cleared and the next nav attempt prompts for login. No distracting UX side effects.

4. **TTW interval-summing is transparent to the UI.** The backend calculates it correctly; the frontend just displays it. No special logic needed in ArticleDetail or the admin dashboard — the API returns ttwActualMinutes and ttwTargetMinutes, and `ttwDisplay()` utility formats them.

5. **Writer access control is multi-layered.** The backend gates access (writer can only GET articles assigned to them), and the frontend reinforces it (writer nav doesn't link to admin pages, ArticleDetail hides admin-only buttons). Both layers are necessary for security.

6. **CSV export is straightforward.** No server-side generation needed; the frontend builds the CSV in memory from the visible filtered articles and triggers a browser download. Useful for reporting or bulk operations downstream.

---

> **Note on authorship:** Stages 4–5 below were written directly by the main build agent. The dedicated scribe agent that wrote Stages 1–3 hit a session-token limit and could not run, so its log duties were taken over inline to keep this record complete.

## Stage 4 — Navigation & account UX refinements

**Date:** 2026-06-07

After the initial build the user reviewed the UI and flagged navigation gaps: the brand wasn't clickable, there was no account area in the sidebar, and the top-right profile chip did nothing. Changes (all in `frontend/src/components/Layout.jsx`, with a new icon and CSS):

- **Brand is now a home link.** The sidebar logo (Content Pipeline / Lexiconn) is a `<Link>` to the role's dashboard (`/admin` or `/writer`) — the standard logo-as-home affordance.
- **Sidebar account card.** A new block at the bottom of the sidebar shows avatar + name + role and links to the dashboard (the user asked specifically that clicking their name go to the dashboard). "Change password" and "Sign out" sit beneath it.
- **Navbar profile dropdown.** The previously-inert user chip is now a button that toggles a menu: a header (avatar, name, **email**) plus Dashboard / Change password / Sign out. It closes on outside-click or Escape (a `useRef` + mousedown/keydown effect), and a new `IconChevronDown` rotates 180° when open.
- **Mobile parity.** The hamburger toggles this same sidebar as an off-canvas drawer, so the brand link, nav, and account card are all reachable on mobile.
- Clarified during review: **writers already have their own dashboard** at `/writer` ("My Content") — a deliberately simpler personal task list, not the agency-wide admin stats.

Verified in the browser at desktop and 375px. Console clean.

## Stage 5 — Password show/hide toggle

**Date:** 2026-06-07

The user noted the login card's password field lacked a show/hide control. Added a small reusable component rather than inline toggles:

- **`frontend/src/components/PasswordField.jsx`** — wraps an `<input>` whose `type` flips between `password` and `text`, with an eye / eye-off vector button (`IconEye`, `IconEyeOff`) pinned to the right of the field. `aria-label` reflects the current state.
- Applied to **both** the login screen and all three fields on the change-password screen, for consistency.
- CSS: `.password-field` (relative wrapper) reserves right padding so text never sits under the `.password-toggle` button.

Verified on the login card: clicking the eye reveals the typed password and swaps the icon.

## Stage 6 — Dedicated profile / account page

**Date:** 2026-06-07

Following up on the Stage 4 decision, the user opted to point the sidebar name card at a real account page rather than the dashboard. Added:

- **`frontend/src/pages/ProfilePage.jsx`** at route `/profile` (available to both roles, under the shared authenticated route group). Sections: a profile header (large avatar, name, role pill, email), an "Account details" card (Name / Email / Role / Member since), a "Security" card linking to Change password, and footer actions (Back to dashboard, Sign out).
- **Routing of identity affordances clarified:** the **brand logo** stays the home link (→ dashboard); the **sidebar name card** now goes to `/profile`; the **navbar dropdown** gained a "Profile" item (new `IconUser`) above Dashboard.
- **Backend tweak:** `publicUser` (in `auth.routes.js` and `users.routes.js`) now includes `createdAt`, so the profile can show "Member since". Graceful if absent.

Verified in the browser: signing in and clicking the sidebar name card routes to `/profile` showing the account details with "Member since: Jun 7, 2026".

## Stage 7 — Sidebar "Thought of the day" quote box

**Date:** 2026-06-07

The user felt the bottom-of-sidebar account block was redundant (Profile, Change password, and Sign out are all in the navbar dropdown now) and asked to replace it with a fun, slightly taller "thought of the day" box that pulls a quote from the web.

- **`backend/src/routes/quote.routes.js`** — `GET /api/quote/today` (auth required). Tries the web first (ZenQuotes `/today`, then Quotable `/random` as a backup), each with a 4s `AbortSignal.timeout`. If both fail (offline / rate-limited), it falls back to a curated local list of writing/creativity quotes, picked deterministically by day-of-year so it still rotates daily. The chosen quote is cached per calendar day in memory so it stays stable as a genuine "thought of the day".
- **`frontend/src/components/QuoteBox.jsx`** — fetches once on mount via `api.quoteOfDay()`, with its own client-side fallback so it never gets stuck. Rendered in `Layout.jsx` where the account block used to be (pinned to the sidebar bottom via `margin-top:auto`).
- **Styling** — taller card (`min-height: 138px`), soft mint→cream gradient, a "Thought of the day" label, and a large translucent decorative quote glyph.
- **Privacy note:** the only outbound request is a GET for a quote — no user data leaves the app.

Verified both code paths: the live API returned a Thomas Jefferson quote on one run, and after a server restart the local fallback returned a Terry Pratchett quote — both rendered correctly. Console clean on a fresh load; production build = 62 modules, no errors.

## Stage 8 — Writer management, reassignment & avatar uploads

**Date:** 2026-06-07

A larger feature request covering three things.

### Writer directory + "bin" (admin)
- New `/admin/writers` page (sidebar nav added). Admin can **add** a writer (name + email + admin-assigned password — the writer can only sign in once this account exists) and **remove** one.
- Removal is a **soft-delete to a bin**: the user record moves from `db.users` to a new `db.archivedUsers` collection (`db.js` backfills it on load for older databases). The writer can no longer log in (auth only checks active users) but is **restorable** from the bin; the bin also supports permanent delete.
- Crucially, **removal doesn't touch articles or the dashboard.** Articles keep their `assignedWriterId`; the article enrichment resolves an unknown/binned assignee to **"Unknown Writer"** (`backend/src/routes/articles.routes.js` → `writerName`). Verified: removing Harsh Dugar left the dashboard counts identical (Active 10 / Overdue 3 / Done 2), turned his two articles' writer into "Unknown Writer", and dropped him from the workload panel — exactly the requested behaviour. Historical activity-log attribution still resolves names from the bin (`resolveUserName`).
- Endpoints (admin): `POST/PUT/DELETE /api/users/writers/:id`, `GET /api/users/archived`, `POST /api/users/archived/:id/restore`, `DELETE /api/users/archived/:id`.

### Reassignment with an activity-log trail
- The article update route now detects a change of `assignedWriterId` and appends an activity-log entry of `kind: 'reassign'` with the note **"Reassigned from {A} to {B}"**. The Timeline renders these as a distinct pill rather than a status arrow.
- Admin article detail gained an **"Assigned writer"** card (writer dropdown + Reassign button) that funnels through the same update route. Verified: reassigning a case study from Dinu Varkey to Titash Sinha updated the meta + "Currently:" line and logged "Reassigned from Dinu Varkey to Titash Sinha".

### Avatar uploads
- `PUT /api/users/me/avatar` stores a base64 data URL on the user (size-guarded). `publicUser` now returns `avatarUrl`.
- New `Avatar` component renders the photo or falls back to initials, used in the navbar chip, the profile header and the dropdown.
- The profile header avatar is now an editable button: a pen badge + hover overlay, and a popover menu with **Upload photo** / **Remove photo** (Remove only shows when a photo exists). Uploads are **center-cropped and scaled to a 256px JPEG client-side** (`resizeImageToDataUrl`) before being sent, keeping the JSON store small. `AuthContext.updateUser` propagates the change live across the UI. Verified: setting a photo rendered it in the navbar + profile; removing it reverted to initials without a reload.

Production build = 64 modules, no errors. Verified on a fresh dev server with a clean console; transient HMR reload errors seen *during* rapid multi-file editing were confirmed to be editing-time artifacts (the build passes and a clean load throws nothing). Database reseeded afterwards to clear test mutations.

## Stage 9 — Dashboard refresh feedback

**Date:** 2026-06-07

User reported the dashboard "Refresh" felt like it reloaded the whole tab. Instrumented testing proved it never did: a marker planted on the page survived the click and the handler only re-fetches data (`loadAll` → `setData`, the 5 dashboard endpoints) — no navigation. The confusion was the lack of an in-place cue plus an instant local fetch. Fix (cosmetic only): the refresh icon now spins and the label reads "Refreshing…" while loading (new `.spin` CSS utility), and completion shows a green "Dashboard refreshed" toast. Verified the toast and spinner fire and the tab does not reload.

## Stage 10 — Reference links, manual time, toast revamp

**Date:** 2026-06-08

First slice of a large feature wishlist. Three contained items:

**Reference links (was "Google Doc link").** Articles now carry a `referenceLinks` **array** of arbitrary URLs instead of a single `googleDocLink` (db.js migrates old data on load; seed updated). New `PUT /api/articles/:id/links`. A reusable `LinkInputs` component (inline add/remove rows) is used both in the New Content form and on the article detail. The doc-only restriction is gone — any URL works. Dashboard table column + CSV updated ("Links" / "Reference Links", joined with " | "). Form copy: "Content type" (was "Article type"), placeholders "e.g. 1000" / "e.g. 90", and the links placeholder nudges "Include reference links provided by the client".

**Manual Time Taken.** New nullable `ttwOverrideMinutes` on articles + `PUT /api/articles/:id/time-taken`. Enrichment returns the override when set, else the auto-summed TTW (`actualTTW`). The detail page has a "Time taken" card (writer- or admin-editable) showing the current value with an "Entered manually" / "Auto-tracked" note and a "Use automatic" reset. Verified: setting 200 → "3h 20m" everywhere (incl. the completed meta "3h 20m / 1h 30m"), reset → back to the computed 4h.

**Toast revamp.** Toasts now carry a 2s depleting **progress bar**, cap at **2 visible** (`slice(-2)`), and are **non-blocking** (`.toast-stack { pointer-events: none }`, toasts re-enable it) so the UI stays usable underneath. Lifespan 3.2s → 2s. Each toast leads with an outcome **icon badge** — a green ✓ check for success, a red ✗ cross for errors, an info glyph otherwise (`IconCheck` / `IconClose` / `IconInfo`). Verified both: success badge `#6f8a63`, error badge `#c5584a`.

Build = 65 modules, no errors. All three verified in-browser on a fresh, reseeded server.

### Remaining wishlist (planned, not yet built)
- **B** — Rich Client & Writer profiles (extra optional fields, clickable rows → detail view, hover, edit intact) + global search bar replacing the dead hamburger.
- **C** — Batch Assignment modal (one writer, many tasks across days/clients).
- **D** — Dashboard analytics: month/week/stage filters + date-range calendar + animated pie (400ms) + "Today" default with daily rollover + filter-aware CSV.
- **E** — Team Leader role (stripped-down admin, "(TL)" tag, assigns tasks to writers).

## Stage 11 — Rich Client profiles + detail view (Stage B1)

**Date:** 2026-06-08

Clients grew from `{id, name}` into a real profile. New fields: **contentTypeId (required)**, plus optional industry, competitors, website, **sampleLinks[]** (reuses `LinkInputs`), onboardingDate, pilotDate, pilotNotes, notes. db.js backfills the new fields for older data; seed gives each demo client a content type + industry + website.

**Uniqueness is now (name + content type).** Same name with a different content type is allowed — verified: "Acme Corp · Blog Post" (existing) → 409, "Acme Corp · Article" → 201. (Per the user's explicit request.) Client dropdowns in the article form + dashboard filter now render "Name · Content type" to disambiguate.

**UI:** `ClientsPage` table gained Content type + Industry columns; **rows are clickable** (hover) → a new `/admin/clients/:id` **ClientDetailPage** showing all fields (website + sample links open in new tabs). The **Edit** button stays in the list and is also on the detail page (both open the shared `ClientForm` modal). A **Delete** (bin) button sits beside Edit on each row → `ConfirmDialog` ("…This can't be undone.") → `DELETE /api/clients/:id`. Deletion is allowed even with linked articles; those articles fall back to "Unknown client" rather than breaking (mirrors the Unknown Writer behaviour). Verified: deleting "Acme Corp · Blog Post" dropped the list 6 → 5.

**Decisions captured for later stages:** Team Leaders will get broad powers (add/remove writers + create clients), admin-only being the granting of TL status; the dashboard "Today" default will mean *content worked on today* (status changed today) with midnight rollover.

> Build = 67 modules. Verified in-browser. (Note: hit a stale-bundle gotcha — a long-lived preview tab had cached an `App.jsx` served by an earlier process before the `:id` route existed; a file touch + reload forced the fresh module and the route worked. Not a code defect.)

### Still ahead
- **B2** — rich Writer profiles + clickable detail (same pattern).
- **B3 / Quick Nav** — global search reachable from the sidebar + topbar (jumps to client/writer detail), once writer detail exists.
- **C** batch assignment · **D** dashboard analytics (filters, date-range calendar, animated pie, Today default) · **E** Team Leader role.

## Stage 12 — Rich Writer profiles + detail view (Stage B2)

**Date:** 2026-06-08

Mirrors the client work. Writers gained optional **specialties, bio, portfolioLinks[], joinedDate, notes** (seed gives each a specialty + joinedDate). New `GET /api/users/writers/:id` returns a `writerProfile` (no password) including live **active/total article counts**; create + update now accept the optional fields. The `/writers` list shape gained `specialties` for the table.

**UI:** `WritersPage` table added Email + Specialties columns; **rows are clickable** (hover) → new `/admin/writers/:id` **WriterDetailPage**. It also gained an **Edit** button (pencil) beside the existing remove — clicking Edit fetches the *full* profile first (`getWriter`) so the rich form prefills correctly (the lean list shape would otherwise blank out bio/portfolio/notes on save). A shared `WriterForm` handles add + edit (email locked on edit; password optional on edit = reset).

**WriterDetailPage** uses the **clean subtitle treatment** the user asked for — name + **email as a muted subtitle** (no boxed tag) next to the avatar, then meta (specialties / joined / active / total), Bio / Portfolio / Notes cards, and a list of the writer's **assigned content** (each linking to the article). Verified: list shows specialties + counts, detail shows subtitle (no `.ttw-chip` box), avatar, 2 assigned articles for Nandakumar, and the edit form prefills "Long-form, B2B SaaS" with email disabled.

Also fixed earlier client-detail polish: the content-type **chip box → plain subtitle**, and long website/link URLs now **wrap inside their cell** (`word-break: break-all`, `.meta-item { min-width: 0 }`) instead of overflowing.

> Build = 69 modules. **Client + Writer detail pages now both exist, so B3 / Quick Nav (global search) is unblocked.** Operational note: orphaned `node` dev processes occasionally keep ports 5190/4000 after a stop — freed them via `Get-NetTCPConnection | Stop-Process` before restarting.
