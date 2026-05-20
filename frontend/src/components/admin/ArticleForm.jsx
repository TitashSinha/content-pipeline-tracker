import { useState, useEffect } from 'react'

const EMPTY = { title: '', clientId: '', articleTypeId: '', assignedWriterId: '', deadline: '' }

export default function ArticleForm({ mode, article, writers, clients, articleTypes, onSave, onClose }) {
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Pre-populate when editing
  useEffect(() => {
    if (mode === 'edit' && article) {
      setForm({
        title:            article.title,
        clientId:         String(article.clientId),
        articleTypeId:    String(article.articleTypeId),
        assignedWriterId: String(article.assignedWriterId),
        deadline:         article.deadline ? article.deadline.slice(0, 10) : '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [mode, article])

  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  function field(key) {
    return { value: form[key], onChange: (e) => setForm(f => ({ ...f, [key]: e.target.value })), disabled: saving }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim() || !form.clientId || !form.articleTypeId || !form.assignedWriterId) {
      setError('Please fill in all required fields.')
      return
    }

    setSaving(true)
    try {
      await onSave({
        title:            form.title.trim(),
        clientId:         parseInt(form.clientId),
        articleTypeId:    parseInt(form.articleTypeId),
        assignedWriterId: parseInt(form.assignedWriterId),
        deadline:         form.deadline || null,
      })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose() }}>
      <div className="modal" role="dialog" aria-modal="true">

        <div className="modal-header">
          <h3>{mode === 'create' ? 'New Article' : 'Edit Article'}</h3>
          <button className="modal-close" onClick={onClose} disabled={saving} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <p className="form-error" role="alert">{error}</p>}

            <div className="field">
              <label className="field-label" htmlFor="af-title">
                Title <span className="required">*</span>
              </label>
              <input id="af-title" className="field-input" type="text" {...field('title')} />
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label" htmlFor="af-client">
                  Client <span className="required">*</span>
                </label>
                <select id="af-client" className="field-input" {...field('clientId')}>
                  <option value="">Select client…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="af-type">
                  Article Type <span className="required">*</span>
                </label>
                <select id="af-type" className="field-input" {...field('articleTypeId')}>
                  <option value="">Select type…</option>
                  {articleTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label className="field-label" htmlFor="af-writer">
                  Assign to <span className="required">*</span>
                </label>
                <select id="af-writer" className="field-input" {...field('assignedWriterId')}>
                  <option value="">Select writer…</option>
                  {writers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              <div className="field">
                <label className="field-label" htmlFor="af-deadline">Deadline</label>
                <input id="af-deadline" className="field-input" type="date" {...field('deadline')} />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : mode === 'create' ? 'Create Article' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
