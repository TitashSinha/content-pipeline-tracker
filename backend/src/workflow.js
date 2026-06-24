// WORKFLOW: single source of truth for the content pipeline state machine.
// Statuses, their canonical order, and the legal transitions all live here, so
// adding a stage is a one-file change instead of a hunt across routes.
//
// This intentionally mirrors frontend/src/lib/workflow.js across the FE/BE
// boundary — the two halves deploy separately (Vercel + Render) with no shared
// package, so the lists are kept identical by hand. Change both together.
//
// Pipeline: Draft → Brief Pending → Writing → Review → Completed.
// Reopened is a re-entry from Completed (not a linear stage) that puts a piece
// back into the active loop.
//
// Related: routes/articles.routes.js (transition validation + status logging),
//          routes/dashboard.routes.js (by-stage tallies + active counts).

export const STATUSES = ['DRAFT', 'BRIEF_PENDING', 'WRITING', 'REVIEW', 'COMPLETED', 'REOPENED'];

export const TRANSITIONS = {
  DRAFT: ['BRIEF_PENDING'],
  BRIEF_PENDING: ['WRITING'],
  WRITING: ['REVIEW'],
  REVIEW: ['WRITING', 'COMPLETED'],
  COMPLETED: ['REOPENED'],
  REOPENED: ['WRITING', 'REVIEW'],
};

export const canTransition = (from, to) => (TRANSITIONS[from] || []).includes(to);

// Moves only an Admin / Team Leader may perform: completing, reopening, and
// publishing a draft into the briefing pipeline.
export function requiresPrivilege(from, to) {
  if (to === 'COMPLETED' || to === 'REOPENED') return true;
  if (from === 'DRAFT' && to === 'BRIEF_PENDING') return true;
  return false;
}

/** A fresh { STATUS: 0 } tally, used for by-stage counts. */
export const emptyStageTally = () =>
  STATUSES.reduce((acc, s) => ((acc[s] = 0), acc), {});

// "Active" = in the live pipeline — excludes Draft (still being set up) and
// Completed (done). Reopened counts as active.
export const isActive = (status) => status !== 'DRAFT' && status !== 'COMPLETED';
