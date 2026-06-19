import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import { useToast } from '../../components/Toast.jsx';
import { IconEdit, IconTrash, IconPlus } from '../../lib/icons.jsx';

export default function ArticleTypesPage() {
  const toast = useToast();
  const [types, setTypes] = useState(null);
  const [counts, setCounts] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const [t, articles] = await Promise.all([api.listTypes(), api.listArticles()]);
    setTypes(t);
    const c = {};
    for (const a of articles) c[a.articleTypeId] = (c[a.articleTypeId] || 0) + 1;
    setCounts(c);
  }
  useEffect(() => { load(); }, []);

  async function addType(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      await api.createType(newName.trim());
      toast.success('Type added');
      setNewName('');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveRename(id) {
    if (!editName.trim()) return;
    setBusy(true);
    try {
      await api.updateType(id, editName.trim());
      toast.success('Renamed');
      setEditingId(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    setBusy(true);
    try {
      await api.deleteType(id);
      toast.success('Type deleted');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!types) return <Loader full />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Content Types</h1>
          <p className="muted">{types.length} type{types.length === 1 ? '' : 's'}</p>
        </div>
      </div>

      <div className="card no-pad">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Articles</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {types.length === 0 && (
              <tr>
                <td colSpan={3} className="muted" style={{ padding: '24px', textAlign: 'center' }}>
                  No types yet — add one below.
                </td>
              </tr>
            )}
            {types.map((t) => {
              const count = counts[t.id] || 0;
              const isEditing = editingId === t.id;
              return (
                <tr key={t.id}>
                  <td className="cell-strong">
                    {isEditing ? (
                      <input
                        className="inline-rename-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(t.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                    ) : t.name}
                  </td>
                  <td>
                    {count > 0
                      ? `${count} article${count === 1 ? '' : 's'}`
                      : <span className="muted">—</span>}
                  </td>
                  <td className="col-actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          disabled={busy || !editName.trim()}
                          onClick={() => saveRename(t.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="icon-btn"
                          title="Rename"
                          onClick={() => { setEditingId(t.id); setEditName(t.name); }}
                        >
                          <IconEdit />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          title={count > 0 ? `Used by ${count} article${count === 1 ? '' : 's'} — cannot delete` : 'Delete'}
                          disabled={count > 0 || busy}
                          onClick={() => handleDelete(t.id)}
                        >
                          <IconTrash />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <form className="type-add-row" onSubmit={addType}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New type name…"
          />
          <button type="submit" className="btn btn--primary btn--sm" disabled={busy || !newName.trim()}>
            <IconPlus /> Add
          </button>
        </form>
      </div>
    </div>
  );
}
