import { useCallback, useEffect, useState } from 'react';
import { useBlocker } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import { IconClose } from '../lib/icons.jsx';
import { Button, IconButton } from './ui/index.js';

// FEATURE: Unsaved Changes Detection
// While `dirty` is true the modal guards every exit:
//   • backdrop / ✕ / Esc  → in-modal "Discard changes?" prompt (below)
//   • in-app route change  → React Router's useBlocker (e.g. the Back button)
//   • refresh / tab close  → beforeunload
// Clicking an in-app link is already prevented by the full-screen overlay — the
// click lands on the backdrop, which routes through the same discard prompt.
// Wrap your conditional <Modal /> render in this for enter+exit animations.
export function ModalPresence({ open, children }) {
  return <AnimatePresence>{open && children}</AnimatePresence>;
}

export default function Modal({ title, onClose, children, footer, wide, dirty = false }) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  // Block router navigations (most importantly the browser Back button) while
  // there are unsaved edits, surfacing the same discard prompt.
  const blocker = useBlocker(dirty);
  const navBlocked = blocker.state === 'blocked';
  const promptOpen = confirmDiscard || navBlocked;

  const requestClose = useCallback(() => {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }, [dirty, onClose]);

  // Warn before refresh / tab close while dirty.
  useEffect(() => {
    if (!dirty) return undefined;
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  // Esc dismisses the prompt if open, otherwise requests a close.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (confirmDiscard) setConfirmDiscard(false);
      else if (navBlocked) blocker.reset();
      else requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmDiscard, navBlocked, blocker, requestClose]);

  function keepEditing() {
    if (navBlocked) blocker.reset();
    setConfirmDiscard(false);
  }
  function discard() {
    if (navBlocked) { blocker.proceed(); return; } // let the navigation through
    setConfirmDiscard(false);
    onClose();
  }

  return (
    <div className="modal-overlay" onMouseDown={requestClose}>
      <div className={`modal ${wide ? 'modal--wide' : ''}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <IconButton onClick={requestClose} aria-label="Close"><IconClose /></IconButton>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}

        {promptOpen && (
          <div className="modal-discard" onMouseDown={(e) => e.stopPropagation()}>
            <div className="modal-discard-card">
              <h4>Discard changes?</h4>
              <p className="text-muted">Your edits haven&rsquo;t been saved yet.</p>
              <div className="modal-discard-actions">
                <Button variant="ghost" onClick={keepEditing}>Keep editing</Button>
                <Button variant="danger" onClick={discard}>Discard</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
