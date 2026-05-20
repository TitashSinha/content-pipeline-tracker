import { useEffect } from 'react'

export default function ConfirmDialog({ title, message, onConfirm, onCancel, confirming }) {
  // Close on Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && !confirming) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, confirming])

  return (
    <div className="modal-overlay">
      <div className="modal modal--sm" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h3>{title}</h3>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onCancel} disabled={confirming}>
            Cancel
          </button>
          <button className="btn-danger" onClick={onConfirm} disabled={confirming}>
            {confirming ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
