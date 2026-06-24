# PROJECT_CONTEXT.md

# Content Pipeline Tracker

> Single source of truth for the project's evolution, architecture, and roadmap.
> A new contributor (human or AI) should be able to read this one file and answer:
> **Where are we, why did we make these decisions, and what's next?**
>
> **Versioning note:** the repo folder and `package.json` are still labelled `v2.0.0`.
> In this document, **"V3"** denotes the current *premium-SaaS development cycle*
> (the 9-phase roadmap below). A package version bump is pending housekeeping.

---

# Vision

Content Pipeline Tracker is a premium, SaaS-grade content operations platform built for
**Lexiconn**, a content agency. It streamlines the entire content lifecycle — planning,
assignment, writing, time-to-write tracking, review, and (soon) analytics and reporting —
through a calm, intuitive, enterprise-grade interface.

The long-term vision is a tool that no longer feels like an internal utility but like a
polished commercial product: fast, trustworthy, and obvious to use from the login screen
onward. Three roles share one workspace — **Admins** run the operation, **Team Leaders**
manage their teams, and **Writers** focus on the work assigned to them.

---

# Product Goals

The final application should feel comparable to software built by:

- Microsoft
- Meta
- Linear
- Notion
- ClickUp
- Asana
- Raycast

The application should always feel:

- Premium
- Modern
- Minimal
- Polished
- Fast
- Intuitive
- Responsive
- Fluid

---

# Evolution

## V1 — MVP

The original internal tracker.

- Basic authentication
- CRUD for articles
- Writer assignment
- Client management

---

## V2 — Complete Rewrite (current foundation)

The app as it exists today was a ground-up rewrite that introduced the real product shape.

- Role-based access: **Admin / Team Leader / Writer**
- Admin, Team Leader, and Writer dashboards
- Command palette (⌘K) + global search across articles / writers / clients
- Status workflow with an activity **timeline** and **TTW (time-to-write)** tracking
- Batch assignment, date-range filters, toast notifications
- Client, writer, and content-type management; writer bin/restore; avatars

---

## V3 — Premium SaaS Transformation (active)

**Objective:** transform V2 into a production-quality, enterprise-grade SaaS application
through a structured, 9-phase roadmap. Treat every change as if it ships to paying
enterprise customers.

**Status:** Foundation + Phases 1–7 complete. Phase 8 is next.

---

# Roadmap

## Foundation

- Workflow centralization (single source of truth per side)
- Shared dashboard architecture (Admin/TL deduplicated)
- Repository cleanup / dead-code removal

**Status:** ✅ Complete

---

## Phase 1 — Everyday Productivity

- Saved Views
- Bulk Actions
- Sticky Table Header
- Keyboard Shortcuts
- Remember User State
- Better Empty States
- Unsaved Changes Detection

**Status:** ✅ Complete

---

## Phase 2 — Content Workflow

- [x] Draft status (opt-in; hidden from writers until briefed)
- [x] Reopen completed articles (Completed → Reopened, logged)
- [x] Article templates (reusable briefs + management page)
- [x] Client defaults (preferred writer / word count / TTW / template)
- [x] Auto-filled assignment form (client select fills blanks; bundled Phase 6.6)
- [x] Duplicate detection (similar title, advisory)
- [x] Smart deadline warnings (due soon / writer overloaded / TTW exceeds time)

**Status:** ✅ Complete

---

## Phase 3 — Writer Experience

- [x] Personal metrics (active, completed this week, avg TTW, on-time rate)
- [x] Today's Focus (top-3 actionable, priority-ranked)
- [x] Resume writing session (pause/resume; stops the TTW clock)
- [x] Private writer notes (assignee-only scratchpad)
- [x] Submission checklist (advisory pre-Review reminders)
- [x] Estimated remaining work (sum of TTW targets across actionable pieces)

**Status:** ✅ Complete

---

## Phase 4 — Team Leader Workspace

- [x] Writer capacity (active/headroom/overdue per writer, color-coded)
- [x] Smart assignment panel (suggest writers by client pref / specialty / load)
- [x] Risk detection (overdue, due-soon, tight TTW, stalled, overloaded assignee)
- [x] Bottleneck dashboard (per-stage count + avg time-in-stage)
- [x] Longest-waiting (active pieces by time in current stage)
- [x] Availability timeline (per-writer pieces-due across the next 7 days)

**Status:** ✅ Complete

---

## Phase 5 — Analytics & Reporting

- [x] Client health (volume, on-time rate, avg turnaround, avg TTW)
- [x] Writer trends (throughput, this-month vs last-month, avg TTW, on-time)
- [x] Content velocity (completed per week, last 8 weeks)
- [x] Workload forecast (active pieces due per day, next 14 days)
- [x] SLA tracking (time-in-stage vs stall limits, per stage + overall)
- [x] Exportable reports (print stylesheet + `window.print()`)

**Status:** ✅ Complete

---

## Phase 6 — Smart Automation

- [x] Assignment suggestions (shipped Phase 4 — `suggestWriters` chips in `ArticleForm`)
- [x] Auto-filled form (shipped Phase 2 — client defaults + templates)
- [x] Deadline recommendations (advisory "Suggest" in `ArticleForm`)
- [x] Quick-duplicate (clone any piece into a prefilled create form)
- [x] Recurring content (cadence rules + on-request sweep + management page)
- [x] Workflow suggestions (Smart Suggestions panel on the Admin dashboard)

**Status:** ✅ Complete

---

## Phase 7 — Collaboration

- [x] Notifications center (generated-on-write; topbar bell + unread badge + panel)
- [x] Threaded comments (one level of replies; edit/delete; notifies the audience)
- [x] Follow / watch (opt into an article's updates; followers join the notify audience)
- [x] Org activity feed + Audit log (one filterable Admin/TL stream)
- [x] Advanced search (faceted full-text over the role-scoped article list)

**Status:** ✅ Complete

---

## Phase 8 — Premium UI Redesign

**Status:** 🔄 In progress

- [x] **Semantic colour-token system** — new enterprise navy palette applied app-wide
      (from the login screen out), all hardcoded hex consolidated into `--color-*` tokens
- [x] **Dark / light / system themes** — `:root[data-theme="dark"]` token override + a
      Light/Dark/Auto switcher; no-flash inline script; "Auto" follows the OS
- [ ] Migrate styling to **Tailwind CSS** (incremental, alongside `index.css`)
- [ ] Reusable UI primitives (**Tailwind UI**, optionally **shadcn/ui**)
- [ ] Retire legacy `index.css` gradually as components migrate

---

## Phase 9 — Motion & Micro-interactions

**Status:** ⬜ Planned

**Notes:**

- **Motion** (formerly Framer Motion)
- Dashboard load animations, chart draw-in, counters
- Premium tactile hover / press interactions
- Skeleton loading, reusable animation variants, reduced-motion support

---

# Current Status

| | |
|---|---|
| **Current Version** | V3 (premium cycle) — package still `2.0.0` |
| **Current Phase** | Phase 8 — Premium UI Redesign (in progress: colour system + dark mode done) |
| **Overall Progress** | ~80% (Foundation + Phases 1–7 + Phase 8 colour system & theming) |
| **Build Status** | ✅ Passing (`vite build`, 1041 modules) |
| **Last Updated** | 2026-06-21 |

**Design tokens (Phase 8):** the app is themed entirely through CSS variables in
`frontend/src/index.css` `:root`. Architecture: **base palette** (`--c-navy-900` … `--c-powder-200`,
the seven brand hues + cool-neutral tints) → **semantic tokens** (`--color-primary`,
`--color-primary-hover`, `--color-secondary`, `--color-info`, `--color-success`,
`--color-interactive`, `--color-surface`, `--color-border`, `--color-text-primary/secondary`, plus
`*-soft`/`*-strong` variants) → **legacy aliases** (`--primary`, `--muted`, `--surface`, …) that
bridge the old names so components reskin without per-file edits. **Use the semantic `--color-*`
tokens; never hardcode hex.** Warning (amber `--color-warning`) and danger (red `--color-danger`)
are deliberately outside the brand palette. Status stage colours are the one exception — hex in
`lib/workflow.js` `STATUS_COLORS` (consumed as inline SVG fills).

---

# Major Architecture Decisions

Only decisions that affect future development.

- **Workflow centralized into `workflow.js`** — one per side (`backend/src/workflow.js`,
  `frontend/src/lib/workflow.js`). Statuses, transitions, labels, colors, and role-aware
  actions live in one place. The two files are mirrored **by hand** across the FE/BE
  boundary (separate Vercel/Render deploys, no shared package). **Add new statuses only here.**
- **Shared dashboard architecture** — Admin and TL dashboards are thin compositions over
  `components/content/*` (`DashboardStats`, `ContentViewBar`/`ContentFilterBar`,
  `ContentTable`, `BulkActionsBar`) + the `useContentList` hook (filters, sort, pagination,
  derived stats). Build dashboard/table features here, not per-page.
- **Dual-persistence of view state** — `useContentList` mirrors filter/sort/range to the
  **URL** (shareable + Back button) *and* **localStorage** (remembered across navigation).
- **Single storage abstraction** — all `localStorage` goes through `lib/storage.js`
  (`readJson`/`writeJson`). (Exception: the raw auth token in `api/client.js`.)
- **Data router** — `createBrowserRouter` + `RouterProvider` (adopted in Phase 1) so dirty
  forms can block in-app navigation (incl. the Back button) via React Router's `useBlocker`.
  `ProtectedRoute` is a layout route doing role-gating; providers wrap `RouterProvider`.
- **Component-first, hook-driven** — reusable hooks in `hooks/`; no one-off abstractions.
- **No icon library** — inline SVG in `lib/icons.jsx` keeps the bundle small.
- **Backend shared mutators** — `applyDeadline` / `applyReassign` / `applyStatus` in
  `articles.routes.js` are reused by both the single-item and bulk endpoints.
- **Templates as a first-class entity** — `templates` collection + `templates.routes.js`
  (GET open so the picker works; writes Admin/TL). Clients reference one as `defaultTemplateId`;
  deleting a template clears that reference.
- **Auto-fill is shared + non-destructive** — `applyTemplateTo` / `fillFromClient` pure helpers in
  `ArticleForm` fill *blanks only* (client select, preset client, client's default template); an
  explicit template pick overwrites. Duplicate detection (`findSimilarArticles` in `utils.js`) and
  the deadline/overload/TTW warnings are advisory in `ArticleForm` — fed by the dashboard's
  `articles` list, never blocking submit.
- **`isActive(status)`** (in `workflow.js`) is the canonical "in the live pipeline" check
  (excludes Draft + Completed) — use it instead of `!== 'COMPLETED'`.
- **Pause/resume as activity-log brackets** (Phase 3) — a paused writing session does *not*
  add a status; it logs `{ kind: 'pause' | 'resume' }` entries that `computeTTWMinutes`
  treats exactly like leaving/entering WRITING. TTW stays a pure function of the activity
  log (no separate timer). `article.pausedAt` is just the UI flag + the "skip the live
  clock" signal; leaving WRITING clears it. Pause/resume only legal while in WRITING.
- **Private writer notes are assignee-gated at the API** (Phase 3) — `writerNotes` is a
  single per-article field, **stripped from all list payloads** and only added to the detail
  payload (with an `isMine` flag) when the requester is the assignee. Writes require
  `assignedWriterId === req.user.id` (admins/TLs can't read or write it). Reassignment hands
  the note to the new assignee — accepted.
- **Personal metrics live behind `GET /api/dashboard/me`** (Phase 3, any authenticated role)
  because they need the activity log (completion times, avg TTW, on-time rate) that the
  article list doesn't carry. Today's Focus + remaining-work estimate are computed *frontend*
  from the already-loaded list (reactive, no extra round trip).
- **Submission checklist is advisory, never a gate** (Phase 3) — auto items reflect article
  state; manual items are ephemeral self-certified ticks (local state, not persisted). Submit
  stays enabled regardless, matching the duplicate/deadline-warning philosophy from Phase 2.
- **Shared `lib/risk.js`** (Phase 4) — one home for capacity/risk/assignment math:
  `WRITER_CAPACITY` (single source — `ArticleForm`'s overload warning now imports `isOverloaded`
  from here), `assessRisks`/`articlesAtRisk`, `longestWaiting`, `bottlenecks`, `capacityState`,
  `suggestWriters`. Pure functions over the article + writer lists, advisory only. The TL Team
  page and the assignment form both consume it — no duplicated thresholds.
- **`statusSince` on every article** (Phase 4, in `enrichList`) — the timestamp a piece entered
  its current status (latest transition log into it, else `createdAt`; pause/resume logs are
  skipped via the `oldStatus !== newStatus` guard). Powers all time-in-stage analytics
  (stalled risk, longest-waiting, bottleneck avg wait) **frontend** from the loaded list.
- **`GET /api/dashboard` is now `teamLeaderOrAdminOnly`** (Phase 4) — it was `adminOnly`, but
  `TLDashboard` already called it, so the TL dashboard was silently broken (the seed has no TL,
  so it was never exercised). Relaxing the guard fixed that *and* enabled the Team workspace.
  `workload` entries gained a per-writer `overdue` count. **Chosen over a parallel `/team`
  endpoint** — the TL Team page itself needs no new endpoint; it derives everything frontend
  from `listArticles` + `listWriters` via `lib/risk.js`.
- **Team workspace is its own page** (Phase 4) — `/tl/team` (`TLTeam.jsx`) + a TL nav item,
  not bolted onto the content-board `TLDashboard`. Keeps each surface focused (board vs. team
  analytics). Smart-assignment suggestions live in `ArticleForm` (where you assign), shown to
  both Admin and TL since they share that form.
- **Analytics = historical (server) + snapshot (client)** (Phase 5) — `GET /api/analytics`
  (`analytics.routes.js`, **admin-only**) owns what needs the activity log: content velocity
  over time, per-client health (on-time, turnaround, TTW), per-writer throughput trends. The
  *current-snapshot* views — workload forecast (deadlines per day) and SLA / time-in-stage —
  are derived **frontend** from the article list via `lib/risk.js` (`slaSummary` reuses the
  same `STALL_LIMITS` as the "stalled" risk). Same split as Phases 3–4. The Analytics page is
  Admin-only (`/admin/analytics`); the endpoint guard matches.
- **Reports via print-CSS, no PDF dependency** (Phase 5) — "Print / Export" calls
  `window.print()`; a global `@media print` block in `index.css` drops the app chrome
  (sidebar/topbar/buttons) and lays cards out flat with `break-inside: avoid`. Zero deps,
  on-brand, and the browser's "Save as PDF" covers the PDF case. A client-side PDF lib was
  deliberately *not* added (keeps the bundle lean; consistent with the no-icon-library call).
- **Recurring content spawns via an on-request sweep, not a scheduler** (Phase 6) —
  `recurrence.js`'s `sweepRecurrences()` runs on boot and at the top of `GET /api/articles` +
  `GET /api/recurrences`. No cron/background job (the JSON datastore + Render's ephemeral disk /
  cold starts make a real scheduler fragile). **Catch-up policy: at most one spawn per due
  recurrence per sweep**, then `nextRunAt` jumps to the next future slot — an idle series yields
  one fresh task, never a backlog flood. Spawned pieces carry `recurrenceId` (provenance) and a
  date-stamped title. When the Postgres migration lands, swap the sweep for a real scheduled job.
- **Quick-duplicate reuses the create flow** (Phase 6) — `articleDuplicateSeed(a)` (in `utils.js`)
  returns an id-less clone (title "(copy)", deadline cleared); passing it to `ArticleForm` opens it
  in *create* mode (`editing = !!article?.id`). No new endpoint, no duplicate-specific UI.
- **Deadline recommendation is advisory** (Phase 6) — `recommendDeadline` in `lib/risk.js`
  (TTW target ÷ ~4 focused hrs/day + buffer, stretched for an overloaded assignee). A "Suggest"
  button fills the field; never auto-applied, never blocks — same philosophy as the Phase 2 warnings.
- **Notifications are generated-on-write** (Phase 7) — created at the mutation choke points
  (`notify.js`, called from `applyStatus`/`applyReassign`, the comments route, the recurrence
  spawn) rather than derived on read, so per-user unread state is real and O(1) to read. The
  notify **audience** of an article = its assignee + followers, minus the actor (you're never
  notified of your own action). Messages store only the event phrase; the GET route resolves the
  *current* article title + actor so nothing goes stale.
- **Comments are a separate collection, not activity logs** (Phase 7) — comments are
  editable/deletable; activity-log entries are immutable history. One level of threading
  (`parentId` → a top-level comment); deleting a parent cascades its replies. The **Activity
  page merges both** (`activity.routes.js`) into one filterable feed = the org feed *and* the
  audit log (filters by kind/actor/title). Admin/TL only.
- **Follow/watch + collaboration access reuse the article visibility rule** (Phase 7) — comments
  and follows inherit `canAccessArticle` (admins/TLs all; a writer only their own non-draft).
  `enrichDetail` exposes `isFollowing` + `followerCount` to the viewer.
- **Advanced search is frontend-only** (Phase 7) — `/search` filters the already-role-scoped
  `listArticles` payload (which carries `briefNotes`), so visibility is enforced by the existing
  list endpoint and there's no new search backend. Reachable from the command palette.

---

# Current Tech Stack

| Layer | Choice |
|---|---|
| **Frontend** | React 18 + Vite 5, `react-router-dom` v6 (data router) |
| **Backend** | Node.js + Express 4 (ESM) |
| **Database** | JSON file datastore (`backend/data/db.json`) — in-memory + flush-to-disk. *Temporary; PostgreSQL planned (~after Phase 6).* |
| **Authentication** | JWT (`jsonwebtoken`) + `bcryptjs`; 7-day tokens |
| **Styling** | Hand-written CSS (`frontend/src/index.css`) with CSS-variable design tokens. *Tailwind planned Phase 8.* |
| **Animation** | None yet (a few CSS transitions). *Motion planned Phase 9.* |
| **Other** | `react-day-picker` (custom date filtering) |
| **Deployment** | Vercel (frontend) + Render (backend). `VITE_API_URL` **must** end in `/api`; Render free tier cold-starts (~20–30s) and has an ephemeral disk. |

**Local dev:** `npm run dev` (root) runs API on `:4000` + Vite on `:5190` (proxy `/api`→4000).
**Demo / seed login:** `admin@lexiconn.in` / `Lexiconn@2025` (all seeded accounts share this password).

---

# Current Features

**Authentication & Roles**
- [x] Email/password login, JWT sessions, change password
- [x] Role-based access + redirects: Admin, Team Leader, Writer

**Clients**
- [x] CRUD, content-type association, detail pages
- [x] Duplicate detection (name + content type)

**Articles / Content**
- [x] CRUD + assignment; reference links, brief notes, word-count & TTW targets
- [x] Status workflow: Draft → Brief Pending → Writing → Review → Completed, + Reopened (server-enforced)
- [x] Draft (opt-in, hidden from writers) + Reopen completed (logged)
- [x] TTW tracking (auto from activity log + manual override)
- [x] Activity timeline (status changes, reassignments, deadline changes)
- [x] Article templates (reusable briefs) + apply-on-create picker
- [x] Client defaults → auto-filled assignment form (non-destructive)
- [x] Duplicate detection + smart deadline / workload warnings (advisory)
- [x] Pause/resume writing session (stops the TTW clock; logged)
- [x] Private writer notes (assignee-only) + pre-Review submission checklist (advisory)

**Writer Experience**
- [x] Personal metrics (active, completed this week, avg TTW, on-time rate)
- [x] Today's Focus (top-3 actionable, priority-ranked) + estimated remaining work

**Team Leader Workspace** (`/tl/team`)
- [x] Writer capacity (headroom / overdue / load, color-coded)
- [x] Risk detection (overdue, due-soon, tight TTW, stalled, overloaded assignee)
- [x] Bottlenecks (per-stage count + avg time-in-stage) + longest-waiting
- [x] Availability timeline (pieces due per writer across the next 7 days)
- [x] Smart assignment suggestions in the assignment form

**Analytics & Reporting** (`/admin/analytics`, Admin)
- [x] KPIs + content velocity (8-week) + workload forecast (14-day) charts
- [x] SLA / time-in-stage tracking (per stage + overall within-rate)
- [x] Client health + writer-trends tables (on-time, turnaround, TTW, MoM trend)
- [x] Printable / exportable report (`window.print()` + print stylesheet)

**Smart Automation**
- [x] Recurring content (`/admin/recurring`) — cadence rules auto-spawn briefed pieces
- [x] Quick-duplicate any piece into a prefilled create form
- [x] Deadline recommendations ("Suggest") + assignment suggestions in the form
- [x] Workflow suggestions panel (drafts→brief, review backlog, recurring due)

**Collaboration**
- [x] Notifications center (topbar bell, unread badge, mark-read) — assigned / status / comment
- [x] Threaded comments (replies, edit/delete) on every article
- [x] Follow / watch a piece to get its updates
- [x] Activity feed + audit log (`/admin/activity`) — filterable unified stream
- [x] Advanced search (`/search`) — faceted full-text, from the command palette

**Dashboard & Productivity**
- [x] Stats, by-stage donut, writer workload
- [x] Date-range filters + custom date picker
- [x] Saved Views (built-in: Review Queue, Overdue + user-saved)
- [x] Remember state (filters, sort, pagination, range, sidebar)
- [x] Sticky table header
- [x] Bulk actions (reassign / deadline / status / export selected)
- [x] Keyboard shortcuts (⌘K, ⌘N, ⌘⇧B, ⌘/, ?, Esc) + command palette
- [x] Global search; CSV export; unsaved-changes protection; collapsible sidebar

**Management**
- [x] Content-type management
- [x] Template management (Admin → Templates)
- [x] Client management with per-client defaults
- [x] Writer profiles + bin/restore; avatars
- [x] Toast notifications

---

# Known Technical Debt

Intentional, time-boxed debt — not accidents.

- **JSON file datastore** — fine for current scale. Render's disk is **ephemeral** (data resets on
  redeploy/cold start), which would matter in production — **but the owner has confirmed this is a
  demo only, not production (decided 2026-06-21), so the JSON store stays and PostgreSQL is NOT being
  pursued.** Don't re-raise the migration unless the project goes to production. The data layer is
  abstracted behind `getDB()` / `persist()` / `nextId()`, so a future migration stays contained if
  that day comes (full relational = rewrite routes to async SQL; or a minimal "durable blob" swap of
  `persist`/`load`). **Do not migrate until explicitly asked.**
- **Workflow mirrored by hand** across the two `workflow.js` files (no shared package because
  FE/BE deploy separately). Keep them in sync.
- **No automated tests** yet — a Vitest foundation around the workflow state machine is the
  recommended first addition when test coverage becomes a priority.
- **Security hardening pending** — CORS is fully open; `JWT_SECRET` falls back to a dev
  default if unset (must be set in Render env).

---

# Next Phase

## Phase 8 — Premium UI Redesign

The first of the two "polish" phases. From the roadmap notes:

- Migrate styling to **Tailwind CSS** (currently one hand-written `index.css` with CSS-variable tokens).
- Reusable UI primitives + design tokens (**Tailwind UI**, optionally **shadcn/ui**).
- Dark / light / system themes.
- Retire the legacy `index.css` **gradually** as components migrate.

**Where it lands:** cross-cutting — it touches the styling of every component, but **not** the data
layer or business logic (so it doesn't affect the JSON-vs-Postgres question at all). The existing
CSS-variable design tokens in `index.css` (`--bg`, `--surface`, `--primary`, the pastel accents,
radii, shadows) are the natural seed for a Tailwind theme + dark-mode variables.

**Open design calls for Phase 8 (decide at start):** big-bang Tailwind migration vs. incremental
(run Tailwind alongside the existing `index.css`, migrate component-by-component, delete CSS as you
go — far safer given no tests). shadcn/ui (copy-in components, more deps + a build step) vs. plain
Tailwind + a few hand-rolled primitives (lighter, matches the "no icon library" minimalism). Dark
mode via a `class` strategy + a token layer so the pastel palette has dark equivalents. **Caution:**
this is the riskiest phase to do without tests — it rewrites the look of working screens; verify each
surface in the preview as you migrate, and keep diffs reviewable.

**Then Phase 9 — Motion & Micro-interactions** (Motion / framer-motion: load animations, chart
draw-in, counters, tactile hover/press, skeletons, reduced-motion support) closes out the roadmap.

---

# Handover Notes

**Working agreement (approved by the project owner):**

> The roadmap has already been approved. Within a phase, **do not stop between independent
> features to ask for permission.** Only pause for: (1) a significant architectural decision,
> (2) a tradeoff that changes the roadmap, or (3) a blocker requiring user input. Otherwise,
> complete the entire phase, then report back. Commits happen only when explicitly asked
> (the plan is one commit at the end of Phase 9).

For future Claude sessions or developers:

- **Don't re-audit the repo.** This file + the codebase are the source of truth. Start from "Next Phase".
- **Follow the roadmap** — one phase at a time; design before coding; verify before moving on.
- **Bundle related work** where it reuses the same architecture (e.g. Client Defaults + auto-fill form).
- **Add new workflow statuses only in the two `workflow.js` files**; keep them mirrored.
- **Reuse `components/content/*` + `useContentList`** for any dashboard/table work — don't duplicate.
- **Leave architectural breadcrumbs** (`// FEATURE:`, `// WORKFLOW:`, `// ROUTING:`). Document *why*, not *what*.
- **Remove dead code after every phase**; the repo should get cleaner, not larger.
- **Verify** with `vite build` and the dev/preview flow. **Do not commit unless explicitly asked.**
- **Don't replace the persistence layer** until instructed (~after Phase 6).

---

# Development Log

A high-level record (not a changelog) of *what changed and why* per completed milestone.

## Foundation

**What changed:** Centralized the content workflow state machine into `backend/src/workflow.js`
and `frontend/src/lib/workflow.js`. Refactored backend article routes around shared
`applyDeadline` / `applyReassign` / `applyStatus` helpers. Removed duplicated/dead definitions
(`constants.js`, a hardcoded by-stage tally, an inline transitions map, `ArticleDetail`'s local
action logic).

**Why:** The workflow was defined in three places, which would have made adding Draft/Reopened
(Phase 2) and future statuses error-prone. One source of truth per side makes status changes a
one-file edit.

**Decisions:** FE/BE mirror by hand (separate deploys); the frontend keeps only what the UI needs
(labels, colors, `getStatusActions`) — transition *validation* is the backend's job.

---

## Phase 1 — Everyday Productivity

**What changed:** Shipped Saved Views, Remember State, Sticky Header, Bulk Actions
(`PATCH /api/articles/bulk`), Keyboard Shortcuts, Better Empty States, collapsible sidebar, and
Unsaved-Changes detection. Extracted a shared dashboard architecture so Admin and TL stopped
being ~80% duplicated.

**Why:** Daily-use friction reduction + a foundation (shared components/hooks) that later phases
build on instead of re-implementing per page.

**Files added:** `workflow.js` ×2, `lib/storage.js`, hooks (`useContentList`, `useSavedViews`,
`useSelection`, `usePersistentState`, `useHotkeys`), `components/content/*` (DashboardStats,
ContentControls, ContentTable, BulkActionsBar), `components/ShortcutsHelp.jsx`.
**Removed:** `lib/constants.js`, `useUnsavedChanges` (inlined into `Modal`), dead exports.

**Notable decision — data router:** The unsaved-changes "in-app navigation" gap turned out to be
narrow — the full-screen modal overlay already blocks *click* navigation, so only the browser
**Back button** was exposed. The clean fix is React Router's `useBlocker`, which requires the
**data router**; the `history.pushState` workaround fought React Router + StrictMode. Since the
providers use no router hooks, migrating to `createBrowserRouter` was mechanical and low-risk.
Cost: ~14 KB gzip of data-router runtime — accepted for robust, idiomatic blocking.

**Lessons learned:** Verify assumptions in the running app before building (the click-nav gap was
already covered); centralizing the workflow first paid off immediately; the shared dashboard
layer is now the default home for table/filter features.

---

## Phase 2 — Content Workflow

**Increment 1 — Workflow foundation (Draft + Reopen):**

**What changed:** Added two statuses to the centralized state machine —
`DRAFT` (new pipeline entry) and `REOPENED` (re-entry from Completed). Pipeline is now
Draft → Brief Pending → Writing → Review → Completed, with Reopen as Completed → Reopened →
(Writing | Review). New `requiresPrivilege(from,to)` gates publishing a draft, completing, and
reopening to Admin/TL. Drafts are hidden from writers (list, detail `403`, search). New
`isActive(status)` (excludes Draft + Completed) replaced scattered `!== 'COMPLETED'` checks.
`ArticleForm` gained "Save as draft"; `ArticleDetail` shows a "Reopen" action on completed work;
`Stepper` renders the 5-stage pipeline (reopened pieces show at Writing); new badge styles.

**Why:** Draft lets admins stage work before briefing; Reopen replaces editing completed content
directly, keeping an auditable trail.

**Decisions:** Draft is opt-in (no change to default create flow); Reopen is a distinct status
(not "back to Review") for visibility. Frontend `workflow.js` deliberately omits a transitions
map — validation is the backend's job.

**Verified:** 8/8 API assertions (draft visibility, 403s, publish, reopen + timeline log) + UI
smoke (status options, donut legend, Save-as-draft, Reopen button, stepper); `vite build` clean,
no console errors.

**Increment 2 — Templates, Client Defaults + Auto-fill, Duplicate Detection, Deadline Warnings:**

**What changed:** New `templates` entity (`templates.routes.js`, `TemplatesPage`, `TemplateForm`,
Admin → Templates nav). Clients gained `defaultWriterId` / `defaultWordCount` / `defaultTtwMinutes`
/ `defaultTemplateId` (content type already served as the default type). `ArticleForm` now: applies
a template (picker, overwrite), auto-fills blanks from a selected/preset client + its default
template (`fillFromClient` / `applyTemplateTo` shared helpers), flags possible duplicate titles
(`findSimilarArticles`), and shows smart warnings (deadline due soon, writer overloaded ≥5 active,
TTW > time-to-deadline). Also fixed a latent bug: `editing` now keys off `article?.id`, so "New
content" from the client page creates instead of erroring on `updateArticle(undefined)`.

**Why:** Cut repetitive setup at assignment time (templates + client defaults), and surface
mistakes early (duplicates, impossible deadlines, overloaded writers) — all advisory, never blocking.

**Files added:** `backend/src/routes/templates.routes.js`, `pages/admin/TemplatesPage.jsx`,
`components/admin/TemplateForm.jsx`. **No new hooks/utils files** — duplicate detection is one pure
helper in `utils.js`; warnings + auto-fill live in `ArticleForm`.

**Reviews:** *Feature* — all five build + run; verified via API (templates CRUD + role gate, client
defaults persist + survive reload, template-delete clears references) and UI (templates page,
auto-fill of type/writer/word-count/TTW/brief/links, duplicate + deadline-tomorrow + TTW-exceeds +
overload warnings). *Architecture* — additive schema (backfill-safe), shared non-destructive
auto-fill helpers, no duplication. *UX* — defaults grouped under a subheading; advisory panel is
amber/non-blocking; auto-fill never clobbers user input. `vite build` clean (1030 modules), no
console errors.

**Phase 2 status:** ✅ Complete.

---

## Phase 3 — Writer Experience

**What changed:** Built out the writer surfaces. `WriterDashboard` gained a **personal-metrics**
row (active now, completed this week, avg TTW, on-time rate), a **Today's Focus** panel (the
writer's actionable pieces — Brief Pending / Writing / Reopened — ranked overdue → due today →
soonest → undated, capped at three) and an **estimated remaining-work** line (sum of TTW targets
across actionable pieces). `ArticleDetail` gained a **Writing Session** card (pause/resume), a
**Before-you-submit checklist** (advisory), and an assignee-only **Private notes** card. New
backend: `GET /api/dashboard/me` (personal metrics), `POST /api/articles/:id/pause` + `/resume`,
`PUT /api/articles/:id/notes`. `computeTTWMinutes` now understands `kind: 'pause' | 'resume'` log
entries and (as a fix) ignores non-transition logs so a deadline/reassign mid-Writing no longer
resets the clock. Two additive article fields (`writerNotes`, `pausedAt`), backfilled in `db.js`.

**Why:** Make writers faster and the TTW number trustworthy. Pause/resume fixes the long-standing
overnight-inflation problem (a piece left in WRITING used to count wall-clock time forever); the
metrics + focus give a writer a clear "what now / how am I doing" at a glance.

**Decisions** (see Major Architecture Decisions): pause/resume modeled as activity-log brackets
(no new status, TTW stays a pure log function); private notes are a single assignee-gated field,
stripped from list payloads and only revealed (with `isMine`) to the assignee on the detail
payload; metrics that need the activity log live behind `GET /api/dashboard/me` while Today's Focus
+ remaining-work are computed frontend from the loaded list; the checklist is advisory (manual ticks
are ephemeral, submit is never gated).

**Files added:** none — all changes landed in existing files (no new components/hooks; new icons
`IconPause`/`IconPlay`/`IconNote` in `lib/icons.jsx`). **Also fixed:** `dev.cmd` now pins
`BACKEND_PORT=4000` so a launcher that injects `PORT` (e.g. the preview runner) can't steer the API
onto the Vite port.

**Verified:** API smoke (personal metrics; pause sets `pausedAt`/resume clears it; notes save;
**admin cannot see `writerNotes`/`isMine`**; non-assignee notes write → 403; pause on a non-Writing
piece → 400) + UI (metrics row, Today's Focus with "≈ 25m planned", pause↔resume toggling through
the UI both ways, paused chip on the dashboard card, checklist 2/4→3/4 on a self-check, private
note round-trip). `vite build` clean (1030 modules), no console errors.

**Phase 3 status:** ✅ Complete.

---

## Phase 4 — Team Leader Workspace

**What changed:** Built the TL command center. New `/tl/team` page (`TLTeam.jsx`) + a "Team" nav
item, with six widgets: a pulse strip (active / at-risk / overdue / avg review wait), **Needs
attention** (risk detection, worst-first, stacked risk chips), **Writer capacity** (headroom /
overdue / load, color-coded), **Bottlenecks** (per-stage count + avg time-in-stage), **Longest
waiting** (active pieces by time-in-stage), and an **Availability** timeline (pieces due per writer
over the next 7 days). New shared `lib/risk.js` holds all the math. `ArticleForm` gained
**smart-assignment** suggestion chips (rank by client pick → specialty → lightest load). Backend:
`enrichList` now emits `statusSince` (time-in-stage); `GET /api/dashboard` relaxed from `adminOnly`
to `teamLeaderOrAdminOnly` with a per-writer `overdue` count added to `workload`.

**Why:** Give Team Leaders a single place to see who's overloaded, what's about to slip, and where
work is stuck — and make assignment a guided decision instead of a guess.

**Notable fix:** `TLDashboard` was already calling `GET /api/dashboard` (which was `adminOnly`), so
the TL dashboard had been silently broken — it just never surfaced because the seed ships no Team
Leader. Phase 4 needed the endpoint TL-accessible anyway, so relaxing the guard fixed the latent bug
and unblocked the workspace in one move.

**Decisions** (see Major Architecture Decisions): shared `lib/risk.js` (single `WRITER_CAPACITY`,
reused by the form's overload warning); `statusSince` on every article powers time-in-stage
analytics frontend; the Team page derives everything from `listArticles` + `listWriters` (no new
per-widget endpoint — only the existing dashboard route was relaxed/extended); Team is its own page,
smart-assignment lives in the shared assignment form.

**Files added:** `frontend/src/lib/risk.js`, `frontend/src/pages/tl/TLTeam.jsx`. **Touched:**
`articles.routes.js` (+`statusSince`), `dashboard.routes.js` (guard + `overdue`), `ArticleForm.jsx`
(shared capacity + suggestions), `App.jsx` + `Layout.jsx` (route + nav), `index.css`.

**Verified:** API (TL now reads `GET /api/dashboard` → 200 with per-writer `overdue`; `statusSince`
present) + UI as a promoted Team Leader: Team page renders all six widgets (risk chips incl. "Stalled
in Review · 13d", capacity "3 slots free · 2 overdue", bottlenecks with avg age, longest-waiting by
age, 7-day availability grid); the previously-broken `TLDashboard` now loads; smart-assignment
surfaces Dinu Varkey ("Specialty match") for a Case Study and clicking a chip fills the assignee.
`vite build` clean (1032 modules), no console errors. **Note:** for testing, the writer *Titash
Sinha* was promoted to Team Leader (there's now one TL account to exercise the TL surfaces).

**Phase 4 status:** ✅ Complete.

---

## Phase 5 — Analytics & Reporting

**What changed:** New Admin **Analytics** surface (`/admin/analytics`, `AnalyticsPage.jsx`) + an
"Analytics" admin nav item. New backend `GET /api/analytics` (`analytics.routes.js`, admin-only)
returns the historical, activity-log-backed series: **content velocity** (completed per week, last
8 weeks), **client health** (volume / on-time rate / avg turnaround / avg TTW), **writer trends**
(throughput, this-month vs last-month, avg TTW, on-time). The page also computes the
*current-snapshot* views frontend from the article list: **workload forecast** (deadlines per day,
next 14) and **SLA / time-in-stage** (via new `slaSummary` in `lib/risk.js`, reusing the Phase 4
`STALL_LIMITS`). KPI strip + two CSS bar charts (velocity, forecast) + SLA bars + two tables.
**Exportable reports** via a global `@media print` stylesheet + a "Print / Export" button
(`window.print()`).

**Why:** Turn the operational data already captured (activity log, deadlines, TTW) into the
insight an owner needs — who's productive, which clients are healthy, where the pipeline is slipping
— and make it printable for sharing.

**Decisions** (see Major Architecture Decisions): historical series = server endpoint, current
snapshot = frontend via `lib/risk.js` (same split as Phases 3–4); reports via print-CSS, **no PDF
dependency** (browser "Save as PDF" covers it); Analytics is Admin-only (endpoint guard matches).

**Files added:** `backend/src/routes/analytics.routes.js`, `frontend/src/pages/admin/AnalyticsPage.jsx`.
**Touched:** `index.js` (mount), `api/client.js` (`analytics()`), `lib/risk.js` (`slaSummary`),
`App.jsx` + `Layout.jsx` (route + nav + `IconChart`), `index.css` (analytics styles + print block).

**Verified:** API (`GET /api/analytics` → velocity/clients/writers; admin-only — TL + writer both
403) + UI as admin: page renders KPIs (Completed all-time, this-month with MoM trend, active,
within-SLA), 8 velocity bars, 14 forecast bars, SLA per-stage bars, client + writer tables. Clean
full reload shows **zero console errors** (an earlier flurry of `useAuth null` errors were HMR
artifacts — `AuthContext.jsx?t=…` hot-reload churn from editing — gone on a fresh server).
`vite build` clean (1033 modules).

**Phase 5 status:** ✅ Complete.

---

## Phase 6 — Smart Automation

**What changed:** Closed out the automation phase. **Recurring content** is the headline: a new
`recurrences` entity (`db.js`), engine (`recurrence.js`), CRUD + "Run now" routes
(`recurrences.routes.js`), an Admin **Recurring** page (`RecurringPage.jsx` + `RecurringForm.jsx`)
and nav item. Rules auto-spawn a Brief Pending piece each cadence (weekly / fortnightly / monthly)
with a date-stamped title and a deadline `leadTimeDays` out. Spawning is an **on-request sweep**
(boot + `GET /api/articles` + `GET /api/recurrences`), one piece per due rule per sweep.
**Quick-duplicate**: a row action on the Admin + TL dashboards clones any piece into a prefilled
create form (`articleDuplicateSeed` in `utils.js`). **Deadline recommendation**: a "Suggest" button
in `ArticleForm` fills a realistic date (`recommendDeadline` in `lib/risk.js`). **Workflow
suggestions**: a `SmartSuggestions` panel on the Admin dashboard (brief stalled drafts in one click,
clear a review backlog, check recurring series due soon). Two roadmap items were already shipped —
*assignment suggestions* (Phase 4) and *auto-filled form* (Phase 2) — so this phase added the other four.

**Why:** Cut the repetitive setup work — recurring briefs that used to be created by hand every week,
re-keying a near-identical piece, guessing a deadline, and hunting for the next obvious action.

**Decisions** (see Major Architecture Decisions): recurrence spawns via an on-request sweep, not a
scheduler (JSON store + Render ephemeral disk make cron fragile), with a one-per-sweep catch-up so an
idle series can't flood; quick-duplicate reuses the create flow via an id-less seed (no new endpoint);
deadline recommendation is advisory (fills, never forces).

**Files added:** `backend/src/recurrence.js`, `backend/src/routes/recurrences.routes.js`,
`frontend/src/pages/admin/RecurringPage.jsx`, `frontend/src/components/admin/RecurringForm.jsx`,
`frontend/src/components/admin/SmartSuggestions.jsx`. **Touched:** `db.js` (+collection), `index.js`
(mount + boot sweep), `articles.routes.js` (sweep on list), `api/client.js`, `lib/risk.js`
(`recommendDeadline`), `lib/utils.js` (`articleDuplicateSeed`), `ArticleForm.jsx`, `AdminDashboard.jsx`
+ `TLDashboard.jsx` (duplicate action; suggestions on Admin), `App.jsx`, `Layout.jsx`
(+`IconCopy`/`IconRefresh` nav), `index.css`.

**Verified:** API — recurrence create → sweep spawns exactly one dated Brief Pending piece (deadline =
run + lead), advances `nextRunAt` to the next future slot, sets `lastRunAt`; "Run now" spawns one
immediately without touching the schedule. UI as admin — Recurring page lists/toggles (Active↔Paused,
next-run shows "paused"), Smart Suggestions shows the review backlog, quick-duplicate opens "New
content" prefilled `… (copy)`, deadline "Suggest" fills the field. `vite build` clean (1036 modules),
zero console errors. **Note:** a demo recurrence ("Horizon Tech — Weekly Newsletter") now exists in
the dev DB.

**Phase 6 status:** ✅ Complete.

---

## Phase 7 — Collaboration

**What changed:** Made the workspace multi-player. Three new collections (`notifications`,
`comments`, `follows`) + a notify engine (`notify.js`). **Notifications** are generated on write at
the article mutation choke points (`applyStatus`/`applyReassign`), on new comments, and on recurring
spawns; surfaced by a topbar **bell** (`NotificationBell.jsx`) with an unread badge + dropdown that
refetches on every route change. **Threaded comments** (`comments.routes.js`, `Comments.jsx`) sit on
every article detail — one level of replies, edit/delete your own (admins delete any). **Follow /
watch** (`follows.routes.js`) — a toggle in the detail head; followers join the notify audience.
The **Activity page** (`/admin/activity`, `activity.routes.js`) merges activity logs + comments into
one reverse-chron stream with kind/actor/title filters — the org feed *and* the audit log in one
surface. **Advanced search** (`/search`, `SearchPage.jsx`) is a faceted full-text search over the
role-scoped article list (matches brief notes too), reachable from the command palette.

**Why:** The tool had a rich pipeline but no way to talk about the work, get told when something
needs you, watch a piece you don't own, or audit what happened. This phase adds all of that.

**Decisions** (see Major Architecture Decisions): notifications generated-on-write (real unread
state); comments a separate editable collection (logs stay immutable); activity feed = audit log
(one filterable surface); follows/comments inherit the article visibility rule; advanced search is
frontend-only over the already-scoped list. All built on the JSON datastore per the demo-only call.

**Files added:** `backend/src/notify.js`, `backend/src/routes/{notifications,comments,follows,activity}.routes.js`,
`frontend/src/components/{NotificationBell,Comments}.jsx`, `frontend/src/pages/SearchPage.jsx`,
`frontend/src/pages/admin/ActivityPage.jsx`. **Touched:** `db.js` (+3 collections), `index.js`
(mounts), `articles.routes.js` (notify hooks + `isFollowing`/`followerCount` in `enrichDetail`),
`recurrence.js` (notify on spawn), `api/client.js`, `ArticleDetail.jsx` (Watch + Discussion),
`Layout.jsx` (bell + Activity nav), `CommandPalette.jsx` (advanced-search entry), `icons.jsx`
(`IconBell`/`IconChat`/`IconActivity`), `index.css`.

**Verified:** API — reassign → "assigned" notif; status change → "status" notif to assignee +
followers (not the actor); comment/reply → notifs to audience + parent author; follow returns
`isFollowing`/`followerCount`; activity feed = 38 unified events across all kinds, kind filter works,
writer gets 403. UI — bell badge "2" + panel, click marks read + navigates, Watch toggles
(count 1→2), comment + reply render and post, Activity page filters to comments, advanced search
"newsletter" matches 5 (incl. one via brief notes) and narrows to 2 with a status facet.
`vite build` clean (1040 modules), zero console errors.

**Phase 7 status:** ✅ Complete.

---

## Phase 8 — Premium UI Redesign · increment 1 (colour system)

**What changed:** Replaced the original sage/pastel palette with a calm, enterprise navy system
(Microsoft/Linear/Azure feel), built as a proper semantic token layer rather than a hex swap.
Reworked `index.css` `:root` into base palette → semantic `--color-*` tokens → legacy aliases.
**Audited and consolidated ~40 scattered hex** values (the amber/teal/pink/green one-offs accreted
across Phases 2–7) down to the token set — the whole sheet now references tokens (only `#fff` and a
print-only `#ddd` remain). Recoloured the **login** hero to a deep-navy gradient with light text, the
**status badges** to a cohesive cool scale (writing→navy, brief/reopened→info-teal, completed→
success-teal, review→amber) with accessible contrast, the **donut/legend** `STATUS_COLORS`, the
**stat cards** (info/warning/success accents), and the body to a cool `#F4F8FC`. Warning (amber) and
danger (red) kept deliberately separate. Pushed several teal text/glyph spots to `--color-success-strong`
to hold WCAG AA.

**Why:** The first step of Phase 8 — a single, intentional colour foundation so the rest of the
redesign (Tailwind, primitives, dark mode) has tokens to build on, and the app reads as premium and
understated rather than a colourful startup dashboard.

**Decisions:** base→semantic→legacy-alias token architecture (reskins the app without touching every
component); warning/danger outside the brand palette; status stage colours stay as hex in
`workflow.js` (inline SVG fills) but recoloured to the palette; accessibility preserved by deriving
`*-strong` shades for text on light tints instead of using the mid palette hues as text.

**Verified:** login (navy hero gradient `#001D39→#0A4174`, white card on `#F4F8FC`, navy Sign-in),
admin (navy active-nav pill + navy primary buttons, calm translucent sidebar), badges (all four
sampled resolve to token colours with ≥5.5:1 contrast), donut legend (cool scale + amber review),
stat-card accents. `vite build` clean (1040 modules), zero console errors. Screenshots unavailable in
this environment (timeout) — verified via computed-style inspection.

**Follow-up tweak:** Refined the card *edge accents* — the chunky 5px full-height stat-card `::before`
ribbons (and the writer-card overdue border) read as loud against the cool palette, so they're now a
thin (3px), inset, rounded indicator. Card backgrounds were intentionally left as-is (owner asked to
change only the edges).

**Remaining Phase 8:** Tailwind migration, reusable primitives, retire `index.css` gradually.

---

## Phase 8 — increment 2 (dark / light / system themes)

**What changed:** Added full theming on top of the token layer. A `:root[data-theme="dark"]` block in
`index.css` overrides only the semantic `--color-*` tokens (+ shadows/ring/sidebar); the legacy
aliases resolve `var(--color-*)` at use-site so they follow automatically — no per-component dark CSS.
Accent hues are lightened for dark surfaces and `--color-on-primary` flips to dark so primary
buttons / active-nav stay high-contrast (light-azure fill, dark text). New `lib/theme.js`
(`useTheme` hook + `getThemePref`/`setThemePref`/`applyTheme`/`resolveTheme`) drives a **Light / Dark /
Auto** switcher in the Layout user dropdown; "Auto" follows the OS and live-updates while selected.
A tiny inline script in `index.html` applies the stored preference before first paint (no flash).
Also tokenised the last theme-breaking light hardcodes — the translucent sidebar (`--color-sidebar`),
the stat-card gradient starts (`#fff` → `--color-surface`), and white-on-primary text
(`#fff` → `--color-on-primary`).

**Why:** Dark/light/system is a baseline expectation for premium enterprise software, and the Phase-8
token foundation made it a token-layer override rather than a rewrite.

**Decisions:** dark mode = pure token override (legacy aliases inherit); the one overloaded token
(`--color-primary-hover`, used as both button-hover bg and chip text) works in both modes because
`--color-on-primary` flips dark, so a light-azure hover bg still pairs with dark text; "system"
resolved in JS (controller sets `data-theme`), so the CSS only needs the `[data-theme="dark"]` selector.

**Files added:** `frontend/src/lib/theme.js`. **Touched:** `index.css` (dark block + tokenised
hardcodes + switcher styles), `index.html` (no-flash script + navy favicon), `Layout.jsx` (switcher +
`useTheme`), `lib/icons.jsx` (`IconSun`/`IconMoon`/`IconMonitor`).

**Verified:** dark canvas `#0B1622`, dark cards/inputs/sidebar, light text `#E7EEF5`, light-azure
primary button + active-nav with dark text; all four status badges readable on dark (light text on
dark tinted bg, ≥4.6:1); switcher flips + persists (`cpt_theme`); "Auto" follows the OS (env prefers
dark → resolved dark). `vite build` clean (1041 modules), zero console errors. (Screenshots time out
in this env — verified via computed-style inspection + live toggling.)
