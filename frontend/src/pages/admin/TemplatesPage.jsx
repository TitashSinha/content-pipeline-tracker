import { useEffect, useState } from 'react';
import { api } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import TemplateForm from '../../components/admin/TemplateForm.jsx';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';
import { useToast } from '../../components/Toast.jsx';
import { formatTTW } from '../../lib/utils.js';
import { Button, IconButton, Card } from '../../components/ui/index.js';
import { IconPlus, IconEdit, IconTrash } from '../../lib/icons.jsx';

export default function TemplatesPage() {
  const toast = useToast();
  const [templates, setTemplates] = useState(null);
  const [types, setTypes] = useState([]);
  const [editing, setEditing] = useState(undefined); // undefined=closed, null=new, obj=edit
  const [deleting, setDeleting] = useState(null);
  const [delBusy, setDelBusy] = useState(false);

  async function load() {
    const [t, ty] = await Promise.all([api.listTemplates(), api.listTypes()]);
    setTemplates(t);
    setTypes(ty);
  }
  useEffect(() => { load(); }, []);

  const typeName = (id) => types.find((t) => t.id === id)?.name;

  async function confirmDelete() {
    setDelBusy(true);
    try {
      await api.deleteTemplate(deleting.id);
      toast.success('Template deleted');
      setDeleting(null);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDelBusy(false);
    }
  }

  if (!templates) return <Loader full />;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Templates</h1>
          <p className="text-muted">{templates.length} reusable brief{templates.length === 1 ? '' : 's'}</p>
        </div>
        <Button onClick={() => setEditing(null)}>
          <IconPlus /> New template
        </Button>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          title="No templates yet"
          message="Create a reusable brief to speed up new assignments — set it as a client default to auto-fill the form."
          action={<Button onClick={() => setEditing(null)}><IconPlus /> New template</Button>}
        />
      ) : (
        <Card noPad>
          <table className="table">
            <thead>
              <tr><th>Name</th><th>Content type</th><th>Word count</th><th>TTW</th><th aria-label="Actions" /></tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td className="font-semibold">{t.name}</td>
                  <td>{typeName(t.articleTypeId) ?? <span className="text-muted">—</span>}</td>
                  <td>{t.wordCountTarget ?? <span className="text-muted">—</span>}</td>
                  <td>{t.ttwTargetMinutes != null ? formatTTW(t.ttwTargetMinutes) : <span className="text-muted">—</span>}</td>
                  <td className="col-actions">
                    <IconButton title="Edit" onClick={() => setEditing(t)}><IconEdit /></IconButton>
                    <IconButton tone="danger" title="Delete" onClick={() => setDeleting(t)}><IconTrash /></IconButton>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {editing !== undefined && (
        <TemplateForm
          template={editing}
          types={types}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete template"
          message={`Delete the template “${deleting.name}”? Any client using it as a default brief will be cleared.`}
          busy={delBusy}
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
