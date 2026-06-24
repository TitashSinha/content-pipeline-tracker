// FEATURE: Workflow suggestions (Phase 6) — a compact, state-derived nudge strip
// on the Admin dashboard. Surfaces the next automatable move: brief stalled drafts
// in one click, clear a review backlog, or check recurring series about to spawn.
// Renders nothing when there's nothing worth nudging.
import { Link } from 'react-router-dom';
import { Button } from '../ui/index.js';
import { msInStage } from '../../lib/risk.js';
import { formatDate } from '../../lib/utils.js';

const DAY = 86400000;

export default function SmartSuggestions({ articles, recurrences = [], busy, onBriefDrafts, onFilterReview }) {
  const drafts = articles.filter((a) => a.status === 'DRAFT');
  const reviewStale = articles.filter((a) => a.status === 'REVIEW' && msInStage(a) > 2 * DAY);
  const now = Date.now();
  const upcoming = recurrences
    .filter((r) => r.active && r.nextRunAt)
    .sort((a, b) => new Date(a.nextRunAt) - new Date(b.nextRunAt));
  const dueSoon = upcoming.filter((r) => new Date(r.nextRunAt).getTime() - now < 3 * DAY);

  const cards = [];

  if (drafts.length) {
    cards.push(
      <div key="drafts" className="suggestion-card">
        <div className="suggestion-text">
          <strong>{drafts.length} draft{drafts.length === 1 ? '' : 's'} ready to brief</strong>
          <span className="text-muted text-[.8rem]">Send them into the pipeline so writers can start.</span>
        </div>
        <Button size="sm" disabled={busy} onClick={() => onBriefDrafts(drafts.map((d) => d.id))}>
          Send to brief
        </Button>
      </div>,
    );
  }

  if (reviewStale.length) {
    cards.push(
      <div key="review" className="suggestion-card">
        <div className="suggestion-text">
          <strong>{reviewStale.length} piece{reviewStale.length === 1 ? '' : 's'} waiting in review over 2 days</strong>
          <span className="text-muted text-[.8rem]">Approve, or send back with feedback.</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onFilterReview}>Show them</Button>
      </div>,
    );
  }

  if (dueSoon.length) {
    cards.push(
      <div key="recurring" className="suggestion-card">
        <div className="suggestion-text">
          <strong>{dueSoon.length} recurring series generating soon</strong>
          <span className="text-muted text-[.8rem]">Next: {upcoming[0].title} on {formatDate(upcoming[0].nextRunAt)}.</span>
        </div>
        <Link to="/admin/recurring" className="btn btn--ghost btn--sm">Manage</Link>
      </div>,
    );
  }

  if (cards.length === 0) return null;
  return (
    <section className="suggestions">
      <h2 className="text-[1rem] text-muted font-bold">Suggestions</h2>
      <div className="suggestion-grid">{cards}</div>
    </section>
  );
}
