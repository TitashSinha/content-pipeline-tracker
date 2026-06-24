import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client.js';
import { SkeletonPage } from '../../components/Skeleton.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import ClientForm from '../../components/admin/ClientForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { useToast } from '../../components/Toast.jsx';
import { Button, IconButton, Card } from '../../components/ui/index.js';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '../../lib/icons.jsx';

export default function ClientsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [clients, setClients] = useState(null);
  const [types, setTypes] = useState([]);
  const [writers, setWriters] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);
  const [q, setQ] = useState('');

  async function load() {
    const [c, t, w, tpl] = await Promise.all([
      api.listClients(), api.listTypes(), api.listWriters(), api.listTemplates(),
    ]);
    setClients(c);
    setTypes(t);
    setWriters(w);
    setTemplates(tpl);
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

  if (!clients) return <div className="page"><SkeletonPage /></div>;

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
          <p className="text-muted">{clients.length} client{clients.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <IconPlus /> Add client
        </Button>
      </div>

      {clients.length === 0 ? (
        <EmptyState title="No clients yet" message="Add your first client to start assigning content." />
      ) : (
        <>
          <div className="roster-search">
            <IconSearch />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, industry or type…" />
          </div>
          <Card noPad>
            <table className="table">
              <thead><tr><th>Name</th><th>Content type</th><th>Industry</th><th aria-label="Actions" /></tr></thead>
              <tbody>
                {displayed.length === 0 && (
                  <tr><td colSpan={4} className="text-muted text-center p-6">No clients match "{q}"</td></tr>
                )}
                {displayed.map((c) => (
                  <tr key={c.id} className="cursor-pointer transition-colors hover:bg-surface-2" onClick={() => navigate(`/admin/clients/${c.id}`)}>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.contentTypeName ?? '—'}</td>
                    <td className="text-muted">{c.industry ?? '—'}</td>
                    <td className="col-actions" onClick={(e) => e.stopPropagation()}>
                      <IconButton title="Edit" onClick={() => setEditing(c)}><IconEdit /></IconButton>
                      <IconButton tone="danger" title="Delete" onClick={() => setDeleting(c)}><IconTrash /></IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}

      {editing !== undefined && (
        <ClientForm
          client={editing}
          types={types}
          writers={writers}
          templates={templates}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete client"
          message={`Are you sure you want to delete "${deleting.name}${deleting.contentTypeName ? ` · ${deleting.contentTypeName}` : ''}"? This can't be undone.`}
          busy={delBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
