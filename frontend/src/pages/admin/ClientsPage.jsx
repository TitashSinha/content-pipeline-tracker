import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ClientForm from '../../components/admin/ClientForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { useToast } from '../../components/Toast.jsx';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '../../lib/icons.jsx';

export default function ClientsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState(null);
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [q, setQ] = useState('');

  async function load() {
    const [c, t] = await Promise.all([api.listClients(), api.listTypes()]);
    setClients(c);
    setTypes(t);
  }
  useEffect(() => { load(); }, []);

  async function confirmDelete() {
    setDelBusy(true);
    try {
      await api.deleteClient(deleting.id);
      toast.success('Client deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDelBusy(false);
    }
  }

  if (!clients) return <Loader full />;

  const displayed = q
    ? clients.filter((c) =>
        c.name.toLowerCase().includes(q.toLowerCase()) ||
        c.industry?.toLowerCase().includes(q.toLowerCase()) ||
        c.contentTypeName?.toLowerCase().includes(q.toLowerCase())
      )
    : clients;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Clients</h1>
          <p className="muted">{clients.length} client{clients.length === 1 ? '' : 's'}</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setEditing(null)}>
          <IconPlus /> Add client
        </button>
      </div>

      {clients.length === 0 ? (
        <EmptyState title="No clients yet" message="Add your first client to start assigning content." />
      ) : (
        <>
          <div className="roster-search">
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, industry or type…" />
          </div>
          <div className="card no-pad">
          <table className="table">
            <thead><tr><th>Name</th><th>Content type</th><th>Industry</th><th aria-label="Actions" /></tr></thead>
            <tbody>
              {displayed.length === 0 && (
                <tr><td colSpan={4} className="muted" style={{ padding: '24px', textAlign: 'center' }}>No clients match "{q}"</td></tr>
              )}
              {displayed.map((c) => (
                <tr key={c.id} className="row-link" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                  <td className="cell-strong">{c.name}</td>
                  <td>{c.contentTypeName ?? '—'}</td>
                  <td className="muted">{c.industry ?? '—'}</td>
                  <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                    <button type="button" className="icon-btn" title="Edit" onClick={() => setEditing(c)}><IconEdit /></button>
                    <button type="button" className="icon-btn icon-btn--danger" title="Delete" onClick={() => setDeleting(c)}><IconTrash /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}

      {editing !== undefined && (
        <ClientForm
          client={editing}
          types={types}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete client"
          message={`Are you sure you want to delete “${deleting.name}${deleting.contentTypeName ? ` · ${deleting.contentTypeName}` : ''}”? This can't be undone.`}
          busy={delBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
