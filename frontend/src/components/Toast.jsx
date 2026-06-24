import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { d, ease } from '../lib/motion.js';
import { IconCheck, IconClose, IconInfo } from '../lib/icons.jsx';

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const LIFESPAN = 3000; // ms — matches the progress-bar animation
const MAX_VISIBLE = 2;

const ICONS = {
  success: <IconCheck />,
  error: <IconClose />,
  info: <IconInfo />,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, type) => {
    const id = Date.now() + Math.random();
    // Keep at most MAX_VISIBLE toasts; newest win.
    setToasts((list) => [...list, { id, message, type }].slice(-MAX_VISIBLE));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), LIFESPAN);
  }, []);

  const toast = useMemo(
    () => ({
      success: (m) => push(m, 'success'),
      error: (m) => push(m, 'error'),
      info: (m) => push(m, 'info'),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-stack">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              className={`toast toast--${t.type}`}
              role="status"
              initial={{ opacity: 0, x: 32, scale: 0.96 }}
              animate={{ opacity: 1, x: 0,  scale: 1    }}
              exit={{    opacity: 0, x: 24, scale: 0.97, transition: { duration: d.fast } }}
              transition={{ duration: d.enter, ease: ease.out }}
            >
              <span className="toast-icon">{ICONS[t.type] ?? ICONS.info}</span>
              <span className="toast-msg">{t.message}</span>
              <span className="toast-progress" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
