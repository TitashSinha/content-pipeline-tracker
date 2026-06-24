import Donut from '../Donut.jsx';
import { StatCard, LinkButton, Card, CardTitle, CardTitleRow } from '../ui/index.js';
import { STATUSES, STATUS_LABELS, STATUS_COLORS } from '../../lib/workflow.js';
import { initials } from '../../lib/utils.js';

// Shared dashboard header: the three stat cards, the by-stage donut, and the
// writer-workload card. Used by both the Admin and TL dashboards.
// `onStageClick` is optional — when provided the donut/legend become filters.

const RANGE_LABELS = { today: 'Today', week: 'This Week', month: 'This Month', all: 'All Time', custom: 'Custom' };

export default function DashboardStats({
  periodStats, dateRange, statusFilter, onStageClick,
  workload, busiest, onShowAllWorkload,
}) {
  const doneLabel = dateRange === 'today' ? 'Done today'
    : dateRange === 'week' ? 'Done this week'
    : dateRange === 'month' ? 'Done this month'
    : dateRange === 'custom' ? 'Done (custom)'
    : 'Done (all time)';
  const activeHint = dateRange === 'all' ? 'not yet completed' : `not completed · ${RANGE_LABELS[dateRange] || ''}`;

  return (
    <>
      <div className="stats-row">
        <div className="anim-fade-up"><StatCard tone="blue" label="Active" value={periodStats.active} hint={activeHint} /></div>
        <div className="anim-fade-up anim-delay-1"><StatCard tone="amber" label="Overdue" value={periodStats.overdue} hint="past deadline" /></div>
        <div className="anim-fade-up anim-delay-2"><StatCard tone="green" label={doneLabel} value={periodStats.done} hint="status: completed" /></div>

        <div className="anim-fade-up anim-delay-3"><Card className="stage-panel">
          <CardTitle as="h2">By Stage</CardTitle>
          <div className="stage-panel-body">
            <Donut
              segments={STATUSES.map((s) => ({ value: periodStats.byStage[s] || 0, color: STATUS_COLORS[s] }))}
              onSegmentClick={onStageClick ? (i) => onStageClick(STATUSES[i]) : undefined}
            />
            <ul className="stage-legend">
              {STATUSES.map((s) => (
                <li
                  key={s}
                  className={`${onStageClick ? 'legend-item' : ''}${statusFilter === s ? ' legend-item--active' : ''}`}
                  onClick={onStageClick ? () => onStageClick(s) : undefined}
                >
                  <span className="legend-dot" style={{ background: STATUS_COLORS[s] }} />
                  <span className="legend-label">{STATUS_LABELS[s]}</span>
                  <span className="legend-count">{periodStats.byStage[s] || 0}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card></div>
      </div>

      <Card>
        <CardTitleRow>
          <CardTitle as="h2" flush>Writer Workload</CardTitle>
          {workload.length > 6 && onShowAllWorkload && (
            <LinkButton onClick={onShowAllWorkload}>Show all</LinkButton>
          )}
        </CardTitleRow>
        <div className="workload-grid">
          {workload.slice(0, 6).map((w) => <WorkloadRow key={w.id} writer={w} busiest={busiest} />)}
        </div>
      </Card>
    </>
  );
}

export function WorkloadRow({ writer, busiest }) {
  return (
    <div className="workload-row">
      <span className="workload-avatar">{initials(writer.name)}</span>
      <div className="workload-meta">
        <span className="workload-name">
          {writer.name}
          {writer.role === 'TEAM_LEADER' && <span className="role-chip role-chip--tl">TL</span>}
        </span>
        <div className="workload-bar">
          <span className="workload-fill" style={{ width: `${(writer.active / busiest) * 100}%` }} />
        </div>
      </div>
      <span className="workload-count">{writer.active}</span>
    </div>
  );
}
