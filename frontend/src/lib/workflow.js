// WORKFLOW: single source of truth (frontend) for the content pipeline.
// Statuses, labels, accent colors, and the role-aware status-change actions all
// live here. Transition *validation* is the backend's job (backend/src/workflow.js);
// the UI only needs to know which actions to offer (see getStatusActions).
//
// Mirrors backend/src/workflow.js across the FE/BE boundary — keep them in sync.
//
// Pipeline: Draft → Brief Pending → Writing → Review → Completed.
// Reopened is a re-entry from Completed, shown back in the active loop.
//
// Related: components/StatusBadge.jsx, components/Stepper.jsx,
//          components/ArticleDetail.jsx, components/content/DashboardStats.jsx

export const STATUSES = ['DRAFT', 'BRIEF_PENDING', 'WRITING', 'REVIEW', 'COMPLETED', 'REOPENED'];

export const STATUS_LABELS = {
  DRAFT: 'Draft',
  BRIEF_PENDING: 'Brief Pending',
  WRITING: 'Writing',
  REVIEW: 'Review',
  COMPLETED: 'Completed',
  REOPENED: 'Reopened',
};

// Stage accent colors — drawn from the Phase 8 brand palette so the donut +
// legend read as one cohesive cool scale, with a single warm amber for Review
// (the "needs attention" stage). Kept as hex here because they're consumed as
// inline SVG fills; everything else uses the CSS design tokens.
export const STATUS_COLORS = {
  DRAFT: '#C2D3E0',         // muted powder (setup)
  BRIEF_PENDING: '#7BBDE8', // sky (waiting to start)
  WRITING: '#49769F',       // secondary blue (in progress)
  REVIEW: '#D99A3C',        // amber accent (needs attention)
  COMPLETED: '#6EA2B3',     // success teal (done)
  REOPENED: '#4E8EA2',      // info teal (re-entered)
};

// The linear pipeline shown by the Stepper. Reopened isn't a stage — a reopened
// piece is rendered back at Writing (see Stepper.jsx).
export const PIPELINE = ['DRAFT', 'BRIEF_PENDING', 'WRITING', 'REVIEW', 'COMPLETED'];

/** A fresh { STATUS: 0 } tally, used for by-stage counts. */
export const emptyStageTally = () =>
  STATUSES.reduce((acc, s) => ((acc[s] = 0), acc), {});

// "Active" = in the live pipeline — excludes Draft (setup) and Completed (done).
// Reopened counts as active.
export const isActive = (status) => status !== 'DRAFT' && status !== 'COMPLETED';

// The status-change buttons to show on the detail page, given status + role.
// Only ADMIN / TL may publish a draft, mark complete, or reopen.
export function getStatusActions(status, role) {
  const privileged = role === 'ADMIN' || role === 'TEAM_LEADER';
  switch (status) {
    case 'DRAFT':
      return privileged ? [{ label: 'Send to Brief', to: 'BRIEF_PENDING', variant: 'primary' }] : [];
    case 'BRIEF_PENDING':
      return [{ label: 'Start Writing', to: 'WRITING', variant: 'primary' }];
    case 'WRITING':
      return [{ label: 'Submit for Review', to: 'REVIEW', variant: 'primary' }];
    case 'REVIEW':
      return privileged
        ? [
            { label: 'Send Back to Writing', to: 'WRITING', variant: 'ghost' },
            { label: 'Mark as Complete', to: 'COMPLETED', variant: 'success' },
          ]
        : [{ label: 'Back to Writing', to: 'WRITING', variant: 'ghost' }];
    case 'COMPLETED':
      return privileged ? [{ label: 'Reopen', to: 'REOPENED', variant: 'ghost' }] : [];
    case 'REOPENED':
      return privileged
        ? [
            { label: 'Resume Writing', to: 'WRITING', variant: 'primary' },
            { label: 'Send to Review', to: 'REVIEW', variant: 'ghost' },
          ]
        : [{ label: 'Resume Writing', to: 'WRITING', variant: 'primary' }];
    default:
      return [];
  }
}
