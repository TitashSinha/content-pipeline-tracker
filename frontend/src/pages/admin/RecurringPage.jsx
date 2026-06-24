// FEATURE: Recurring Content (Phase 6) — manage recurrence rules that auto-spawn
// content on a cadence. Mirrors TemplatesPage. "Run now" spawns one immediately;
// the active toggle pauses/resumes automatic generation.
import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import { SkeletonPage } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import RecurringForm from '../../components/admin/RecurringForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, IconButton, Card } from '../../components/ui/index.js';
import { formatDate } from '../../lib/utils.js';
import { IconPlus, IconEdit, IconTrash, IconPlay } from '../../lib/icons.jsx';

const CADENCE_LABELS = { weekly: 'Weekly', biweekly: 'Every 2 weeks', monthly: 'Monthly' };

export default function RecurringPage() {
  const toast = useToast();
  const [recurrences, setRecurrences] = useState(null);
  const [clients, setClients] = useState([]);
  const [writers, setWriters] = useState([]);
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    const [r, c, w, t] = await Promise.all([
      api.listRecurrences(), api.listClients(), api.listWriters(), api.listTypes(),
    ]);
    setRecurrences(r);
    setClients(c);
    setWriters(w);
    setTypes(t);
  }
  useEffect(() => { load(); }, []);

  const clientName = (id) => clients.find((c) => c.id === id)?.name ?? '—';

  async function runNow(r) {
    setBusyId(r.id);
    try {
      const created = await api.runRecurrence(r.id);
      toast.success(`Generated "${created.title}"`);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(r) {
    setBusyId(r.id);
    try {
      await api.updateRecurrence(r.id, { active: !r.active });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    setDelBusy(true);
    try {
      await api.deleteRecurrence(deleting.id);
      toast.success('Recurrence deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDelBusy(false);
    }
  }

  if (!recurrences) return <div className="page"><SkeletonPage /></div>;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Recurring</h1>
          <p className="text-muted">{recurrences.length} series · content is generated automatically on each cadence</p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <IconPlus /> New recurrence
        </Button>
      </div>

      {recurrences.length === 0 ? (
        <EmptyState
          title="No recurring content yet"
          message="Set up a series — e.g. a weekly newsletter — and a fresh briefed piece is created for you on every cadence."
          action={<Button onClick={() => setEditing(null)}><IconPlus /> New recurrence</Button>}
        />
      ) : (
        <Card noPad>
          <table className="table">
            <thead>
              <tr><th>Title</th><th>Client</th><th>Cadence</th><th>Next run</th><th>Last run</th><th>Status</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {recurrences.map((r) => (
                <tr key={r.id} className={!r.active ? 'opacity-60' : ''}>
                  <td className="font-semibold">{r.title}</td>
                  <td>{clientName(r.clientId)}</td>
                  <td>{CADENCE_LABELS[r.cadence] ?? r.cadence}</td>
                  <td>{r.active ? formatDate(r.nextRunAt) : <span className="text-muted">paused</span>}</td>
                  <td>{r.lastRunAt ? formatDate(r.lastRunAt) : <span className="text-muted">never</span>}</td>
                  <td>
                    <button
                      type="button"
                      className={`toggle-pill ${r.active ? 'toggle-pill--on' : ''}`}
                      disabled={busyId === r.id}
                      onClick={() => toggleActive(r)}
                      title={r.active ? 'Pause automatic generation' : 'Resume automatic generation'}
                    >
                      {r.active ? 'Active' : 'Paused'}
                    </button>
                  </td>
                  <td className="col-actions">
                    <IconButton title="Run now" disabled={busyId === r.id} onClick={() => runNow(r)}><IconPlay /></IconButton>
                    <IconButton title="Edit" onClick={() => setEditing(r)}><IconEdit /></IconButton>
                    <IconButton tone="danger" title="Delete" onClick={() => setDeleting(r)}><IconTrash /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing !== undefined && (
        <RecurringForm
          recurrence={editing}
          clients={clients}
          writers={writers}
          types={types}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete recurrence"
          message={`Delete the recurring series "${deleting.title}"? Pieces already generated are kept.`}
          busy={delBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
