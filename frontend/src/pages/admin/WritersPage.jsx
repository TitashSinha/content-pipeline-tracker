import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import WriterForm from '../../components/admin/WriterForm.jsx';
import BatchAssignModal from '../../components/admin/BatchAssignModal.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatDate } from '../../lib/utils.js';
import { IconPlus, IconEdit, IconTrash, IconBatch, IconSearch } from '../../lib/icons.jsx';

export default function WritersPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [writers, setWriters] = useState(null);
  const [archived, setArchived] = useState([]);
  const [counts, setCounts] = useState({});
  const [types, setTypes] = useState([]);
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [removing, setRemoving] = useState(null);
  const [batchWriter, setBatchWriter] = useState(null); // writer to batch-assign
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('all');

  async function load() {
    const [w, arch, articles, t, clientList] = await Promise.all([
      api.listWriters(), api.listArchivedWriters(), api.listArticles(), api.listTypes(), api.listClients(),
    ]);
    const cnt = {};
    for (const a of articles) cnt[a.assignedWriterId] = (cnt[a.assignedWriterId] || 0) + 1;
    setWriters(w);
    setArchived(arch);
    setCounts(cnt);
    setTypes(t);
    setClients(clientList);
  }
  useEffect(() => { load(); }, []);

  if (!writers) return <Loader full />;

  const ROLE_TABS = [
    { key: 'all', label: 'All', count: writers.length },
    { key: 'WRITER', label: 'Writers', count: writers.filter((w) => w.role === 'WRITER').length },
    { key: 'TEAM_LEADER', label: 'Team Leaders', count: writers.filter((w) => w.role === 'TEAM_LEADER').length },
    { key: 'archived', label: 'Archived', count: archived.length },
  ];

  const displayed = writers.filter((w) => {
    if (tab === 'WRITER' && w.role !== 'WRITER') return false;
    if (tab === 'TEAM_LEADER' && w.role !== 'TEAM_LEADER') return false;
    if (q) {
      const lq = q.toLowerCase();
      return w.name.toLowerCase().includes(lq) || w.email?.toLowerCase().includes(lq) || w.specialties?.toLowerCase().includes(lq);
    }
    return true;
  });

  async function openEdit(w) {
    try {
      setEditing(await api.getWriter(w.id)); // fetch full profile so the form prefills everything
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function confirmRemove() {
    setBusy(true);
    try {
      await api.archiveWriter(removing.id);
      toast.success('Writer moved to the bin');
      setRemoving(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function restore(id) {
    try { await api.restoreWriter(id); toast.success('Writer restored'); await load(); }
    catch (err) { toast.error(err.message); }
  }
  async function purge(id) {
    try { await api.deleteArchivedWriter(id); toast.info('Removed permanently'); await load(); }
    catch (err) { toast.error(err.message); }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>People</h1>
          <p className="muted">{writers.length} active · {archived.length} in bin</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}>
          <IconPlus /> Add writer
        </button>
      </div>

      <div className="role-tabs">
        {ROLE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`role-tab${tab === t.key ? ' role-tab--active' : ''}`}
            onClick={() => { setTab(t.key); setQ(''); }}
          >
            {t.label} <span className="role-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'archived' ? (
        archived.length === 0 ? (
          <EmptyState title="Bin is empty" message="Archived writers will appear here." />
        ) : (
          <div className="card">
            <h2 className="card-title">Archived writers</h2>
            {archived.map((w) => (
              <div key={w.id} className="bin-row">
                <div>
                  <strong>{w.name}</strong> <span className="muted">· {w.email}</span>
                  <div className="muted tiny">Removed {formatDate(w.archivedAt)}</div>
                </div>
                <div className="bin-actions">
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => restore(w.id)}>Restore</button>
                  <button type="button" className="btn btn--danger btn--sm" onClick={() => purge(w.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : writers.length === 0 ? (
        <EmptyState title="No writers yet" message="Add your first writer so you can assign content to them." />
      ) : (
        <>
          <div className="roster-search">
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, email or specialty…" />
          </div>
          <div className="card no-pad">
            <table className="table">
              <thead><tr><th>Name</th><th>Email</th><th>Specialties</th><th>Articles</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr><td colSpan={5} className="muted" style={{ padding: '24px', textAlign: 'center' }}>No people match "{q}"</td></tr>
                )}
                {displayed.map((w) => (
                  <tr key={w.id} className="row-link" onClick={() => navigate(`/admin/writers/${w.id}`)}>
                    <td className="cell-strong">
                      {w.name}
                      {w.role === 'TEAM_LEADER' && <span className="tl-badge">TL</span>}
                    </td>
                    <td className="muted">{w.email}</td>
                    <td className="muted">{w.specialties ?? '—'}</td>
                    <td>{counts[w.id] || 0}</td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="icon-btn" title="Batch assign" onClick={() => setBatchWriter(w)}><IconBatch /></button>
                      <button type="button" className="icon-btn" title="Edit" onClick={() => openEdit(w)}><IconEdit /></button>
                      <button type="button" className="icon-btn icon-btn--danger" title="Remove writer" onClick={() => setRemoving({ ...w, count: counts[w.id] || 0 })}><IconTrash /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editing !== undefined && (
        <WriterForm
          writer={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}

      {batchWriter && (
        <BatchAssignModal
          clients={clients}
          writers={writers}
          types={types}
          defaultWriterId={batchWriter.id}
          onClose={() => setBatchWriter(null)}
          onSaved={() => { setBatchWriter(null); load(); }}
        />
      )}

      {removing && (
        <ConfirmDialog
          title="Remove writer"
          confirmLabel="Remove"
          message={
            `Remove ${removing.name}? Their ${removing.count} assigned article${removing.count === 1 ? '' : 's'} ` +
            `will show as “Unknown Writer” until you reassign them. You can restore the writer from the bin.`
          }
          busy={busy}
          onCancel={() => setRemoving(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
